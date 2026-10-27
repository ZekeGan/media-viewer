import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Alert, Badge, Button, Checkbox, Group, Modal, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import type { CleanupPreview, FolderRow, LegacyPreview, Project, ProjectInput, Request, Response, Snapshot } from '../shared/model'
import { Editor } from './Editor'
import { ProjectSettings } from './ProjectSettings'
import { DesktopShell } from './DesktopShell'
import { Toasts } from './Toasts'
import { saveCardPreset, visibleCells } from '../shared/layouts'
import { BrowseWorkspace } from './BrowseWorkspace'
import { contentCells, type ExplorerRequest, type ExplorerResponse } from '../shared/explorer'
import type { WorkspacePrefs } from '../shared/workspace'

const categories = [{ value: 'manga', label: '漫畫' }, { value: 'album', label: '相簿' }, { value: 'game', label: '遊戲' }, { value: 'video', label: '影片' }, { value: 'music', label: '音樂' }, { value: 'other', label: '其他' }]
const empty: Snapshot = { projects: [], rows: [], problems: [], progress: { visited: 0, created: 0, errors: 0, active: false, cancelled: false }, legacyAvailable: false }
type Act = (request: Request) => Promise<Response | undefined>
function Depth({ depth, change }: { depth: Project['depth']; change: (d: Project['depth']) => void }) {
  return <Group align="end"><Select label="顯示模式（根為第 1 層）" value={depth.mode} data={[{ value: 'through', label: '顯示第 1 至 N 層' }, { value: 'exact', label: '只顯示第 N 層' }]} onChange={v => change({ ...depth, mode: v as 'through' | 'exact' })} /><NumberInput label="N 層" min={1} max={50} value={depth.level} onChange={v => typeof v === 'number' && change({ ...depth, level: v })} /></Group>
}
export function App() {
  const [snapshot, setSnapshot] = useState(empty), [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false), busyRef = useRef(false), [notice, setNoticeState] = useState(''), [noticeVersion,setNoticeVersion]=useState(0), [failed, setFailed] = useState(false)
  const setNotice=useCallback((text:string)=>{setNoticeState(text);setNoticeVersion(v=>v+1)},[])
  const dismissNotice=useCallback(()=>setNoticeState(''),[])
  const [settingsOverlay,setSettingsOverlay]=useState(false)
  const [toolbarTarget,setToolbarTarget]=useState<HTMLDivElement|null>(null)
  const [createOpen, setCreateOpen] = useState(false), [input, setInput] = useState<ProjectInput>({ name: '我的媒體', mediaCategory: 'manga', depth: { mode: 'through', level: 50 },scanAll:true })
  const [rootChoice,setRootChoice]=useState<{token:string;path:string}>(),[createGroup,setCreateGroup]=useState(''),[groups,setGroups]=useState<WorkspacePrefs['groups']>([]),[settingsOpen,setSettingsOpen]=useState(false)
  useEffect(()=>{if(createOpen)void window.desktop.workspace().then(r=>setGroups(r.prefs.groups)).catch(e=>{setFailed(true);setNotice(String(e))})},[createOpen,setNotice])
  const [templateCategory,setTemplateCategory]=useState<string>(); const [settings, setSettings] = useState<Project>(), [editor, setEditor] = useState(false), [detailsId, setDetailsId] = useState<string>(), [problems, setProblems] = useState(false)
  const [detailDirty, setDetailDirty] = useState(false), [editorDirty, setEditorDirty] = useState(false)
  const [shellDirty, setShellDirty] = useState(false), [shellOverlay, setShellOverlay] = useState(false)
  const [cleanup, setCleanup] = useState<CleanupPreview>(), [restart, setRestart] = useState(false), [legacy, setLegacy] = useState<LegacyPreview>(), [legacyIds, setLegacyIds] = useState<string[]>([])
  const act: Act = useCallback(async request => {
    if (busyRef.current && request.action !== 'cancelScan') return
    const ownBusy = request.action !== 'cancelScan'
    if (ownBusy) { busyRef.current = true; setBusy(true) }
    try {
      const result = await window.media.request(request)
      setSnapshot(result.snapshot)
      if(!['snapshot','scan'].includes(request.action)){setNotice('');setFailed(false)}
      if(result.message){setNotice(result.message);setFailed(true)}
      if(result.preview?.scope==='all'){setCleanup(result.preview);setRestart(false)}
      if(result.cleanup?.failed.length){setNotice('部分資料清理失敗：'+result.cleanup.failed.join('\n'));setFailed(true)}
      if (result.legacy) { setLegacy(result.legacy); setLegacyIds([]) }
      return result
    } catch (error) { setNotice(String(error)); setFailed(true) }
    finally { if (ownBusy) { busyRef.current = false; setBusy(false) } }
  }, [])
  useEffect(() => { act({ action: 'snapshot' }); return window.media.onProgress(progress => setSnapshot(s => ({ ...s, progress }))) }, [act])
  useEffect(() => { if (selected && !snapshot.projects.some(p => p.projectId === selected)) setSelected('') }, [snapshot.projects, selected])
  const modalOpen = createOpen || settingsOpen || !!settings || editor || detailDirty || !!cleanup || !!legacy || problems || shellOverlay || settingsOverlay
  useEffect(() => { const focus = () => { if (selected && !modalOpen && !busyRef.current && !document.querySelector('.mantine-Modal-content,.mantine-Drawer-content,.reader')) act({ action: 'scan' }) }; window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus) }, [modalOpen, selected, act])
  const linked = snapshot.projects.find(p => p.projectId === selected), project = linked?.project
  const settingsDirty = !!settings && JSON.stringify(settings) !== JSON.stringify(snapshot.projects.find(p => p.projectId === settings.projectId)?.project)
  const dirty = detailDirty || editorDirty || settingsDirty || createOpen || shellDirty
  const clearEditors = () => { setEditor(false);setTemplateCategory(undefined); setDetailsId(undefined); setSettings(undefined);setSettingsOpen(false) }
  const confirmLeave = () => !dirty || window.confirm('離開會放棄尚未保存的草稿，確定繼續？')
  const openProject = (id: string, rowId?: string, confirmed = false) => {
    if (!confirmed && !confirmLeave()) return false
    clearEditors(); setCreateOpen(false); setSelected(id)
    if (rowId) setDetailsId(rowId)
    return true
  }
  const beginCreate = () => { if (confirmLeave()) { clearEditors();setRootChoice(undefined);setCreateGroup('');setCreateOpen(true) } }
  const beginLink = async () => {
    if (!confirmLeave()) return
    clearEditors()
    const before = new Set(snapshot.projects.map(p => p.projectId)), result = await act({ action: 'link' })
    if (result && !result.cancelled) { const next = result.snapshot.projects.find(p => !before.has(p.projectId)) ?? result.snapshot.projects.at(-1); if (next) openProject(next.projectId, undefined, true) }
  }
  useLayoutEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty || busyRef.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])
  const rows = useMemo(() => snapshot.rows.filter(r => r.projectId === selected), [snapshot.rows, selected])
  const chooseDetail=(id:string)=>{setDetailsId(id);return true}
  const closeDetail=()=>setDetailsId(undefined)
  const explore=async(request:ExplorerRequest):Promise<ExplorerResponse|undefined>=>{if(busyRef.current)return;busyRef.current=true;setBusy(true);try{const r=await window.explorer.request(request);if(r.snapshot)setSnapshot(r.snapshot);if(r.message&&/失敗|錯誤|略過|無法|不完整|警告/.test(r.message)){setNotice(r.message);setFailed(true)}return r}catch(e){setNotice(String(e));setFailed(true)}finally{busyRef.current=false;setBusy(false)}}
  const notifyError=useCallback((message:string)=>{setFailed(true);setNotice(message)},[setNotice])
  const saveEdited=async(p:Project,preset?:{name:string;asNew:boolean})=>{
    try { const next=templateCategory?{...p,cells:project!.cells,contentCells:{...project!.contentCells,[templateCategory]:p.cells}}:saveCardPreset(p,preset??{name:'預設版面',asNew:false},()=>crypto.randomUUID(),project!);return !!await act({action:'saveProject',project:next}) }
    catch(e){notifyError(String(e));return false}
  }
  return <><Toasts message={notice} error={failed} version={noticeVersion} close={dismissNotice} progress={snapshot.progress.active?<>{'掃描 '+snapshot.progress.visited+' 筆 · 已建立 '+snapshot.progress.created+' 筆'}<Button size="compact-xs" variant="subtle" onClick={()=>void act({action:'cancelScan'})}>取消掃描</Button></>:null}/><DesktopShell toolbarRef={setToolbarTarget} projects={snapshot.projects} rows={snapshot.rows} selected={selected} busy={busy} dirty={dirty} onSelect={openProject} onCreate={beginCreate} onSettings={()=>{if(confirmLeave())setSettingsOpen(true)}} onProjectSettings={id=>{if(confirmLeave()){const p=snapshot.projects.find(p=>p.projectId===id)?.project;if(p)setSettings(structuredClone(p))}}} onLink={() => void beginLink()} onProblems={() => setProblems(true)} onOverlay={setShellOverlay} onDirty={setShellDirty} onSnapshot={setSnapshot}
    status={snapshot.progress.active ? `掃描 ${snapshot.progress.visited} 筆 · 已建 ${snapshot.progress.created} · 問題 ${snapshot.progress.errors}` : busy ? '處理中…' : dirty ? '尚未保存' : '就緒'}
    footer={<>{snapshot.legacyAvailable && <Button variant="subtle" size="xs" onClick={() => act({ action: 'legacyPreview' })}>檢視舊資料匯入</Button>}<Button color="red" variant="subtle" size="xs" disabled={busy || dirty} onClick={() => act({ action: 'cleanupAllPreview' })}>清理全部已連結資料</Button></>}
    banner={null}>
      {editor && project ? <Editor key={`${project.projectId}:${templateCategory??"card"}`} presets={!templateCategory} targetLabel={templateCategory?`${categories.find(c=>c.value===templateCategory)?.label??"媒體"}資訊版面`:"卡片"} onDirty={setEditorDirty} project={templateCategory?{...project,cells:contentCells(project,templateCategory)}:{...project,cells:visibleCells(project)}} rows={(snapshot.structure??snapshot.rows).filter(r=>r.projectId===selected&&!r.readonly)} busy={busy} save={saveEdited} close={()=>{setEditor(false);setTemplateCategory(undefined)}}/> : project && !linked?.error ? <BrowseWorkspace toolbarTarget={toolbarTarget} key={project.projectId} project={project} root={linked!.root} rows={rows} structure={(snapshot.structure??snapshot.rows).filter(r=>r.projectId===selected)} selected={detailsId} onSelect={chooseDetail} onClose={closeDetail} busy={busy} act={act} run={explore} onDirty={setDetailDirty} onOverlay={setSettingsOverlay} notify={notifyError} edit={category=>{if(!detailDirty||window.confirm("放棄欄位草稿後編輯版面？")){setTemplateCategory(category);setEditor(true)}}} /> : <div className="empty"><h1>專案暫不可用</h1><p className="path">{linked?.root}</p><p>資料夾可能已搬移、離線，或記錄需要復原。</p><Alert color="orange" mt="lg">{linked?.error ?? '請選擇專案或重新連結。'}</Alert><Group justify="center" mt="md"><Button disabled={busy} onClick={beginLink}>重新連結專案位置</Button>{linked && <><Button color="orange" variant="light" disabled={busy} onClick={() => window.confirm('從有效備份恢復根記錄與專案設定？目前損壞檔會另外保留。') && act({ action: 'restoreProject', projectId: linked.projectId })}>從備份復原專案</Button><Button variant="default" disabled={busy} onClick={() => act({ action: 'unlink', projectId: linked.projectId })}>取消失效連結（保留可攜檔）</Button></>}</Group></div>}
    </DesktopShell>
    <Modal opened={createOpen} onClose={()=>{if(!busy&&window.confirm('取消建立專案？尚未建立資料。'))setCreateOpen(false)}} title="建立媒體專案" size="lg"><Stack><TextInput label="專案名稱" value={input.name} maxLength={100} onChange={e=>setInput({...input,name:e.currentTarget.value})}/><Select label="媒體分類" data={categories} value={input.mediaCategory} onChange={v=>setInput({...input,mediaCategory:v??'other'})}/><Button variant="default" disabled={busy} onClick={async()=>{const result=await act({action:'chooseRoot'});if(result?.rootSelection)setRootChoice(result.rootSelection)}}>選擇資料夾</Button><p className="path" aria-label="已選資料夾">{rootChoice?.path??'尚未選擇資料夾'}</p><Select label="所屬群組" disabled={!rootChoice} value={createGroup} allowDeselect={false} data={[{value:'',label:'未分類'},...groups.map(g=>({value:g.id,label:g.name}))]} onChange={v=>setCreateGroup(v??'')}/><small>預設 CARD 多層／全部。完成後掃描允許範圍並建立隱藏可攜記錄；原始媒體保留，遊戲 ROOT 內部受保護。</small><Button loading={busy} disabled={!rootChoice||!input.name.trim()} onClick={async()=>{const result=await act({action:'create',input,rootToken:rootChoice!.token});if(result&&!result.cancelled){const id=result.snapshot.projects.at(-1)?.projectId;if(id){if(createGroup)try{await window.desktop.updateWorkspace({action:'moveProject',projectId:id,groupId:createGroup})}catch(e){notifyError('專案已建立，但群組保存失敗：'+String(e))}openProject(id,undefined,true)}}}}>完成建立</Button></Stack></Modal>
    <Modal opened={settingsOpen} onClose={()=>setSettingsOpen(false)} title="應用程式設定" size="md"><Stack><h3>連結與維護</h3><Button variant="default" disabled={busy} onClick={()=>void beginLink()}>重新連結專案</Button>{snapshot.legacyAvailable&&<Button variant="default" disabled={busy} onClick={()=>{setSettingsOpen(false);void act({action:'legacyPreview'})}}>檢視舊資料匯入</Button>}<Button variant="subtle" color="red" disabled={busy} onClick={()=>{setSettingsOpen(false);void act({action:'cleanupAllPreview'})}}>清理全部已連結資料</Button></Stack></Modal>
    <Modal opened={!!settings} onClose={()=>{if(!busy&&(!settingsDirty||window.confirm('放棄尚未保存的專案設定？')))setSettings(undefined)}} title={'專案設定 · '+(snapshot.projects.find(p=>p.projectId===settings?.projectId)?.project?.name??'')} size="lg">{settings&&<ProjectSettings key={settings.projectId} project={settings} root={snapshot.projects.find(p=>p.projectId===settings.projectId)?.root??''} busy={busy} dirty={settingsDirty} categories={categories} change={setSettings} act={act} close={()=>setSettings(undefined)}/>}</Modal>
    <Modal opened={problems} onClose={() => setProblems(false)} title="問題與復原" size="xl"><Stack><p>唯讀／損壞項目可從列表詳情重試或恢復；重複 ID 的副本可另配新 ID。根失效時使用「重新連結專案」。</p>{[...snapshot.problems, ...rows.filter(r => r.duplicate).map(r => `${r.path}: ${r.error}`)].map((text, i) => <Alert key={i} color="orange">{text}</Alert>)}{!snapshot.problems.length && !rows.some(r => r.duplicate) && <p>目前沒有已知問題。</p>}<Button loading={busy} onClick={() => act({ action: 'scan' })}>重新掃描並重建列表</Button></Stack></Modal>
    <Modal opened={!!cleanup} onClose={() => setCleanup(undefined)} title="清理預覽：原始媒體不刪除" size="xl">{cleanup && <Stack><p>範圍：{cleanup.scope === 'all' ? '全部已連結可存取資料；完成後退出連結' : cleanup.scope === 'private' ? '本專案私有覆寫' : '此資料夾全部程式資料'}。找到 {cleanup.count} 筆記錄。</p><div className="file-list">{cleanup.paths.map(p => <div key={p}>{p}</div>)}</div><Alert color="orange">未連結／離線副本不在本次範圍。未知檔案與無法驗證的記錄保留。{cleanup.skipped.map((s, i) => <div key={i}>{s}</div>)}</Alert>{cleanup.scope === 'folder' && <Checkbox label="清除後立即重新開始記錄（預設為停止記錄）" checked={restart} onChange={e => setRestart(e.currentTarget.checked)}/>}<Button color="red" loading={busy} onClick={async () => { if (await act({ action: 'cleanup', token: cleanup.token, restart })) { setCleanup(undefined); setDetailsId(undefined) } }}>確認清理列出的本程式資料</Button></Stack>}</Modal>
    <Modal opened={!!legacy} onClose={() => setLegacy(undefined)} title="舊資料匯入預覽" size="xl">{legacy && <Stack>{legacy.warnings.map((w, i) => <Alert key={i} color="orange">{w}</Alert>)}{legacy.projects.map(p => <Checkbox key={p.id} checked={legacyIds.includes(p.id)} onChange={e => setLegacyIds(e.currentTarget.checked ? [...legacyIds, p.id] : legacyIds.filter(id => id !== p.id))} label={`${p.name} · ${p.root} · ${p.values} 筆`}/>)}<Depth depth={input.depth} change={depth => setInput({ ...input, depth })}/><Button loading={busy} disabled={!legacyIds.length} onClick={async () => { if (await act({ action: 'legacyImport', token: legacy.token, ids: legacyIds, depth: input.depth })) setLegacy(undefined) }}>備份舊檔並匯入選定專案</Button></Stack>}</Modal>
  </>
}



