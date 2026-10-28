import {FileOverview} from './FileOverview'
import type {OverviewEntry} from '../shared/explorer'
import {t as tr, useLocale,currentLocale} from './i18n'
import { Icon } from './icons'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ActionIcon,
  Breadcrumbs,
  Button,
  Drawer,
  Group,
  Menu,
  Modal,
  NumberInput,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { Card } from './Card'
import { cardPresets } from '../shared/layouts'
import {
  browserRows,
  cardDisplay,
  folderBreadcrumbs,
  maxBrowseDepth,
  pathKey,
} from '../shared/browse'
import {
  fieldValue,
  type FolderRow,
  type Project,
  type Request,
  type Response,
} from '../shared/model'
import type { BrowseMode, BrowseState, ExplorerRequest, ExplorerResponse } from '../shared/explorer'
const FolderPanel = lazy(() => import('./FolderPanel').then((m) => ({ default: m.FolderPanel })))
const FolderContent = lazy(() =>
  import('./FolderContent').then((m) => ({ default: m.FolderContent }))
)
const Tree = lazy(() => import('./TreeView'))
const initial: BrowseState = {
  mode: 'CARD',
  location: '',
  widths: { name: 200, path: 320, depth: 90 },
  panelWidth: 420,
  panelVisible: true,
}
type Act = (r: Request) => Promise<Response | undefined>
type Run = (r: ExplorerRequest) => Promise<ExplorerResponse | undefined>
interface Props {
  toolbarTarget: HTMLDivElement | null
  project: Project
  root: string
  rows: FolderRow[]
  structure: FolderRow[]
  busy: boolean
  selected?: string
  onSelect: (id: string) => boolean
  onClose: () => void
  act: Act
  run: Run
  onDirty: (v: boolean) => void
  edit: (category?: string) => void
  notify: (message: string) => void
  onOverlay: (v: boolean) => void
}
export function BrowseWorkspace({
  toolbarTarget,
  project,
  root,
  rows,
  structure,
  busy,
  selected,
  onSelect,
  act,
  run,
  onDirty,
  edit,
  notify,
  onOverlay,
}: Props) {
 const locale=useLocale()

  const [browse, setBrowse] = useState(initial),
    [ready, setReady] = useState(false),
    [page, setPage] = useState(1)
  const [sort, setSort] = useState({ field: 'name', asc: true }),
    [highlight, setHighlight] = useState<string>(),
    [configId, setConfigId] = useState<string>(),
    [configDirty, setConfigDirty] = useState(false),
    [expanded, setExpanded] = useState(false)
  const [filePreview,setFilePreview]=useState<OverviewEntry>()
  const navigation=useRef(0),mounted=useRef(false)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;navigation.current++}},[])
  const [displayOpen, setDisplayOpen] = useState(false),
    [display, setDisplay] = useState(cardDisplay(project)),
    [density, setDensity] = useState(project.list)
  const [dragColumn, setDragColumn] = useState(''),
    [columnDrop, setColumnDrop] = useState<{ id: string; after: boolean }>()
  const histories = useRef<Partial<Record<BrowseMode, { items: string[]; index: number }>>>({}),
    [, renderHistory] = useState(0)
  const scroll = useRef<HTMLDivElement>(null),
    state = useRef(browse),
    resize = useRef<{ id: string; start: number; width: number }>(),
    timer = useRef<ReturnType<typeof setTimeout>>()
  const all = structure.length ? structure : rows,
    rootRow = all.find((r) => pathKey(r.path) === pathKey(root)),
    detail = all.find((r) => r.rowId === selected),
    config = all.find((r) => r.rowId === configId),
    card = cardDisplay(project)
  state.current = browse
  useEffect(() => {
    let alive = true
    window.desktop
      .workspace()
      .then((r) => {
        if (!alive) return
        const saved = r.prefs.browse?.[project.projectId] ?? initial,
          target = all.find((r) => r.rowId === (selected ?? saved.detailId)) ?? rootRow,
          next = { ...saved, location:target&&pathKey(target.path)!==pathKey(root)?target.path:saved.location||'', locations:undefined, detailId: target?.rowId, panelVisible: saved.panelVisible ?? true }
        setBrowse(next)
        state.current = next
        const history={items:[next.location],index:0};histories.current={CARD:history,TABLE:history,TREE:history}
        setHighlight(target?.rowId)
        setReady(true)
        if (target?.record) onSelect(target.rowId)
      })
      .catch((e) => {
        notify(String(e))
        setReady(true)
      })
    return () => {
      alive = false
      clearTimeout(timer.current)
    }
  }, [project.projectId])
  const persist = (next: BrowseState) => {
    state.current = next
    setBrowse(next)
    if (ready)
      void window.desktop
        .updateWorkspace({ action: 'browse', projectId: project.projectId, value: next })
        .catch((e) => notify(String(e)))
  }
  const reportDirty = useCallback(
    (value: boolean) => {
      setConfigDirty(value)
      onDirty(value)
    },
    [onDirty]
  )
  useEffect(() => {
    onOverlay(!!configId || displayOpen)
    return () => onOverlay(false)
  }, [configId, displayOpen, onOverlay])
  useEffect(() => {
    setPage(1)
  }, [browse.location, browse.mode, project.cardView, project.list.pageSize])
  useEffect(() => {
    if (ready) scroll.current?.scrollTo(0, browse.scrolls?.[browse.mode] ?? 0)
  }, [browse.mode, ready])
  useEffect(() => {
    if(ready&&selected&&selected!==state.current.detailId&&!busy)void open(selected)
  }, [selected,ready,busy])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !e.defaultPrevented &&
        !document.querySelector('.reader,.mantine-Drawer-content,.mantine-Modal-content') &&
        expanded
      ) {
        e.preventDefault()
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [expanded])
  const location =
    browse.location && all.some((r) => pathKey(r.path) === pathKey(browse.location))
      ? browse.location
      : ''
  const currentFolder = all.find((r) => pathKey(r.path) === pathKey(location || root))
  const base = useMemo(
    () => browserRows(all, project, root, browse.mode, location),
    [all, project, root, browse.mode, location]
  )
  const filtered = useMemo(
    () =>
      [...base].sort((a, b) => {
        const get = (r: FolderRow) =>
          sort.field === 'name'
            ? r.name
            : sort.field === 'path'
              ? r.path
              : sort.field === 'depth'
                ? r.depth
                : fieldValue(r, sort.field)
        const av = get(a),
          bv = get(b)
        if (av == null || bv == null)
          return av == null ? (bv == null ? a.rowId.localeCompare(b.rowId) : 1) : -1
        return (
          (typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), currentLocale(), { numeric: true })) *
            (sort.asc ? 1 : -1) || a.rowId.localeCompare(b.rowId)
        )
      }),
    [base, sort,locale]
  )
  const pageSize = browse.mode === 'CARD' ? project.list.pageSize : 100,
    pages = Math.max(1, Math.ceil(filtered.length / pageSize)),
    current = filtered.slice(
      (Math.min(page, pages) - 1) * pageSize,
      Math.min(page, pages) * pageSize
    )
  useEffect(()=>{if(browse.mode!=='CARD'||!ready||card.mode!=='multi'||!selected)return;const index=filtered.findIndex(r=>r.rowId===selected);if(index<0)return;setPage(Math.floor(index/pageSize)+1);const frame=requestAnimationFrame(()=>scroll.current?.querySelector<HTMLElement>('[data-row-id="'+selected+'"]')?.scrollIntoView({block:'nearest',inline:'nearest'}));return()=>cancelAnimationFrame(frame)},[browse.mode,browse.location,ready,selected,filtered,pageSize,card.mode])
  const navigable = true,
    history = histories.current[browse.mode] ?? { items: [location], index: 0 }
  const moveTo = (target: string) => {
    const mode = state.current.mode,
      h = histories.current[mode] ?? { items: [state.current.location], index: 0 }
    if (pathKey(target) !== pathKey(state.current.location)) {
      const items = [...h.items.slice(0, h.index + 1), target].slice(-100)
      const next={items,index:items.length-1};histories.current={CARD:next,TABLE:next,TREE:next}
      renderHistory((v) => v + 1)
    }
    persist({
      ...state.current,
      location: target,
      locations: undefined,
    })
  }
  const open = async (id: string, fromHistory?: number) => {
    const row = all.find((r) => r.rowId === id)
    if (!row || busy) return
    const operation=++navigation.current
    let prefs
    try{prefs=await window.desktop.workspace()}catch(error){notify(String(error));return}
    if(!mounted.current||operation!==navigation.current)return
    const result = await run({ action: 'visit', rowId: id })
    if (!mounted.current||operation!==navigation.current||!result?.snapshot || !onSelect(id)) return
    setFilePreview(undefined)
    setHighlight(id)
    persist({ ...state.current, detailId: id, ...(state.current.contentMode==='files'?{fileRootId:id}:{}), panelVisible: prefs.prefs.autoOpenContent === true || state.current.panelVisible !== false })
    if (navigable) {
      if (fromHistory !== undefined) {
        const next={...history,index:fromHistory};histories.current={CARD:next,TABLE:next,TREE:next}
        renderHistory((v) => v + 1)
        persist({
          ...state.current,
          location: row.path,
          locations: undefined,
        })
      } else moveTo(row.path)
    }
  }
  const previewFile=async(entry:OverviewEntry)=>{
    if(busy)return
    const operation=++navigation.current,result=await run({action:'visit',rowId:entry.rowId})
    if(!mounted.current||operation!==navigation.current||!result?.snapshot||!onSelect(entry.rowId))return
    setFilePreview(entry);persist({...state.current,detailId:entry.rowId,panelVisible:true})
  }
  const navHistory = (delta: number) => {
    const i = history.index + delta
    if (i < 0 || i >= history.items.length) return
    const target = all.find((r) => pathKey(r.path) === pathKey(history.items[i] || root))
    if (target) void open(target.rowId, i)
  }
  const openConfig = (id: string) => {
    if (configDirty && id !== configId && !window.confirm(tr("放棄尚未保存的資料夾設定？"))) return
    setHighlight(id)
    setConfigId(id)
  }
  const closeConfig = () => {
    if (!configDirty || window.confirm(tr("放棄尚未保存的資料夾設定？"))) setConfigId(undefined)
  }
  const child = (name: string) => {
    if (!detail) return
    const next = all.find((r) => pathKey(r.path) === pathKey(detail.path + '/' + name))
    if (next) void open(next.rowId)
    else
      notify(
        detail.boundary
          ? tr("此資料夾受遊戲邊界保護，無法建立資料")
          : tr("此資料夾尚未建立資料，請先明確重新掃描")
      )
  }
  const availableColumns = [
    { id: 'name', label: tr("資料夾名稱") },
    { id: 'path', label: tr("目前路徑") },
    { id: 'depth', label: tr("層級") },
    ...project.fieldBindings.map((f) => ({ id: f.attributeId, label: f.alias })),
  ]
  const columns = [
    ...(browse.columnOrder ?? []).flatMap((id) => availableColumns.find((c) => c.id === id) ?? []),
    ...availableColumns.filter((c) => !browse.columnOrder?.includes(c.id)),
  ]
  const reorderColumn = (source: string, target: string, after: boolean) => {
    if (busy || source === target || !columns.some((c) => c.id === source)) return
    const ids = columns.map((c) => c.id).filter((id) => id !== source),
      index = ids.indexOf(target)
    if (index < 0) return
    ids.splice(index + (after ? 1 : 0), 0, source)
    if (ids.some((id, i) => columns[i].id !== id)) persist({ ...state.current, columnOrder: ids })
  }
  const endColumnDrag = () => {
    setDragColumn('')
    setColumnDrop(undefined)
  }
  const deepest = maxBrowseDepth(all),
    crumbs = folderBreadcrumbs(all, root, currentFolder?.path ?? root)
  const overviewRoot=all.find(row=>row.rowId===browse.fileRootId)??currentFolder??rootRow
  const folderMode=browse.contentMode!=='files'
  const previewCount = browserRows(all, { ...project, cardView: display }, root, 'CARD', '').length
  const openDisplay = () => {
    setDisplay({ ...card, level: card.level === 'all' ? 'all' : Math.min(card.level, deepest) })
    setDensity(project.list)
    setDisplayOpen(true)
  }
  const moveWidth = (e: React.PointerEvent) => {
    if (!resize.current) return
    const r = resize.current
    if (r.id === 'panel')
      setBrowse((v) => ({
        ...v,
        panelWidth: Math.round(Math.max(280, Math.min(1000, r.width + r.start - e.clientX))),
      }))
    else
      setBrowse((v) => ({
        ...v,
        widths: {
          ...v.widths,
          [r.id]: Math.round(Math.max(80, Math.min(1000, r.width + e.clientX - r.start))),
        },
      }))
  }
  const stopWidth = () => {
    resize.current = undefined
    persist(state.current)
  }
  const gestures = (id: string) => ({
    onClick: () => setHighlight(id),
    onDoubleClick: () => void open(id),
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      openConfig(id)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        void open(id)
      }
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault()
        openConfig(id)
      }
    },
  })
  const presets = cardPresets(project),
    pickPreset = (id: string) => {
      const preset = presets.find((p) => p.id === id)
      if (preset)
        void act({
          action: 'saveProject',
          project: {
            ...project,
            cells: preset.cells,
            layoutPresets: presets,
            activeLayoutId: preset.id,
          },
        })
    }
  const switchMode = async (mode: BrowseMode) => {
    if(busy||!ready)return
    if(highlight&&highlight!==state.current.detailId){
      const row=all.find(r=>r.rowId===highlight),result=await run({action:'visit',rowId:highlight})
      if(!row||!result?.snapshot||!onSelect(highlight))return
      moveTo(row.path);persist({...state.current,detailId:highlight,panelVisible:true})
    }
    persist({...state.current,mode,locations:undefined})
    renderHistory(v=>v+1)
  }
  const togglePanel = () => {
    setExpanded(false)
    persist({ ...state.current, panelVisible: state.current.panelVisible === false })
  }
  return (
    <div className={'project-workspace' + (expanded ? ' content-expanded' : '')}>
      {toolbarTarget &&
        createPortal(
          <Tooltip label={browse.panelVisible === false ? tr("顯示右側內容") : tr("隱藏右側內容")}>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label={tr("切換右側內容")}
              aria-pressed={browse.panelVisible !== false}
              disabled={!ready}
              onClick={togglePanel}
            >
              <Icon name="panel-right" size={20}/>
            </ActionIcon>
          </Tooltip>,
          toolbarTarget
        )}
      <section className="center-pane" aria-label={tr("資料夾瀏覽區")}>
        <div className="workspace-toolbar">
          <div className="toolbar-left">
            {folderMode && browse.mode === 'CARD' && (
              <>
                <div className="preset-controls">
                  <Select
                    aria-label={tr("CELL 版面方案")}
                    size="xs"
                    value={project.activeLayoutId ?? presets[0].id}
                    allowDeselect={false}
                    data={presets.map((p) => ({ value: p.id, label: p.id==='default'&&p.name==='預設版面'?tr('預設版面'):p.name }))}
                    disabled={busy}
                    onChange={(id) => id && pickPreset(id)}
                  />
                  <Tooltip label={tr("更改樣式")}>
                    <ActionIcon
                      aria-label={tr("更改樣式")}
                      variant="default"
                      disabled={busy}
                      onClick={() => edit()}
                    ><Icon name="edit"/></ActionIcon>
                  </Tooltip>
                </div>
                <Menu>
                  <Menu.Target>
                    <ActionIcon
                      className="compact-presets"
                      aria-label={tr("CELL 方案選單")}
                      variant="subtle"
                    ><Icon name="grid"/></ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {presets.map((p) => (
                      <Menu.Item key={p.id} onClick={() => pickPreset(p.id)}>
                        {p.id==='default'&&p.name==='預設版面'?tr('預設版面'):p.name}
                      </Menu.Item>
                    ))}
                    <Menu.Divider />
                    <Menu.Item onClick={() => edit()}>{tr("更改樣式")}</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </div>
          <SegmentedControl aria-label={tr('展示內容')} size="xs" value={browse.contentMode??'folders'} disabled={busy||!ready} data={[{value:'folders',label:tr('資料夾')},{value:'files',label:tr('檔案')}]} onChange={value=>{setFilePreview(undefined);persist({...state.current,contentMode:value as 'folders'|'files',fileRootId:detail?.rowId??currentFolder?.rowId,filePresentation:state.current.filePresentation??'tiles',fileScope:project.mediaCategory==='manga'?'current':state.current.fileScope??'descendants'})}}/>
          <SegmentedControl
            style={{display:folderMode?undefined:'none'}}
            className="center-mode"
            aria-label={tr("瀏覽模式")}
            size="xs"
            value={browse.mode}
            data={(['CARD','TABLE','TREE'] as const).map(mode=>({value:mode,label:<><Icon name={mode==='CARD'?'grid':mode==='TABLE'?'list':'tree'} size={14}/>{mode==='CARD'?tr('卡片'):mode==='TABLE'?tr('表格'):tr('樹狀圖')}</>}))}
            disabled={busy||!ready}
            onChange={(mode) => void switchMode(mode as BrowseMode)}
          />
          <div className="toolbar-right">
            {browse.mode === 'CARD' && (
              <Tooltip label={tr("CARD 顯示設定")}>
                <ActionIcon
                  aria-label={tr("CARD 顯示設定")}
                  variant="subtle"
                  color="gray"
                  disabled={busy}
                  onClick={openDisplay}
                ><Icon name="sliders"/></ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={tr("重新掃描")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={tr("重新掃描")}
                disabled={busy}
                onClick={() => void act({ action: 'scan' })}
              ><Icon name="refresh"/></ActionIcon>
            </Tooltip>
            <Tooltip label={tr("目前資料夾設定")}>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={tr("目前資料夾設定")}
                disabled={!currentFolder || busy}
                onClick={() => currentFolder && openConfig(currentFolder.rowId)}
              ><Icon name="folder-settings"/></ActionIcon>
            </Tooltip>
          </div>
        </div>
        <div className="workspace-breadcrumb">
          <Tooltip label={tr("返回上一個瀏覽位置")}>
            <ActionIcon
              aria-label={tr("返回")}
              disabled={!navigable || !history.index || busy}
              variant="subtle"
              color="gray"
              onClick={() => navHistory(-1)}
            ><Icon name="arrow-left"/></ActionIcon>
          </Tooltip>
          <Tooltip label={tr("前進至下一個瀏覽位置")}>
            <ActionIcon
              aria-label={tr("前進")}
              disabled={!navigable || history.index >= history.items.length - 1 || busy}
              variant="subtle"
              color="gray"
              onClick={() => navHistory(1)}
            ><Icon name="arrow-right"/></ActionIcon>
          </Tooltip>
          <nav className="breadcrumb-path" aria-label={tr("資料夾路徑")} title={location || root}>
            <Breadcrumbs
              separator={String.fromCharCode(92)}
            >
              {crumbs.map((r, i) =>
                i === crumbs.length - 1 ? (
                  <span
                    key={r.rowId}
                    aria-current="page"
                    className="breadcrumb-current"
                    title={r.path}
                  >
                    {r.name}
                  </span>
                ) : (
                  <button
                    key={r.rowId}
                    className="breadcrumb-link"
                    title={r.path}
                    disabled={busy}
                    onClick={() => void open(r.rowId)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      openConfig(r.rowId)
                    }}
                  >
                    {r.name}
                  </button>
                )
              )}
            </Breadcrumbs>
          </nav>
          <small className="view-count">
            {filtered.length} {tr("筆")}{browse.mode === 'CARD'
              ? ' · ' +
                (card.mode === 'multi' ? tr("多層") : tr("單層")) +
                ' · ' +
                (card.level === 'all'
                  ? tr("全部（最深第 ") + deepest + tr(" 層）")
                  : card.mode === 'multi'
                    ? tr("第 1–") + card.level + tr(" 層")
                    : tr("第 ") + card.level + tr(" 層"))
              : ''}
          </small>
        </div>
        <div
          className="browse-main"
          ref={scroll}
          onScroll={(e) => {
            state.current = {
              ...state.current,
              scrolls: { ...state.current.scrolls, [browse.mode]: e.currentTarget.scrollTop },
            }
            clearTimeout(timer.current)
            timer.current = setTimeout(() => persist(state.current), 400)
          }}
        >
          {!folderMode&&overviewRoot?<FileOverview root={overviewRoot} folders={all} scope={browse.fileScope??'descendants'} presentation={browse.filePresentation??'tiles'} manga={project.mediaCategory==='manga'} busy={busy} change={(scope,presentation)=>{setFilePreview(undefined);persist({...state.current,fileScope:scope,filePresentation:presentation})}} chooseRoot={id=>void open(id)} open={entry=>void previewFile(entry)}/>:browse.mode === 'TREE' ? (
            <Suspense fallback={<p>{tr("載入樹狀圖…")}</p>}>
              <Tree
                rows={base}
                selected={highlight}
                focusId={location?currentFolder?.rowId:undefined}
                onSelect={setHighlight}
                onOpen={(id) => void open(id)}
                onConfigure={openConfig}
                collapsed={browse.treeCollapsed}
                onCollapsed={(treeCollapsed)=>persist({...state.current,treeCollapsed})}
                viewport={browse.viewport}
                save={(viewport) => persist({ ...state.current, viewport })}
              />
            </Suspense>
          ) : browse.mode === 'TABLE' ? (
            <div className="table-scroll">
              <table className="folder-table">
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th
                        key={c.id}
                        data-column-id={c.id}
                        className={
                          columnDrop?.id === c.id
                            ? columnDrop.after
                              ? 'column-insert-after'
                              : 'column-insert-before'
                            : ''
                        }
                        aria-sort={
                          sort.field === c.id ? (sort.asc ? 'ascending' : 'descending') : 'none'
                        }
                        style={{
                          width: browse.widths[c.id] ?? 180,
                          minWidth: browse.widths[c.id] ?? 180,
                        }}
                        onDragOver={(e) => {
                          if (!busy && dragColumn && dragColumn !== c.id) {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                            const rect = e.currentTarget.getBoundingClientRect()
                            const after = e.clientX >= rect.left + rect.width / 2
                            setColumnDrop((previous) =>
                              previous?.id === c.id && previous.after === after
                                ? previous
                                : { id: c.id, after }
                            )
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const rect = e.currentTarget.getBoundingClientRect()
                          reorderColumn(
                            e.dataTransfer.getData('application/x-media-viewer-column'),
                            c.id,
                            e.clientX >= rect.left + rect.width / 2
                          )
                          endColumnDrag()
                        }}
                      >
                        <button
                          disabled={busy}
                          draggable={!busy}
                          title={tr("點擊排序；拖曳調整欄位順序（Alt+←／→）")}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-media-viewer-column', c.id)
                            e.dataTransfer.effectAllowed = 'move'
                            setDragColumn(c.id)
                          }}
                          onDragEnd={endColumnDrag}
                          onKeyDown={(e) => {
                            if (e.altKey && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                              e.preventDefault()
                              const index = columns.findIndex((column) => column.id === c.id),
                                next = columns[index + (e.key === 'ArrowLeft' ? -1 : 1)]
                              if (next) reorderColumn(c.id, next.id, e.key === 'ArrowRight')
                            }
                          }}
                          onClick={() =>
                            setSort((s) => ({ field: c.id, asc: s.field === c.id ? !s.asc : true }))
                          }
                        >
                          {c.label}
                          {sort.field === c.id ? (sort.asc ? ' ↑' : ' ↓') : ''}
                        </button>
                        <span
                          className="column-resizer"
                          role="separator"
                          aria-label={tr("調整 ") + c.label + tr(" 欄寬")}
                          onPointerDown={(e) => {
                            e.preventDefault()
                            resize.current = {
                              id: c.id,
                              start: e.clientX,
                              width: browse.widths[c.id] ?? 180,
                            }
                            e.currentTarget.setPointerCapture(e.pointerId)
                          }}
                          onPointerMove={moveWidth}
                          onPointerUp={stopWidth}
                          onPointerCancel={() => {
                            resize.current = undefined
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.map((r) => (
                    <tr
                      key={r.rowId}
                      data-row-id={r.rowId}
                      className={highlight === r.rowId ? 'selected' : ''}
                      tabIndex={0}
                      {...gestures(r.rowId)}
                    >
                      {columns.map((c) => (
                        <td
                          key={c.id}
                          style={{ maxWidth: browse.widths[c.id] ?? 180 }}
                          title={c.id === 'path' ? r.path : undefined}
                        >
                          {c.id === 'name'
                            ? r.name + (!r.record ? ' ⚠' : r.boundary ? ' ⚑' : '')
                            : c.id === 'path'
                              ? r.path
                              : c.id === 'depth'
                                ? r.depth
                                : Array.isArray(fieldValue(r, c.id))
                                  ? (fieldValue(r, c.id) as unknown[]).join(', ')
                                  : typeof fieldValue(r,c.id)==='boolean'?fieldValue(r,c.id)?tr('是'):tr('否'):String(fieldValue(r, c.id) ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="cards"
              style={{ '--columns': project.list.itemsPerRow } as React.CSSProperties}
            >
              {current.map((row) => (
                <article
                  key={row.rowId}
                  data-row-id={row.rowId}
                  className={'folder-card ' + (highlight === row.rowId ? 'selected' : '')}
                  tabIndex={0}
                  {...gestures(row.rowId)}
                >
                  <Card
                    project={project}
                    row={row}
                    open={() => void act({ action: 'open', rowId: row.rowId })}
                  />
                  {(row.error || !row.record || row.readonly || row.boundary) && (
                    <small className="folder-state">
                      {row.error
                        ? tr("需要處理")
                        : row.readonly
                          ? tr("受保護")
                          : !row.record
                            ? tr("尚未建立資料")
                            : tr("遊戲邊界")}
                    </small>
                  )}
                </article>
              ))}
            </div>
          )}
          {!current.length && browse.mode !== 'TREE' && (
            <div className="empty-folder">{tr("此層沒有可顯示的子資料夾")}</div>
          )}
        </div>
        {folderMode && browse.mode !== 'TREE' && (
          <div className="browse-pagination">
            <Pagination size="xs" total={pages} value={Math.min(page, pages)} onChange={setPage} />
            <small>{tr("每頁")}{pageSize} {tr("筆")}</small>
          </div>
        )}
      </section>
      {detail && browse.panelVisible !== false && (
        <>
          <div
            role="separator"
            aria-label={tr("調整資料夾內容寬度")}
            className="panel-resizer"
            onPointerDown={(e) => {
              resize.current = { id: 'panel', start: e.clientX, width: browse.panelWidth }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={moveWidth}
            onPointerUp={stopWidth}
          />
          <aside
            className={'folder-panel ' + (project.mediaCategory === 'video' ? 'video-panel' : '')}
            aria-label={tr("資料夾內容")}
            style={{ width: browse.panelWidth }}
          >
            <div className="folder-panel-header">
              {project.mediaCategory !== 'video' && <strong>{detail.name}</strong>}
              {project.mediaCategory === 'manga' && <Tooltip label={tr("編輯此專案所有漫畫的資訊版面；CARD 版面獨立")}><ActionIcon aria-label={tr("編輯漫畫展示")} variant="subtle" color="gray" disabled={busy} onClick={()=>edit('manga')}><Icon name="layout"/></ActionIcon></Tooltip>}
              <ActionIcon
                aria-label={expanded ? tr("還原內容區") : tr("放大內容區")}
                variant="subtle"
                color="gray"
                onClick={() => setExpanded((v) => !v)}
              ><Icon name="maximize"/></ActionIcon>
              <ActionIcon
                aria-label={tr("關閉資料夾內容")}
                variant="subtle"
                color="gray"
                onClick={togglePanel}
              ><Icon name="close"/></ActionIcon>
            </div>
            <div className="folder-panel-body">
              <Suspense fallback={<p>{tr("載入內容…")}</p>}>
                {folderMode||filePreview?<FolderContent
                  key={detail.rowId+'/'+(filePreview?.id??'folder')}
                  selectedFileId={folderMode?undefined:filePreview?.id}
                  row={detail}
                  project={project}
                  run={run}
                  act={act}
                  busy={busy}
                  configure={() => openConfig(detail.rowId)}
                  onChild={child}
                />:<p>{tr('選擇檔案以預覽')}</p>}
              </Suspense>
            </div>
            {project.mediaCategory === 'manga' && <Button className="manga-top" size="compact-sm" variant="default" aria-label={tr("漫畫回到頂部")} onClick={event=>event.currentTarget.closest('.folder-panel')?.querySelector('.folder-panel-body')?.scrollTo({top:0,behavior:'smooth'})}><Icon name="arrow-up" size={15}/>{tr("返回頂部")}</Button>}
          </aside>
        </>
      )}
      <Drawer
        opened={!!config}
        onClose={closeConfig}
        title={tr("資料夾設定 · ") + (config?.name ?? '')}
        position="right"
        size="lg"
        zIndex={300}
        closeButtonProps={{ 'aria-label': tr("關閉資料夾設定") }}
      >
        {config && (
          <Suspense fallback={<p>{tr("載入設定…")}</p>}>
            <FolderPanel
              key={config.rowId}
              row={config}
              project={project}
              busy={busy}
              act={act}
              run={run}
              onDirty={reportDirty}
            />
          </Suspense>
        )}
      </Drawer>
      <Modal
        opened={displayOpen}
        onClose={() => !busy && setDisplayOpen(false)}
        title={tr("CARD 顯示設定")}
        size="md"
      >
        <Stack gap="lg">
          <section className="card-display-section">
            <Text fw={600} mb="sm">
              {tr("顯示範圍")}</Text>
            <SegmentedControl
              fullWidth
              aria-label={tr("層級顯示")}
              value={display.mode}
              data={[
                { value: 'multi', label: tr("多層") },
                { value: 'single', label: tr("單層") },
              ]}
              onChange={(mode) =>
                setDisplay({
                  mode: mode as 'multi' | 'single',
                  level: mode === 'single' && display.level === 'all' ? 1 : display.level,
                })
              }
            />
            <Text size="sm" c="dimmed" my="sm">
              {display.mode === 'multi'
                ? tr("將根資料夾與子資料夾放在同一畫面。雙擊只更新右側內容。")
                : tr("顯示指定層級，雙擊可像一般資料夾逐層進入。")}
            </Text>
            <Select
              label={tr("顯示層數")}
              description={
                display.mode === 'multi'
                  ? tr("從專案根開始，顯示到哪一層")
                  : tr("開啟 CARD 時，先顯示哪一層")
              }
              allowDeselect={false}
              value={String(display.level)}
              data={[
                ...(display.mode === 'multi'
                  ? [{ value: 'all', label: tr("全部已掃描層級（最深第 ") + deepest + tr(" 層）") }]
                  : []),
                ...Array.from({ length: deepest }, (_, i) => ({
                  value: String(i + 1),
                  label:
                    display.mode === 'multi'
                      ? tr("第 1 層至第 ") + (i + 1) + tr(" 層")
                      : tr("第 ") + (i + 1) + tr(" 層"),
                })),
              ]}
              onChange={(v) =>
                v && setDisplay({ ...display, level: v === 'all' ? 'all' : Number(v) })
              }
            />
            <Text size="xs" c="dimmed" mt="xs">
              {tr("專案根資料夾為第 1 層，目前已掃描最深到第")}{deepest} {tr("層。")}</Text>
          </section>
          <section className="card-display-section">
            <Text fw={600} mb="sm">
              {tr("卡片密度")}</Text>
            <div className="display-density">
              <NumberInput
                label={tr("每列卡片數")}
                description={tr("視窗變窄時會自動減少")}
                min={1}
                max={6}
                allowDecimal={false}
                clampBehavior="strict"
                value={density.itemsPerRow}
                onChange={(v) =>
                  typeof v === 'number' && setDensity({ ...density, itemsPerRow: v })
                }
              />
              <NumberInput
                label={tr("每頁筆數")}
                description={tr("控制單頁顯示的資料夾數")}
                min={1}
                max={500}
                allowDecimal={false}
                clampBehavior="strict"
                value={density.pageSize}
                onChange={(v) => typeof v === 'number' && setDensity({ ...density, pageSize: v })}
              />
            </div>
          </section>
          <Text size="sm" className="display-summary" role="status">
            {tr("套用後先顯示")}{previewCount} {tr("個資料夾，最多每列")}{density.itemsPerRow} {tr("張、每頁")}{' '}
            {density.pageSize} {tr("筆。")}</Text>
          <Text size="xs" c="dimmed">
            {tr("只調整 CARD，不變更 TREE／TABLE，也不會擴大掃描範圍。")}</Text>
          <Group justify="flex-end">
            <Button variant="default" disabled={busy} onClick={() => setDisplayOpen(false)}>
              {tr("取消")}</Button>
            <Button
              loading={busy}
              onClick={async () => {
                if (
                  await act({
                    action: 'saveProject',
                    project: { ...project, cardView: display, list: density },
                  })
                ) {
                  const history={items:[''],index:0};histories.current={CARD:history,TABLE:history,TREE:history}
                  persist({
                    ...state.current,
                    location: '',
                    locations: undefined,
                  })
                  setDisplayOpen(false)
                }
              }}
            >
              {tr("套用")}</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
