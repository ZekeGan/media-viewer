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
  const [browse, setBrowse] = useState(initial),
    [ready, setReady] = useState(false),
    [page, setPage] = useState(1)
  const [sort, setSort] = useState({ field: 'name', asc: true }),
    [highlight, setHighlight] = useState<string>(),
    [configId, setConfigId] = useState<string>(),
    [configDirty, setConfigDirty] = useState(false),
    [expanded, setExpanded] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false),
    [display, setDisplay] = useState(cardDisplay(project)),
    [density, setDensity] = useState(project.list)
  const [subtitleSettingsOpen, setSubtitleSettingsOpen] = useState(false)
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
  useEffect(() => { setSubtitleSettingsOpen(false) }, [detail?.rowId, browse.panelVisible, project.mediaCategory])
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
    onOverlay(!!configId || displayOpen || subtitleSettingsOpen)
    return () => onOverlay(false)
  }, [configId, displayOpen, subtitleSettingsOpen, onOverlay])
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
            : String(av).localeCompare(String(bv), 'zh-Hant', { numeric: true })) *
            (sort.asc ? 1 : -1) || a.rowId.localeCompare(b.rowId)
        )
      }),
    [base, sort]
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
    const result = await run({ action: 'visit', rowId: id })
    if (!result?.snapshot || !onSelect(id)) return
    setHighlight(id)
    persist({ ...state.current, detailId: id, panelVisible: true })
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
  const navHistory = (delta: number) => {
    const i = history.index + delta
    if (i < 0 || i >= history.items.length) return
    const target = all.find((r) => pathKey(r.path) === pathKey(history.items[i] || root))
    if (target) void open(target.rowId, i)
  }
  const openConfig = (id: string) => {
    if (configDirty && id !== configId && !window.confirm('放棄尚未保存的資料夾設定？')) return
    setHighlight(id)
    setConfigId(id)
  }
  const closeConfig = () => {
    if (!configDirty || window.confirm('放棄尚未保存的資料夾設定？')) setConfigId(undefined)
  }
  const child = (name: string) => {
    if (!detail) return
    const next = all.find((r) => pathKey(r.path) === pathKey(detail.path + '/' + name))
    if (next) void open(next.rowId)
    else
      notify(
        detail.boundary
          ? '此資料夾受遊戲邊界保護，無法建立資料'
          : '此資料夾尚未建立資料，請先明確重新掃描'
      )
  }
  const availableColumns = [
    { id: 'name', label: '資料夾名稱' },
    { id: 'path', label: '目前路徑' },
    { id: 'depth', label: '層級' },
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
          <Tooltip label={browse.panelVisible === false ? '顯示右側內容' : '隱藏右側內容'}>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="切換右側內容"
              aria-pressed={browse.panelVisible !== false}
              disabled={!ready}
              onClick={togglePanel}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden="true"
              >
                <rect x="2.5" y="3.5" width="15" height="13" rx="1" />
                <path d="M12 4v12" />
                {browse.panelVisible !== false && (
                  <path d="M13 5h3.5v10H13z" fill="currentColor" stroke="none" />
                )}
              </svg>
            </ActionIcon>
          </Tooltip>,
          toolbarTarget
        )}
      <section className="center-pane" aria-label="資料夾瀏覽區">
        <div className="workspace-toolbar">
          <div className="toolbar-left">
            {browse.mode === 'CARD' && (
              <>
                <div className="preset-controls">
                  <Select
                    aria-label="CELL 版面方案"
                    size="xs"
                    value={project.activeLayoutId ?? presets[0].id}
                    allowDeselect={false}
                    data={presets.map((p) => ({ value: p.id, label: p.name }))}
                    disabled={busy}
                    onChange={(id) => id && pickPreset(id)}
                  />
                  <Tooltip label="更改樣式">
                    <ActionIcon
                      aria-label="更改樣式"
                      variant="default"
                      disabled={busy}
                      onClick={() => edit()}
                    >
                      ✎
                    </ActionIcon>
                  </Tooltip>
                </div>
                <Menu>
                  <Menu.Target>
                    <ActionIcon
                      className="compact-presets"
                      aria-label="CELL 方案選單"
                      variant="subtle"
                    >
                      ▦
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {presets.map((p) => (
                      <Menu.Item key={p.id} onClick={() => pickPreset(p.id)}>
                        {p.name}
                      </Menu.Item>
                    ))}
                    <Menu.Divider />
                    <Menu.Item onClick={() => edit()}>更改樣式</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </div>
          <SegmentedControl
            className="center-mode"
            aria-label="瀏覽模式"
            size="xs"
            value={browse.mode}
            data={['CARD', 'TABLE', 'TREE']}
            disabled={busy||!ready}
            onChange={(mode) => void switchMode(mode as BrowseMode)}
          />
          <div className="toolbar-right">
            {browse.mode === 'CARD' && (
              <Tooltip label="CARD 顯示設定">
                <ActionIcon
                  aria-label="CARD 顯示設定"
                  variant="subtle"
                  color="gray"
                  disabled={busy}
                  onClick={openDisplay}
                >
                  ☷
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label="重新掃描">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="重新掃描"
                disabled={busy}
                onClick={() => void act({ action: 'scan' })}
              >
                ⟳
              </ActionIcon>
            </Tooltip>
            <Tooltip label="目前資料夾設定">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="目前資料夾設定"
                disabled={!currentFolder || busy}
                onClick={() => currentFolder && openConfig(currentFolder.rowId)}
              >
                ⚙
              </ActionIcon>
            </Tooltip>
          </div>
        </div>
        <div className="workspace-breadcrumb">
          <Tooltip label="返回上一個瀏覽位置">
            <ActionIcon
              aria-label="返回"
              disabled={!navigable || !history.index || busy}
              variant="subtle"
              color="gray"
              onClick={() => navHistory(-1)}
            >
              ←
            </ActionIcon>
          </Tooltip>
          <Tooltip label="前進至下一個瀏覽位置">
            <ActionIcon
              aria-label="前進"
              disabled={!navigable || history.index >= history.items.length - 1 || busy}
              variant="subtle"
              color="gray"
              onClick={() => navHistory(1)}
            >
              →
            </ActionIcon>
          </Tooltip>
          <nav className="breadcrumb-path" aria-label="資料夾路徑" title={location || root}>
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
            {filtered.length} 筆
            {browse.mode === 'CARD'
              ? ' · ' +
                (card.mode === 'multi' ? '多層' : '單層') +
                ' · ' +
                (card.level === 'all'
                  ? '全部（最深第 ' + deepest + ' 層）'
                  : card.mode === 'multi'
                    ? '第 1–' + card.level + ' 層'
                    : '第 ' + card.level + ' 層')
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
          {browse.mode === 'TREE' ? (
            <Suspense fallback={<p>載入樹狀圖…</p>}>
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
                          title="點擊排序；拖曳調整欄位順序（Alt+←／→）"
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
                          aria-label={'調整 ' + c.label + ' 欄寬'}
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
                                  : String(fieldValue(r, c.id) ?? '')}
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
                        ? '需要處理'
                        : row.readonly
                          ? '受保護'
                          : !row.record
                            ? '尚未建立資料'
                            : '遊戲邊界'}
                    </small>
                  )}
                </article>
              ))}
            </div>
          )}
          {!current.length && browse.mode !== 'TREE' && (
            <div className="empty-folder">此層沒有可顯示的子資料夾</div>
          )}
        </div>
        {browse.mode !== 'TREE' && (
          <div className="browse-pagination">
            <Pagination size="xs" total={pages} value={Math.min(page, pages)} onChange={setPage} />
            <small>每頁 {pageSize} 筆</small>
          </div>
        )}
      </section>
      {detail && browse.panelVisible !== false && (
        <>
          <div
            role="separator"
            aria-label="調整資料夾內容寬度"
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
            aria-label="資料夾內容"
            style={{ width: browse.panelWidth }}
          >
            <div className="folder-panel-header">
              {project.mediaCategory === 'video' && <Menu position="bottom-start" withinPortal><Menu.Target><Tooltip label="影片設定"><ActionIcon className="video-settings-trigger" variant="subtle" color="gray" aria-label="影片設定"><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 5h14M3 10h14M3 15h14M7 3v4M13 8v4M8 13v4"/></svg></ActionIcon></Tooltip></Menu.Target><Menu.Dropdown><Menu.Label>此專案開啟資料夾時</Menu.Label>{[{value:true,label:'開啟後自動播放'},{value:false,label:'關閉自動播放'}].map(option=><Menu.Item key={String(option.value)} disabled={busy} leftSection={(project.videoAutoplay!==false)===option.value?'✓':'　'} onClick={()=>void act({action:'saveProject',project:{...project,videoAutoplay:option.value}})}>{option.label}</Menu.Item>)}<Menu.Divider/><Menu.Item onClick={()=>setSubtitleSettingsOpen(true)}>字幕設定</Menu.Item></Menu.Dropdown></Menu>}
              {project.mediaCategory !== 'video' && <strong>{detail.name}</strong>}
              {project.mediaCategory === 'manga' && <Tooltip label="編輯此專案所有漫畫的資訊版面；CARD 版面獨立"><ActionIcon aria-label="編輯漫畫展示" variant="subtle" color="gray" disabled={busy} onClick={()=>edit('manga')}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M8 3v14M8 9h9"/></svg></ActionIcon></Tooltip>}
              <ActionIcon
                aria-label={expanded ? '還原內容區' : '放大內容區'}
                variant="subtle"
                color="gray"
                onClick={() => setExpanded((v) => !v)}
              >
                □
              </ActionIcon>
              <ActionIcon
                aria-label="關閉資料夾內容"
                variant="subtle"
                color="gray"
                onClick={togglePanel}
              >
                ×
              </ActionIcon>
            </div>
            <div className="folder-panel-body">
              <Suspense fallback={<p>載入內容…</p>}>
                <FolderContent
                  key={detail.rowId}
                  row={detail}
                  project={project}
                  run={run}
                  act={act}
                  busy={busy}
                  configure={() => openConfig(detail.rowId)}
                  subtitleSettingsOpen={subtitleSettingsOpen}
                  closeSubtitleSettings={() => setSubtitleSettingsOpen(false)}
                  onChild={child}
                />
              </Suspense>
            </div>
            {project.mediaCategory === 'manga' && <Button className="manga-top" size="compact-sm" variant="default" aria-label="漫畫回到頂部" onClick={event=>event.currentTarget.closest('.folder-panel')?.querySelector('.folder-panel-body')?.scrollTo({top:0,behavior:'smooth'})}>↑ TOP</Button>}
          </aside>
        </>
      )}
      <Drawer
        opened={!!config}
        onClose={closeConfig}
        title={'資料夾設定 · ' + (config?.name ?? '')}
        position="right"
        size="lg"
        zIndex={300}
        closeButtonProps={{ 'aria-label': '關閉資料夾設定' }}
      >
        {config && (
          <Suspense fallback={<p>載入設定…</p>}>
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
        title="CARD 顯示設定"
        size="md"
      >
        <Stack gap="lg">
          <section className="card-display-section">
            <Text fw={600} mb="sm">
              顯示範圍
            </Text>
            <SegmentedControl
              fullWidth
              aria-label="層級顯示"
              value={display.mode}
              data={[
                { value: 'multi', label: '多層' },
                { value: 'single', label: '單層' },
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
                ? '將根資料夾與子資料夾放在同一畫面。雙擊只更新右側內容。'
                : '顯示指定層級，雙擊可像一般資料夾逐層進入。'}
            </Text>
            <Select
              label="顯示層數"
              description={
                display.mode === 'multi'
                  ? '從專案根開始，顯示到哪一層'
                  : '開啟 CARD 時，先顯示哪一層'
              }
              allowDeselect={false}
              value={String(display.level)}
              data={[
                ...(display.mode === 'multi'
                  ? [{ value: 'all', label: '全部已掃描層級（最深第 ' + deepest + ' 層）' }]
                  : []),
                ...Array.from({ length: deepest }, (_, i) => ({
                  value: String(i + 1),
                  label:
                    display.mode === 'multi'
                      ? '第 1 層至第 ' + (i + 1) + ' 層'
                      : '第 ' + (i + 1) + ' 層',
                })),
              ]}
              onChange={(v) =>
                v && setDisplay({ ...display, level: v === 'all' ? 'all' : Number(v) })
              }
            />
            <Text size="xs" c="dimmed" mt="xs">
              專案根資料夾為第 1 層，目前已掃描最深到第 {deepest} 層。
            </Text>
          </section>
          <section className="card-display-section">
            <Text fw={600} mb="sm">
              卡片密度
            </Text>
            <div className="display-density">
              <NumberInput
                label="每列卡片數"
                description="視窗變窄時會自動減少"
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
                label="每頁筆數"
                description="控制單頁顯示的資料夾數"
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
            套用後先顯示 {previewCount} 個資料夾，最多每列 {density.itemsPerRow} 張、每頁{' '}
            {density.pageSize} 筆。
          </Text>
          <Text size="xs" c="dimmed">
            只調整 CARD，不變更 TREE／TABLE，也不會擴大掃描範圍。
          </Text>
          <Group justify="flex-end">
            <Button variant="default" disabled={busy} onClick={() => setDisplayOpen(false)}>
              取消
            </Button>
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
              套用
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}
