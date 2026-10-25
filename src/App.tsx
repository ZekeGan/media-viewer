import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Checkbox, Drawer, Group, Modal, NumberInput, Pagination, Select, Stack, TextInput, Textarea } from '@mantine/core'
import type { CleanupPreview, FolderRow, LegacyPreview, Project, ProjectInput, Request, Response, Snapshot } from '../shared/model'
import { Card } from './Card'
import { Editor } from './Editor'
import { filterRows, sortRows } from '../shared/search'

const categories = [{ value: 'manga', label: '漫畫' }, { value: 'album', label: '相簿' }, { value: 'game', label: '遊戲' }, { value: 'video', label: '影片' }, { value: 'music', label: '音樂' }, { value: 'other', label: '其他' }]
const empty: Snapshot = { projects: [], rows: [], problems: [], progress: { visited: 0, created: 0, errors: 0, active: false, cancelled: false }, legacyAvailable: false }
type Act = (request: Request) => Promise<Response | undefined>
function Depth({ depth, change }: { depth: Project['depth']; change: (d: Project['depth']) => void }) {
  return <Group align="end"><Select label="顯示模式（根為第 1 層）" value={depth.mode} data={[{ value: 'through', label: '顯示第 1 至 N 層' }, { value: 'exact', label: '只顯示第 N 層' }]} onChange={v => change({ ...depth, mode: v as 'through' | 'exact' })} /><NumberInput label="N 層" min={1} max={50} value={depth.level} onChange={v => typeof v === 'number' && change({ ...depth, level: v })} /></Group>
}
function Details({ row, project, act, busy, cleanup, onDirty }: { row: FolderRow; project: Project; act: Act; busy: boolean; cleanup: (scope: 'folder' | 'private') => void; onDirty: (dirty: boolean) => void }) {
  const fields = useMemo(() => [...new Map([...project.fieldBindings.filter(f => f.type === 'string').map(f => [f.attributeId, f.alias] as const), ...(row.record?.attributes.filter(a => a.type === 'string').map(a => [a.attributeId, a.key] as const) ?? [])]).entries()], [project, row])
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([id]) => [id, String(row.record?.attributes.find(a => a.attributeId === id)?.value ?? '')])))
  const dirty = fields.some(([id]) => (values[id] ?? '') !== String(row.record?.attributes.find(a => a.attributeId === id)?.value ?? ''))
  useLayoutEffect(() => { onDirty(dirty); return () => onDirty(false) }, [dirty, onDirty])
  const disabled = busy || row.stopped || !!row.error || !row.record
  return <Stack>
    <p className="path">{row.path}</p><Group><Badge color={row.error ? 'red' : row.stopped ? 'gray' : 'teal'}>{row.error ? '需要處理' : row.stopped ? '停止記錄' : '可攜記錄正常'}</Badge><Button size="xs" variant="light" onClick={() => act({ action: 'open', rowId: row.rowId })}>開啟資料夾</Button></Group>
    {row.error && <Alert color="orange">{row.error}</Alert>}
    <p className="muted">修改共用值會影響所有引用此資料夾的專案。未保存時離開側欄會放棄草稿。</p>
    {fields.map(([id, label]) => <Textarea key={id} label={label} autosize minRows={1} maxRows={5} disabled={disabled} value={values[id] ?? ''} onChange={e => setValues({ ...values, [id]: e.currentTarget.value })} />)}
    <Button disabled={disabled} onClick={() => act({ action: 'saveFolder', rowId: row.rowId, revision: row.record!.revision, values })}>保存共用文字</Button>
    <h3>可攜圖片原檔</h3><div className="images">{row.record?.assets.map(a => <figure key={a.assetId}><img src={`media://asset/${row.rowId}/${a.assetId}`} alt={a.originalName}/><figcaption>{a.originalName}</figcaption></figure>)}</div>
    <Button variant="light" disabled={disabled || dirty} onClick={() => act({ action: 'image', rowId: row.rowId, revision: row.record!.revision })}>選擇圖片並保存原檔</Button>{dirty && <small>先保存文字，再新增圖片，避免丟失文字草稿。</small>}
    <details><summary>全部已存屬性與來源</summary><pre>{JSON.stringify(row.record, null, 2) ?? '尚無可攜記錄'}</pre></details>
    {row.stopped && <Button variant="light" onClick={() => act({ action: 'resume', rowId: row.rowId })}>重新啟用記錄</Button>}
    {row.duplicate && <Button color="orange" onClick={() => window.confirm('確認這筆是副本？會保留其值並分配新的資料夾 ID。') && act({ action: 'copyIdentity', rowId: row.rowId })}>這筆是副本，另配新 ID</Button>}
    {row.duplicate && <p>若是搬移，請確認舊位置已移除，再重新掃描；若是整個專案根副本，先取消舊連結。</p>}
    {row.error && !row.duplicate && <Button color="orange" variant="light" onClick={() => window.confirm('從上一個有效備份恢復？目前檔案會另存為 damaged 副本。') && act({ action: 'restore', rowId: row.rowId })}>從上一版備份恢復</Button>}
    <Button variant="light" color="red" disabled={busy} onClick={() => cleanup('folder')}>預覽清除此資料夾資料</Button>
    {!!row.record?.projectOverrides[project.projectId]?.length && <Button variant="subtle" color="red" onClick={() => cleanup('private')}>只清此專案私有覆寫</Button>}
  </Stack>
}

