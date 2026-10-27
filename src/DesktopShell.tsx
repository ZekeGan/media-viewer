import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ActionIcon, Alert, Badge, Button, Group, Menu, Modal, Select, Stack, TextInput, Tooltip } from '@mantine/core'
import type { FolderRow, LinkedProject, Snapshot } from '../shared/model'
import { SearchDialog } from './SearchDialog'
import { defaultWorkspace, sectionIds, sectionProjects, type WorkspaceCommand, type WorkspaceState } from '../shared/workspace'

interface Props {
  projects: LinkedProject[]; rows: FolderRow[]; selected: string; busy: boolean; dirty: boolean
  onSelect: (projectId: string, rowId?: string) => boolean
  onCreate: () => void; onLink: () => void; onProblems: () => void
  onSettings:()=>void
  onOverlay: (value: boolean) => void; onDirty: (value: boolean) => void
  onSnapshot: (snapshot:Snapshot)=>void
  footer: ReactNode; banner: ReactNode; status: string; children: ReactNode
}
const title = (p: LinkedProject) => p.project?.name ?? '待重新連結'
export function DesktopShell(props: Props) {
  const { projects, selected, onOverlay, onDirty } = props
  const [workspace, setWorkspace] = useState<WorkspaceState>({ prefs: defaultWorkspace() })
  const [ready, setReady] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState('')
  const [maximized, setMaximized] = useState(false), [liveWidth, setLiveWidth] = useState<number>()
  const [form, setForm] = useState<{ id?: string; original: string }>(), [name, setName] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [dragging, setDragging] = useState('')
  const [dropTarget,setDropTarget]=useState('')
  const resizing = useRef(false)
  const idsKey = projects.map(p => p.projectId).join('|')
  useEffect(() => {
    let alive = true
    window.desktop.workspace().then(state => { if (alive) { setWorkspace(state); setError(''); setReady(true) } }).catch(e => { if (alive) { setError(String(e)); setReady(true) } })
    return () => { alive = false }
  }, [idsKey])
  useEffect(() => {
    let alive = true
    window.desktop.windowAction('state').then(s => { if (alive) setMaximized(s.maximized) }).catch(e => setError(String(e)))
    const remove = window.desktop.onWindowState(s => setMaximized(s.maximized))
    return () => { alive = false; remove() }
  }, [])
  useEffect(() => { onOverlay(searchOpen || !!form); return () => onOverlay(false) }, [searchOpen, form, onOverlay])
  useEffect(() => { onDirty(!!form && name !== form.original); return () => onDirty(false) }, [form, name, onDirty])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (!document.querySelector('.reader,.mantine-Drawer-content,.mantine-Modal-content') && !form && !e.isComposing && e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [form])
  const mutate = useCallback(async (command: WorkspaceCommand) => {
    setSaving(true)
    try { setWorkspace(await window.desktop.updateWorkspace(command)); setError(''); return true }
    catch (e) { setError(String(e)); return false }
    finally { setSaving(false) }
  }, [])
  const prefs = workspace.prefs
  // A failed settings write must not hide otherwise usable projects.
  const placements = { ...prefs.projects }
  projects.forEach((p, i) => { if (!placements[p.projectId]) placements[p.projectId] = { groupId: null, favorite: false, addedOrder: i + 1 } })
  const view = { ...prefs, projects: placements }
  const members = (section: string) => sectionProjects(projects.map(p => p.projectId), view, section).map(id => projects.find(p => p.projectId === id)!)
  const unclassified = members('unclassified'), favorites = members('favorites'), sections = sectionIds(prefs)
  const locked = props.busy || saving || !ready || !!workspace.error
  const closeForm = () => { if (!form || name === form.original || window.confirm('放棄尚未保存的群組名稱？')) setForm(undefined) }
  const editGroup = (id?: string) => { const original = prefs.groups.find(g => g.id === id)?.name ?? ''; setName(original); setForm({ id, original }) }
  const move = (projectId: string, groupId: string | null) => mutate({ action: 'moveProject', projectId, groupId })
  const drop = (e: React.DragEvent, sectionId: string, beforeId?: string) => {
    e.stopPropagation()
    const id = e.dataTransfer.getData('application/x-media-viewer-project')
    const groupId = e.dataTransfer.getData('application/x-media-viewer-group')
    if (!locked && groupId && groupId !== sectionId && sections.includes(groupId)) { e.preventDefault(); const ids = sections.filter(v => v !== groupId); ids.splice(ids.indexOf(sectionId), 0, groupId); void mutate({ action: 'reorderSections', ids }) }
    if (!locked && projects.some(p => p.projectId === id) && id !== beforeId) {
      e.preventDefault()
      if (sectionId === 'favorites') { void (async () => { if (!placements[id].favorite && !await mutate({ action: 'favorite', projectId: id, value: true })) return; await mutate({ action: 'reorderProject', projectId: id, sectionId, beforeId }) })() }
      else void mutate({ action: 'moveProject', projectId: id, groupId: sectionId === 'unclassified' ? null : sectionId, beforeId })
    }
    setDragging('');setDropTarget('')
  }
  const shiftSection = (id: string, delta: number) => { const ids = [...sections], i = ids.indexOf(id), j = i + delta; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; void mutate({ action: 'reorderSections', ids }) }
  const projectRow = (p: LinkedProject, sectionId: string) => <div key={p.projectId} className={`sidebar-project ${selected === p.projectId ? 'selected' : ''} ${dropTarget===sectionId+':'+p.projectId?'insert-before':''}`} draggable={!locked}
    onDragOver={e => { if (!locked && dragging){e.preventDefault();e.stopPropagation();setDropTarget(sectionId+':'+p.projectId)} }} onDrop={e => drop(e, sectionId, p.projectId)}
    onDragStart={e => { e.dataTransfer.setData('application/x-media-viewer-project', p.projectId); e.dataTransfer.effectAllowed = 'move'; setDragging(p.projectId) }} onDragEnd={() => {setDragging('');setDropTarget('')}}>
    <button className="project-select" disabled={props.busy} title={p.root} aria-label={`開啟專案 ${title(p)}`} onClick={() => props.onSelect(p.projectId)}>
      <span className="project-mark">{p.error ? '!' : '▱'}</span><span className="project-name">{title(p)}</span>
    </button>
    <div className="project-actions">
      <Tooltip label={placements[p.projectId].favorite ? '取消最愛' : '加入最愛'}><ActionIcon variant="subtle" color={placements[p.projectId].favorite ? 'teal' : 'gray'} aria-label={`${placements[p.projectId].favorite ? '取消最愛' : '加入最愛'} ${title(p)}`} disabled={locked} onClick={() => void mutate({ action: 'favorite', projectId: p.projectId, value: !placements[p.projectId].favorite })}>{placements[p.projectId].favorite ? '♥' : '♡'}</ActionIcon></Tooltip>
      <Menu position="right-start" withinPortal><Menu.Target><ActionIcon aria-label={`移動專案 ${title(p)}`} variant="subtle" color="gray" disabled={locked}>⋯</ActionIcon></Menu.Target><Menu.Dropdown>
        <Menu.Label>移至群組</Menu.Label><Menu.Item onClick={() => void move(p.projectId, null)}>未分類</Menu.Item>
        {prefs.groups.map(g => <Menu.Item key={g.id} onClick={() => void move(p.projectId, g.id)}>{g.name}</Menu.Item>)}
      </Menu.Dropdown></Menu>
    </div>
  </div>
  const section = (id: string, label: string, items: LinkedProject[], collapsed: boolean, custom = false) => <section key={id} className={`sidebar-section ${dragging ? 'drop-ready' : ''} ${dropTarget===id+':end'?'insert-end':''}`} data-group-id={id}
    onDragOver={e => { if (!locked && dragging){e.preventDefault();setDropTarget(id+':end')} }} onDrop={e => drop(e, id)}>
    <div className="section-heading" draggable={!locked} onDragStart={e => { e.dataTransfer.setData('application/x-media-viewer-group', id); setDragging(id) }} onDragEnd={() => setDragging('')}><button disabled={locked} aria-expanded={!collapsed} aria-label={`${collapsed ? '展開' : '收合'} ${label}`} onClick={() => void mutate(custom ? { action: 'collapseGroup', id, value: !collapsed } : { action: 'collapseSection', section: id as 'favorites' | 'unclassified', value: !collapsed })}><span>{collapsed ? '›' : '⌄'}</span> {label}<span className="section-count">{items.length}</span></button>
      <Menu position="right-start" withinPortal><Menu.Target><ActionIcon aria-label={`管理群組 ${label}`} variant="subtle" color="gray" disabled={locked}>⋯</ActionIcon></Menu.Target><Menu.Dropdown>
        <Menu.Item onClick={() => shiftSection(id, -1)}>群組上移</Menu.Item><Menu.Item onClick={() => shiftSection(id, 1)}>群組下移</Menu.Item>
        {custom && <><Menu.Divider/><Menu.Item onClick={() => editGroup(id)}>重新命名群組</Menu.Item><Menu.Item color="red" onClick={() => { if (!items.length || window.confirm(`刪除「${label}」群組？其中 ${items.length} 個專案會移至未分類，資料及收藏保留。`)) void mutate({ action: 'removeGroup', id }) }}>刪除群組</Menu.Item></>}
      </Menu.Dropdown></Menu>
    </div>
    {!collapsed && <div className="section-projects">{items.length ? items.map(p => projectRow(p, id)) : <p className="section-empty">{custom ? '拖入專案，或用專案選單移動' : id === 'favorites' ? '點專案愛心加入最愛' : '沒有未分類的專案'}</p>}</div>}
  </section>
  const windowAction = (action: 'minimize' | 'toggleMaximize' | 'close') => { void window.desktop.windowAction(action).catch(e => setError(String(e))) }
  return <div className="desktop-shell">
    <header className="titlebar">
      <button className="app-brand" aria-label="返回首頁" title="首頁" disabled={props.busy} onClick={() => props.onSelect('')}><span>◫</span></button>
      <Tooltip label={prefs.sidebarHidden ? '顯示專案欄' : '隱藏專案欄'}><ActionIcon color="gray" variant="subtle" aria-label="切換專案欄" disabled={locked} onClick={() => void mutate({ action: 'layout', sidebarHidden: !prefs.sidebarHidden })}>◧</ActionIcon></Tooltip>
      <div className="global-search"><button className="search-launcher" aria-label="開啟搜尋" onClick={() => setSearchOpen(true)}><span>⌕</span> 搜尋資料夾 <kbd>Ctrl K</kbd></button></div>
      {props.dirty && <span className="dirty-indicator" title="尚未保存">●</span>}
      <div className="window-controls"><button aria-label="最小化視窗" onClick={() => windowAction('minimize')}>−</button><button aria-label={maximized ? '還原視窗' : '最大化視窗'} onClick={() => windowAction('toggleMaximize')}>{maximized ? '❐' : '□'}</button><button className="window-close" aria-label="關閉視窗" onClick={() => windowAction('close')}>×</button></div>
    </header>
    <div className="desktop-body">
      {!prefs.sidebarHidden && <><aside className="project-sidebar" style={{ width: liveWidth ?? prefs.sidebarWidth }}>
        <div className="sidebar-tools"><Tooltip label="首頁"><ActionIcon aria-label="首頁" variant="subtle" color="gray" disabled={props.busy} onClick={()=>props.onSelect('')}>⌂</ActionIcon></Tooltip><Tooltip label="設定"><ActionIcon aria-label="設定" variant="subtle" color="gray" disabled={props.busy} onClick={props.onSettings}>⚙</ActionIcon></Tooltip></div>
        <div className="sidebar-groups"><div className="groups-title"><span>我的群組</span><Tooltip label="新增群組"><ActionIcon aria-label="新增群組" variant="subtle" color="gray" disabled={locked} onClick={() => editGroup()}>＋</ActionIcon></Tooltip></div>
          {sections.map(id => { const group = prefs.groups.find(g => g.id === id); return section(id, group?.name ?? (id === 'favorites' ? '最愛' : '未分類'), members(id), group?.collapsed ?? (id === 'favorites' ? prefs.collapsed.favorites : prefs.collapsed.unclassified ?? prefs.collapsed.recent), !!group) })}
        </div>
        <div className="sidebar-footer"><Button aria-label="新增專案" fullWidth variant="subtle" color="gray" disabled={props.busy} onClick={props.onCreate}>＋ 新增專案</Button></div>
      </aside><div role="separator" tabIndex={0} aria-label="調整專案欄寬" aria-orientation="vertical" aria-valuemin={200} aria-valuemax={360} aria-valuenow={liveWidth ?? prefs.sidebarWidth} className="sidebar-resizer"
        onPointerDown={e => { if (locked) return; resizing.current = true; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={e => { if (resizing.current) setLiveWidth(Math.round(Math.min(360, Math.max(200, e.clientX)))) }}
        onPointerUp={e => { if (!resizing.current) return; resizing.current = false; e.currentTarget.releasePointerCapture(e.pointerId); const width = Math.round(Math.min(360, Math.max(200, e.clientX))); void mutate({ action: 'layout', sidebarWidth: width }).finally(() => setLiveWidth(undefined)) }}
        onPointerCancel={() => { resizing.current = false; setLiveWidth(undefined) }}
        onKeyDown={e => { if (!locked && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) { e.preventDefault(); void mutate({ action: 'layout', sidebarWidth: e.key === 'Home' ? 200 : e.key === 'End' ? 360 : Math.max(200, Math.min(360, prefs.sidebarWidth + (e.key === 'ArrowRight' ? 10 : -10))) }) } }}/></>}
      <main className={"content"+(selected?" workspace-content":"")}>
        {(error || workspace.error) && <Alert color="orange" mb="md" title="側欄／視窗設定">{error || workspace.error}</Alert>}
        {props.banner}
        {selected ? props.children : <div className="home-page"><div className="home-intro"><Badge variant="light" color="gray">本機資料夾檢視器</Badge><h1>你的資料夾，你的瀏覽方式</h1><p>從一個資料夾開始，把收藏整理成適合自己的畫面。</p><Group><Button onClick={props.onCreate} disabled={props.busy}>＋ 新增專案</Button><Button variant="default" onClick={props.onLink} disabled={props.busy}>重新連結既有專案</Button></Group></div>
          {favorites.length > 0 && <div className="home-section"><h2>我的最愛</h2><div className="home-projects">{favorites.map(p => <button key={p.projectId} disabled={props.busy} onClick={() => props.onSelect(p.projectId)}><span>♥</span><strong>{title(p)}</strong><small>{p.root}</small></button>)}</div></div>}
          <div className="home-section"><h2>未分類</h2>{unclassified.length ? <div className="home-projects">{unclassified.map(p => <button key={p.projectId} disabled={props.busy} onClick={() => props.onSelect(p.projectId)}><span>▱</span><strong>{title(p)}</strong><small>{p.root}</small><em>{p.error ? '需要重新連結' : '開啟專案 →'}</em></button>)}</div> : <div className="home-empty">{projects.length ? '目前專案都已歸組；可從左側群組開啟。' : '尚未建立專案，選擇資料夾開始。'}</div>}</div>
          {projects.some(p => p.error) && <div className="home-section"><h2>需要處理</h2>{projects.filter(p => p.error).map(p => <button className="problem-project" key={p.projectId} disabled={props.busy} onClick={() => props.onSelect(p.projectId)}><strong>{title(p)}</strong><span>{p.root}</span><small>{p.error}</small></button>)}</div>}
        </div>}
      </main>
    </div>
    <footer className="statusbar"><span role="status">{saving ? '保存側欄設定…' : props.status}</span><span>{projects.length} 個已連結專案</span><button onClick={props.onProblems}>查看問題</button></footer>
    <Modal opened={!!form} onClose={closeForm} title={form?.id ? '重新命名群組' : '新增群組'} size="sm"><form onSubmit={async e => { e.preventDefault(); if (await mutate(form?.id ? { action: 'renameGroup', id: form.id, name } : { action: 'createGroup', name })) setForm(undefined) }}><Stack><TextInput label="群組名稱" placeholder="例如：動作遊戲、愛情漫畫" value={name} maxLength={60} autoFocus onChange={e => setName(e.currentTarget.value)} required/>{error && <Alert color="red">{error}</Alert>}<Group justify="flex-end"><Button variant="default" onClick={closeForm}>取消</Button><Button type="submit" loading={saving} disabled={!name.trim()}>保存群組</Button></Group></Stack></form></Modal>
    <SearchDialog opened={searchOpen} close={()=>setSearchOpen(false)} selected={selected} projects={projects} onSelect={props.onSelect} onSnapshot={props.onSnapshot} dirty={props.dirty}/>
  </div>
}