export function App() {
  const [snapshot, setSnapshot] = useState(empty), [selected, setSelected] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false), busyRef = useRef(false), [notice, setNotice] = useState(''), [failed, setFailed] = useState(false)
  const [createOpen, setCreateOpen] = useState(false), [input, setInput] = useState<ProjectInput>({ name: '我的媒體', mediaCategory: 'manga', depth: { mode: 'through', level: 2 } })
  const [settings, setSettings] = useState<Project>(), [editor, setEditor] = useState(false), [detailsId, setDetailsId] = useState<string>(), [problems, setProblems] = useState(false)
  const [detailDirty, setDetailDirty] = useState(false), [editorDirty, setEditorDirty] = useState(false)
  const [cleanup, setCleanup] = useState<CleanupPreview>(), [restart, setRestart] = useState(false), [legacy, setLegacy] = useState<LegacyPreview>(), [legacyIds, setLegacyIds] = useState<string[]>([])
  const act: Act = useCallback(async request => {
    if (busyRef.current && request.action !== 'cancelScan') return
    const ownBusy = request.action !== 'cancelScan'
    if (ownBusy) { busyRef.current = true; setBusy(true) }
    try {
      const result = await window.media.request(request)
      setSnapshot(result.snapshot); setFailed(false)
      if (result.message) setNotice(result.message)
      else if (request.action !== 'snapshot' && request.action !== 'scan' && request.action !== 'cancelScan') setNotice('操作完成')
      if (result.preview) { setCleanup(result.preview); setRestart(false) }
      if (result.cleanup) setNotice(`清理完成 ${result.cleanup.removed} 筆\n${[...result.cleanup.failed, ...result.cleanup.skipped].join('\n') || '原始媒體保留；未連結與離線副本不在本次範圍。'}`)
      if (result.legacy) { setLegacy(result.legacy); setLegacyIds([]) }
      return result
    } catch (error) { setNotice(String(error)); setFailed(true) }
    finally { if (ownBusy) { busyRef.current = false; setBusy(false) } }
  }, [])
  useEffect(() => { act({ action: 'snapshot' }); return window.media.onProgress(progress => setSnapshot(s => ({ ...s, progress }))) }, [act])
  useEffect(() => { if (!snapshot.projects.some(p => p.projectId === selected)) setSelected(snapshot.projects[0]?.projectId ?? '') }, [snapshot.projects, selected])
  const modalOpen = createOpen || !!settings || editor || !!detailsId || !!cleanup || !!legacy || problems
  useEffect(() => { const focus = () => { if (!modalOpen && !busyRef.current) act({ action: 'scan' }) }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus) }, [modalOpen, act])
  const linked = snapshot.projects.find(p => p.projectId === selected), project = linked?.project
  const settingsDirty = !!settings && JSON.stringify(settings) !== JSON.stringify(snapshot.projects.find(p => p.projectId === settings.projectId)?.project)
  const dirty = detailDirty || editorDirty || settingsDirty || createOpen
  useLayoutEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty || busyRef.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])
  const rows = useMemo(() => snapshot.rows.filter(r => r.projectId === selected), [snapshot.rows, selected])
  const sorted = useMemo(() => sortRows(rows), [rows])
  const matches = useMemo(() => filterRows(sorted, query), [sorted, query])
  const pageSize = project?.list.pageSize ?? 100, pages = Math.max(1, Math.ceil(matches.length / pageSize))
  useEffect(() => setPage(1), [query, selected, pageSize])
  useEffect(() => setPage(p => Math.min(p, pages)), [pages])
  const detail = rows.find(r => r.rowId === detailsId)
  return <div className="shell">
    <header className="topbar"><div className="brand">◫ <strong>Media Viewer</strong><Badge variant="light">POC</Badge>{dirty && <Badge color="orange" variant="light">尚未保存</Badge>}</div><Group><Button variant="default" onClick={() => setCreateOpen(true)} disabled={busy || editor}>新增專案</Button><Button variant="light" onClick={() => act({ action: 'link' })} disabled={busy || editor}>重新連結專案</Button></Group></header>
    <div className="workspace"><nav className="project-nav"><h3>我的專案</h3>{snapshot.projects.map(p => <button key={p.projectId} disabled={busy} className={`project-link ${selected === p.projectId ? 'active' : ''}`} onClick={() => { if (dirty && !window.confirm('切換專案會放棄未保存的草稿，確定繼續？')) return; setSelected(p.projectId); setEditor(false); setDetailsId(undefined); setSettings(undefined) }}><strong>{p.project?.name ?? '待重新連結'}</strong><small>{p.root}</small>{p.error && <small className="error">{p.error}</small>}</button>)}{!snapshot.projects.length && <p className="muted">選擇資料夾，建立第一個媒體專案。</p>}<div className="nav-bottom">{snapshot.legacyAvailable && <Button variant="subtle" size="xs" onClick={() => act({ action: 'legacyPreview' })}>檢視舊資料匯入</Button>}<Button color="red" variant="subtle" size="xs" disabled={busy || dirty} onClick={() => act({ action: 'cleanupAllPreview' })}>清理全部已連結資料</Button></div></nav>
    <main className="content">
      {notice && <Alert color={failed ? 'red' : 'blue'} withCloseButton onClose={() => setNotice('')} mb="md"><div className="message">{notice}</div></Alert>}
      {(busy || snapshot.progress.cancelled) && <div className="scan-status">{snapshot.progress.active ? `掃描 ${snapshot.progress.visited} 筆 · 已建立 ${snapshot.progress.created} · 問題 ${snapshot.progress.errors}` : busy ? '處理中…' : '掃描已取消，已完成的記錄保留，可重新掃描'}{snapshot.progress.active && <Button size="xs" variant="subtle" onClick={() => act({ action: 'cancelScan' })}>取消掃描</Button>}</div>}
      {editor && project ? <Editor key={project.projectId} onDirty={setEditorDirty} project={project} rows={rows} busy={busy} save={async p => !!await act({ action: 'saveProject', project: p })} close={() => setEditor(false)} /> : project && !linked?.error ? <>
        <div className="page-title"><div><h1>{project.name}</h1><p className="path">{linked?.root}</p></div><Group><Button variant="default" disabled={busy} onClick={() => act({ action: 'scan' })}>重新掃描</Button><Button disabled={busy} onClick={() => setEditor(true)}>CELL 編輯器</Button><Button variant="default" onClick={() => setSettings(structuredClone(project))}>專案設定</Button></Group></div>
        <Group justify="space-between" mb="lg"><TextInput aria-label="搜尋名稱或路徑" placeholder="搜尋名稱或路徑中的任意文字" value={query} onChange={e => setQuery(e.currentTarget.value)} className="search"/><Group><span>{matches.length} 筆 · {project.depth.mode === 'exact' ? '只顯示' : '第 1 至'}第 {project.depth.level} 層</span><Button variant="light" color="orange" onClick={() => setProblems(true)}>問題 {snapshot.problems.length + rows.filter(r => r.duplicate).length}</Button></Group></Group>
        {matches.length ? <div className="cards" style={{ '--columns': project.list.itemsPerRow } as React.CSSProperties}>{matches.slice((page - 1) * pageSize, page * pageSize).map(row => <article key={row.rowId} className="folder-card"><Card project={project} row={row} open={() => act({ action: 'open', rowId: row.rowId })}/><div className="card-footer"><Badge color={row.error ? 'orange' : row.stopped ? 'gray' : 'teal'} variant="light">{row.error ? '需要處理' : row.stopped ? '停止記錄' : '已記錄'}</Badge><Button size="compact-sm" variant="subtle" onClick={() => setDetailsId(row.rowId)}>詳情／編輯</Button></div></article>)}</div> : <div className="empty"><h2>{query ? '沒有符合的資料夾' : '目前沒有可顯示的資料夾'}</h2><p>調整搜尋、深度設定或重新掃描。</p></div>}
        <Group justify="center" mt="xl"><Pagination total={pages} value={page} onChange={setPage}/><span>每頁 {pageSize} 筆</span></Group>
      </> : <div className="empty"><h1>把資料夾變成自己的媒體清單</h1><p>選擇資料夾與深度，再用 CELL 編輯器組裝每張卡片。</p><Button onClick={() => setCreateOpen(true)}>選擇資料夾並建立專案</Button>{linked?.error && <><Alert color="orange" mt="lg">{linked.error}</Alert><Button mt="md" color="orange" disabled={busy} onClick={() => window.confirm('從有效備份恢復根記錄與專案設定？目前損壞檔會另外保留。') && act({ action: 'restoreProject', projectId: linked.projectId })}>從備份復原專案</Button><Button mt="md" variant="default" onClick={() => act({ action: 'unlink', projectId: linked.projectId })}>取消失效連結（保留可攜檔）</Button></>}</div>}
    </main></div>
    <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="建立媒體專案" size="lg"><Stack><TextInput label="專案名稱" value={input.name} onChange={e => setInput({ ...input, name: e.currentTarget.value })}/><Select label="媒體分類" data={categories} value={input.mediaCategory} onChange={v => setInput({ ...input, mediaCategory: v ?? 'other' })}/><Depth depth={input.depth} change={depth => setInput({ ...input, depth })}/><p>下一步選根資料夾。掃描會建立隱藏可攜記錄，包括走訪到的祖先；原始媒體不會搬移。</p><Button loading={busy} onClick={async () => { const result = await act({ action: 'create', input }); if (result) { setCreateOpen(false); setSelected(result.snapshot.projects.at(-1)?.projectId ?? '') } }}>選擇資料夾並建立</Button></Stack></Modal>
    <Modal opened={!!settings} onClose={() => { if (!settingsDirty || window.confirm('放棄尚未保存的專案設定？')) setSettings(undefined) }} title="專案設定" size="lg">{settings && <Stack><TextInput label="名稱" value={settings.name} onChange={e => setSettings({ ...settings, name: e.currentTarget.value })}/><Select label="分類（不改資料夾原值）" data={categories} value={settings.mediaCategory} onChange={v => setSettings({ ...settings, mediaCategory: v ?? 'other' })}/><Depth depth={settings.depth} change={depth => setSettings({ ...settings, depth })}/><Group><NumberInput label="每列筆數（窄視窗自動減少）" min={1} max={6} value={settings.list.itemsPerRow} onChange={v => typeof v === 'number' && setSettings({ ...settings, list: { ...settings.list, itemsPerRow: v } })}/><NumberInput label="每頁筆數" min={1} max={500} value={settings.list.pageSize} onChange={v => typeof v === 'number' && setSettings({ ...settings, list: { ...settings.list, pageSize: v } })}/></Group><Button loading={busy} onClick={async () => { if (await act({ action: 'saveProject', project: settings })) setSettings(undefined) }}>保存並更新列表</Button><Button variant="subtle" color="red" onClick={async () => { if (await act({ action: 'unlink', projectId: settings.projectId })) setSettings(undefined) }}>取消專案連結（保留資料）</Button></Stack>}</Modal>
    <Drawer opened={!!detail} onClose={() => { if (!detailDirty || window.confirm('關閉詳情？尚未保存的文字草稿會放棄。')) setDetailsId(undefined) }} title={detail?.name} position="right" size="lg">{detail && project && <Details key={`${detail.rowId}:${detail.record?.revision}`} row={detail} project={project} act={act} busy={busy} onDirty={setDetailDirty} cleanup={scope => act({ action: 'cleanupPreview', rowId: detail.rowId, scope })}/>}</Drawer>
    <Modal opened={problems} onClose={() => setProblems(false)} title="問題與復原" size="xl"><Stack><p>唯讀／損壞項目可從列表詳情重試或恢復；重複 ID 的副本可另配新 ID。根失效時使用「重新連結專案」。</p>{[...snapshot.problems, ...rows.filter(r => r.duplicate).map(r => `${r.path}: ${r.error}`)].map((text, i) => <Alert key={i} color="orange">{text}</Alert>)}{!snapshot.problems.length && !rows.some(r => r.duplicate) && <p>目前沒有已知問題。</p>}<Button loading={busy} onClick={() => act({ action: 'scan' })}>重新掃描並重建列表</Button></Stack></Modal>
    <Modal opened={!!cleanup} onClose={() => setCleanup(undefined)} title="清理預覽：原始媒體不刪除" size="xl">{cleanup && <Stack><p>範圍：{cleanup.scope === 'all' ? '全部已連結可存取資料；完成後退出連結' : cleanup.scope === 'private' ? '本專案私有覆寫' : '此資料夾全部程式資料'}。找到 {cleanup.count} 筆記錄。</p><div className="file-list">{cleanup.paths.map(p => <div key={p}>{p}</div>)}</div><Alert color="orange">未連結／離線副本不在本次範圍。未知檔案與無法驗證的記錄保留。{cleanup.skipped.map((s, i) => <div key={i}>{s}</div>)}</Alert>{cleanup.scope === 'folder' && <Checkbox label="清除後立即重新開始記錄（預設為停止記錄）" checked={restart} onChange={e => setRestart(e.currentTarget.checked)}/>}<Button color="red" loading={busy} onClick={async () => { if (await act({ action: 'cleanup', token: cleanup.token, restart })) { setCleanup(undefined); setDetailsId(undefined) } }}>確認清理列出的本程式資料</Button></Stack>}</Modal>
    <Modal opened={!!legacy} onClose={() => setLegacy(undefined)} title="舊資料匯入預覽" size="xl">{legacy && <Stack>{legacy.warnings.map((w, i) => <Alert key={i} color="orange">{w}</Alert>)}{legacy.projects.map(p => <Checkbox key={p.id} checked={legacyIds.includes(p.id)} onChange={e => setLegacyIds(e.currentTarget.checked ? [...legacyIds, p.id] : legacyIds.filter(id => id !== p.id))} label={`${p.name} · ${p.root} · ${p.values} 筆`}/>)}<Depth depth={input.depth} change={depth => setInput({ ...input, depth })}/><Button loading={busy} disabled={!legacyIds.length} onClick={async () => { if (await act({ action: 'legacyImport', token: legacy.token, ids: legacyIds, depth: input.depth })) setLegacy(undefined) }}>備份舊檔並匯入選定專案</Button></Stack>}</Modal>
  </div>
}



