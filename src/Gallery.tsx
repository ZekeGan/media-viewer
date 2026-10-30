import { t as tr, useLocale, currentLocale } from './i18n'
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Icon } from './icons'
import { ActionIcon, Button, Center, Group, SegmentedControl, Stack, Tooltip } from '@mantine/core'
import { canPreviewMedia, mediaIdentity } from '../shared/media'
import type { MediaEntry, OverviewEntry, ReadingPrefs } from '../shared/explorer'
import {
  galleryLayout,
  groupedGalleryLayout,
  galleryWindow,
  type GalleryMode,
  type GalleryTile,
} from '../shared/gallery'
const Reader = lazy(() => import('./Reader').then((module) => ({ default: module.Reader })))
const PAGE_SIZE = 200
const Tile = memo(
  function Tile({
    entry,
    tile,
    mode,
    playing,
    selected,
    open,
    select,
    ratio,
    enqueue,
    queued,
    openFolder,
  }: {
    entry: MediaEntry
    tile: GalleryTile
    mode: GalleryMode
    playing: boolean
    selected: boolean
    open: (index: number) => void
    select: (index: number) => void
    ratio: (id: string, value: number) => void
    enqueue?: (entry: MediaEntry) => void
    queued?: boolean
    openFolder?: (entry: MediaEntry) => void
  }) {
    useLocale()

    const [error, setError] = useState(false),
      [fallback, setFallback] = useState(false),
      [visible, setVisible] = useState(false)
    const image = useRef<HTMLImageElement | null>(null)
    const bindImage = useCallback((node: HTMLImageElement | null) => {
      const previous = image.current
      image.current = node
      if (previous && previous !== node) previous.removeAttribute('src')
    }, [])
    const animated = entry.mime === 'image/gif',
      animate = animated && playing && visible,
      source =
        animated && !animate && (!entry.thumb || fallback)
          ? undefined
          : animate || fallback
            ? entry.url
            : (entry.thumb ?? entry.url)
    useEffect(() => {
      if (!animated) return
      const element = image.current?.closest('.gallery-tile')
      if (!element) return
      const observer = new IntersectionObserver(
        (entries) => setVisible(entries[0].isIntersecting),
        { root: element.closest('.folder-panel-body') }
      )
      observer.observe(element)
      return () => observer.disconnect()
    }, [animated])
    useEffect(() => {
      const node = image.current
      if (mode === 'masonry' && node?.complete && node.naturalHeight)
        ratio(mediaIdentity(entry), node.naturalWidth / node.naturalHeight)
    }, [mode, entry, ratio])
    const add =
      ['audio', 'video'].includes(entry.kind) && enqueue ? (
        <button
          className="media-enqueue"
          aria-label={
            queued ? tr('移出音樂佇列 {0}', entry.name) : tr('加入音樂佇列 {0}', entry.name)
          }
          onClick={(event) => {
            event.stopPropagation()
            enqueue(entry)
          }}
        >
          <Icon name={queued ? 'check' : 'plus'} size={16} />
        </button>
      ) : null
    const supported = canPreviewMedia(entry)
    const location =
      !supported && openFolder ? (
        <Tooltip label={tr('開啟所在資料夾')}>
          <ActionIcon
            className="media-file-location"
            variant="default"
            aria-label={tr('開啟所在資料夾')}
            onClick={(event) => {
              event.stopPropagation()
              openFolder(entry)
            }}
          >
            <Icon name="folder" size={16} />
          </ActionIcon>
        </Tooltip>
      ) : null
    const thumbnail = (
      <button
        className="media-thumbnail"
        title={'sourcePath' in entry ? String(entry.sourcePath) + '/' + entry.name : entry.name}
        aria-label={
          'sourcePath' in entry ? String(entry.sourcePath) + '/' + entry.name : entry.name
        }
        onClick={() => (supported ? open(tile.index) : select(tile.index))}
      >
        <span className="thumbnail-image">
          {!supported ? (
            <span className="unsupported-file-info">
              <Icon name="file" size={28} />
              <small>{tr('不支援內建預覽')}</small>
              <small>
                {entry.mime} · {(entry.size / 1024).toFixed(1)} KB
              </small>
            </span>
          ) : entry.kind !== 'image' && !entry.thumb ? (
            <Icon
              name={entry.kind === 'audio' ? 'music' : entry.kind === 'video' ? 'video' : 'file'}
              size={36}
            />
          ) : !error ? (
            <img
              ref={bindImage}
              decoding="async"
              src={entry.kind === 'image' ? source : entry.thumb}
              alt={entry.name}
              onLoad={(event) => {
                const node = event.currentTarget
                if (mode === 'masonry' && node.naturalHeight)
                  ratio(mediaIdentity(entry), node.naturalWidth / node.naturalHeight)
              }}
              onError={() => {
                if (entry.kind === 'image' && !fallback && entry.thumb) setFallback(true)
                else setError(true)
              }}
            />
          ) : (
            <span>{tr('圖片無法載入，點擊檢視')}</span>
          )}
        </span>
        <small>{entry.name}</small>
      </button>
    )
    const style = { left: tile.x, top: tile.y, width: tile.width, height: tile.height }
    return mode === 'list' ? (
      <div
        className={'gallery-tile image-file-row ' + (selected ? 'selected' : '')}
        style={style}
        data-index={tile.index}
        onClick={() => select(tile.index)}
      >
        {thumbnail}
        {add}
        {location}
        <span title={entry.name}>
          {entry.name}
          {!supported && (
            <small className="unsupported-file-reason">
              {tr('不支援內建預覽')} · {entry.mime}
            </small>
          )}
        </span>
        <small>{new Date(entry.modified).toLocaleDateString(currentLocale())}</small>
        <small>{(entry.size / 1024).toFixed(1)} KB</small>
      </div>
    ) : (
      <div className="gallery-tile" style={style} data-index={tile.index}>
        {thumbnail}
        {add}
        {location}
      </div>
    )
  },
  (before, after) =>
    before.open === after.open &&
    before.openFolder === after.openFolder &&
    before.enqueue === after.enqueue &&
    before.entry === after.entry &&
    before.mode === after.mode &&
    before.playing === after.playing &&
    before.selected === after.selected &&
    before.queued === after.queued &&
    before.tile.index === after.tile.index &&
    before.tile.x === after.tile.x &&
    before.tile.y === after.tile.y &&
    before.tile.width === after.tile.width &&
    before.tile.height === after.tile.height
)
export function Gallery({
  entries,
  manga,
  prefs,
  save,
  onReader,
  loading = false,
  mixed = false,
  presentation,
  suspended = false,
  onOpen,
  onOpenFolder,
  onEnqueue,
  queuedIds,
  groupBySource = false,
  sourceRoot,
  onSource,
}: {
  entries: MediaEntry[]
  manga: boolean
  prefs?: ReadingPrefs
  save: (prefs: ReadingPrefs) => void
  onReader: (opened: boolean) => void
  loading?: boolean
  mixed?: boolean
  presentation?: string
  suspended?: boolean
  onOpen?: (entry: MediaEntry, entries: MediaEntry[]) => void
  onOpenFolder?: (entry: MediaEntry) => void
  onEnqueue?: (entry: MediaEntry) => void
  queuedIds?: string[]
  groupBySource?: boolean
  sourceRoot?: string
  onSource?: (id: string) => void
}) {
  useLocale()

  const [mode, setMode] = useState('masonry'),
    [page, setPage] = useState(0),
    [reader, setReader] = useState<number>(),
    [selected, setSelected] = useState<number>(),
    [focused, setFocused] = useState(-1),
    [version, setVersion] = useState(0)
  const [view, setView] = useState({ top: 0, height: 700, width: 0 }),
    actualTop = useRef(0),
    grid = useRef<HTMLDivElement>(null),
    scroll = useRef<HTMLElement | null>(null),
    ratios = useRef(new Map<string, number>()),
    frame = useRef(0),
    ratioFrame = useRef(0),
    anchor = useRef<{ index: number; y: number; scrollTop: number }>(),
    focusNext = useRef<number>(),
    modeAnchor = useRef<{ index: number; origin: number }>()
  const images = useMemo(
      () => entries.filter((entry) => (mixed ? entry.kind !== 'folder' : entry.kind === 'image')),
      [entries, mixed]
    ),
    items = useMemo(() => images.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [images, page]),
    kind: GalleryMode =
      manga || presentation === 'tiles'
        ? 'manga'
        : (presentation ?? mode) === 'list'
          ? 'list'
          : 'masonry'
  useEffect(() => {
    if (!loading) {
      const last = Math.max(0, Math.ceil(images.length / PAGE_SIZE) - 1)
      if (page > last) {
        setPage(last)
        setFocused(-1)
      }
    }
  }, [images.length, loading, page])
  const pageRatios = useMemo(
    () =>
      new Map(
        items.flatMap((entry, index) => {
          const value =
            ratios.current.get(mediaIdentity(entry)) ??
            (entry.kind !== 'image' ? 16 / 9 : undefined)
          return value ? [[index, value] as const] : []
        })
      ),
    [items, page, version]
  )
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const sourceGroups = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; name: string; path: string; count: number; indices: number[] }
    >()
    const counts = new Map<string, number>()
    if (groupBySource)
      for (const item of images) {
        const id = (item as OverviewEntry).rowId
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    if (groupBySource)
      items.forEach((item, index) => {
        const source = item as OverviewEntry
        const group = groups.get(source.rowId) ?? {
          id: source.rowId,
          name: source.folderName,
          path: source.sourcePath,
          count: counts.get(source.rowId) ?? 0,
          indices: [],
        }
        group.indices.push(index)
        groups.set(source.rowId, group)
      })
    return [...groups.values()]
  }, [items, images, groupBySource])
  const layout = useMemo(
    () =>
      groupBySource
        ? groupedGalleryLayout(sourceGroups, view.width || 300, kind, pageRatios, collapsed)
        : { ...galleryLayout(items.length, view.width || 300, kind, pageRatios), headers: [] },
    [items.length, view.width, kind, pageRatios, sourceGroups, collapsed, groupBySource]
  )
  const current = useRef({ layout, view, page })
  current.current = { layout, view, page }
  const measure = useCallback(() => {
    const element = grid.current,
      root = scroll.current
    if (!element || !root) return
    const bounds = element.getBoundingClientRect(),
      port = root.getBoundingClientRect()
    actualTop.current = port.top + root.clientTop - bounds.top
    const next = {
      top: Math.floor(actualTop.current / 120) * 120,
      height: root.clientHeight,
      width: element.clientWidth,
    }
    setView((previous) =>
      previous.top === next.top && previous.height === next.height && previous.width === next.width
        ? previous
        : next
    )
  }, [])
  useLayoutEffect(() => {
    const element = grid.current,
      root = element?.closest<HTMLElement>('.folder-panel-body')
    if (!element || !root) return
    scroll.current = root
    const previous = root.style.overflowAnchor
    root.style.overflowAnchor = 'none'
    const update = () => {
        if (anchor.current && Math.abs(root.scrollTop - anchor.current.scrollTop) > 1)
          anchor.current = undefined
        if (!frame.current)
          frame.current = requestAnimationFrame(() => {
            frame.current = 0
            measure()
          })
      },
      observer = new ResizeObserver(update)
    root.addEventListener('scroll', update, { passive: true })
    observer.observe(root)
    observer.observe(element)
    measure()
    return () => {
      root.removeEventListener('scroll', update)
      observer.disconnect()
      cancelAnimationFrame(frame.current)
      cancelAnimationFrame(ratioFrame.current)
      root.style.overflowAnchor = previous
      scroll.current = null
      frame.current = 0
      ratioFrame.current = 0
    }
  }, [measure])
  useLayoutEffect(() => {
    const root = scroll.current
    if (!root) return
    const saved = anchor.current
    anchor.current = undefined
    if (saved) {
      const tile = layout.tiles.find((tile) => tile.index === saved.index)
      if (tile) root.scrollTop = saved.scrollTop + tile.y - saved.y
    }
    if (modeAnchor.current !== undefined) {
      const tile = layout.tiles.find((tile) => tile.index === modeAnchor.current!.index),
        origin = modeAnchor.current.origin
      modeAnchor.current = undefined
      if (tile) root.scrollTop = origin + tile.y
    }
    measure()
  }, [layout, measure])
  const reportRatio = useCallback((key: string, value: number) => {
    const state = current.current
    if (!Number.isFinite(value) || value <= 0 || ratios.current.has(key)) return
    if (!anchor.current) {
      const top = actualTop.current,
        visible = state.layout.tiles
          .filter((tile) => tile.y >= top && tile.y < top + state.view.height)
          .sort((a, b) => a.y - b.y)[0]
      if (visible)
        anchor.current = {
          index: visible.index,
          y: visible.y,
          scrollTop: scroll.current?.scrollTop ?? 0,
        }
    }
    ratios.current.set(key, value)
    if (!ratioFrame.current)
      ratioFrame.current = requestAnimationFrame(() => {
        ratioFrame.current = 0
        setVersion((value) => value + 1)
      })
  }, [])
  useLayoutEffect(() => {
    const index = focusNext.current
    if (index === undefined) return
    const button = grid.current?.querySelector<HTMLButtonElement>(
      `[data-index="${index}"] .media-thumbnail`
    )
    if (button) {
      focusNext.current = undefined
      button.focus({ preventScroll: true })
    }
  }, [view, focused, layout])
  useEffect(() => {
    onReader(reader !== undefined)
    return () => onReader(false)
  }, [reader, onReader])
  const open = useCallback(
    (index: number) => {
      const at = current.current.page * PAGE_SIZE + index
      if (!images[at] || !canPreviewMedia(images[at])) return
      if (onOpen) onOpen(images[at], images)
      else setReader(at)
    },
    [onOpen, images]
  )
  const select = useCallback(
    (index: number) => setSelected(current.current.page * PAGE_SIZE + index),
    []
  )
  const tiles = galleryWindow(layout, view.top, view.height, 240, focused)
  const changePage = (next: number) => {
    anchor.current = undefined
    modeAnchor.current = undefined
    setPage(next)
    setFocused(-1)
    scroll.current?.scrollTo({ top: 0 })
    measure()
  }
  const selection = selected === undefined ? undefined : images[selected]
  return (
    <div className="gallery">
      <Group justify="space-between" mb="sm">
        <strong>
          {images.length} {mixed ? tr('個檔案') : tr('張圖片')}
          {loading && (
            <small className="gallery-loading" role="status">
              {' '}
              {tr('· 讀取中…')}
            </small>
          )}
        </strong>
        {!manga && !mixed && (
          <>
            <SegmentedControl
              size="xs"
              value={mode}
              onChange={(value) => {
                const tile = layout.tiles
                  .filter((tile) => tile.y + tile.height > actualTop.current)
                  .sort((a, b) => a.y - b.y)[0]
                if (tile)
                  modeAnchor.current = {
                    index: tile.index,
                    origin: (scroll.current?.scrollTop ?? 0) - actualTop.current,
                  }
                setMode(value)
              }}
              data={[
                { value: 'masonry', label: tr('瀑布流') },
                { value: 'list', label: tr('列表') },
              ]}
            />
          </>
        )}
      </Group>
      {!images.length && !loading && (
        <p className="muted">{mixed ? tr('沒有符合條件的檔案') : tr('此資料夾沒有直接圖片。')}</p>
      )}
      <div
        ref={grid}
        className={
          'virtual-gallery ' +
          (kind === 'list'
            ? 'image-file-list'
            : kind === 'manga'
              ? 'manga-gallery'
              : 'masonry-gallery')
        }
        style={{ height: layout.height }}
        onFocusCapture={(event) => {
          const tile = (event.target as HTMLElement).closest<HTMLElement>('[data-index]')
          if (tile) setFocused(Number(tile.dataset.index))
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return
          const tile = (event.target as HTMLElement).closest<HTMLElement>('[data-index]')
          if (!tile) return
          const index = Number(tile.dataset.index),
            delta =
              event.key === 'ArrowLeft'
                ? -1
                : event.key === 'ArrowRight'
                  ? 1
                  : event.key === 'ArrowUp'
                    ? -layout.columns
                    : event.key === 'ArrowDown'
                      ? layout.columns
                      : 0,
            visible = layout.tiles.map((tile) => tile.index),
            position = visible.indexOf(index),
            next =
              event.key === 'Home'
                ? visible[0]
                : event.key === 'End'
                  ? visible.at(-1)
                  : visible[position + delta]
          if ((!delta && !['Home', 'End'].includes(event.key)) || next === undefined) return
          event.preventDefault()
          focusNext.current = next
          setFocused(next)
          const target = layout.tiles.find((tile) => tile.index === next)!,
            root = scroll.current
          if (root) root.scrollTop += target.y - actualTop.current
          measure()
        }}
      >
        {layout.headers
          .filter(
            (header) =>
              header.top + 40 >= view.top - 240 && header.top <= view.top + view.height + 240
          )
          .map((header) => {
            const group = sourceGroups.find((group) => group.id === header.id)!
            const relative = sourceRoot
              ? group.path.slice(sourceRoot.length).replace(/^[/\\]+/, '')
              : group.path
            return (
              <div
                className="gallery-source-header"
                key={'source/' + group.id}
                style={{ top: header.top }}
              >
                <Tooltip label={group.path} events={{ hover: true, focus: true, touch: false }}>
                  <button
                    aria-expanded={!collapsed.has(group.id)}
                    onClick={() =>
                      setCollapsed((previous) => {
                        const next = new Set(previous)
                        if (next.has(group.id)) next.delete(group.id)
                        else next.add(group.id)
                        return next
                      })
                    }
                  >
                    <Icon name={collapsed.has(group.id) ? 'chevron-right' : 'minus'} size={14} />
                    <span>
                      <strong>{group.name}</strong>
                      <small>{relative || group.name}</small>
                    </span>
                    <small>{group.count}</small>
                  </button>
                </Tooltip>
                {onSource && (
                  <Stack>
                    <Tooltip label={tr('前往此資料夾')}>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        aria-label={tr('前往資料夾 {0}', group.name)}
                        onClick={() => onSource(group.id)}
                      >
                        <Icon name="arrow-right" size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Stack>
                )}
              </div>
            )
          })}
        {view.width > 0 &&
          tiles.map((tile) => (
            <Tile
              key={mediaIdentity(items[tile.index])}
              entry={items[tile.index]}
              tile={tile}
              mode={kind}
              playing={!suspended && reader === undefined && items[tile.index].mime === 'image/gif'}
              selected={selected === page * PAGE_SIZE + tile.index}
              open={open}
              select={select}
              ratio={reportRatio}
              enqueue={onEnqueue}
              openFolder={onOpenFolder}
              queued={queuedIds?.includes(mediaIdentity(items[tile.index]))}
            />
          ))}
      </div>
      {images.length > PAGE_SIZE && (
        <Center mt="sm" style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ActionIcon variant="light" disabled={!page} onClick={() => changePage(page - 1)}>
              <Icon name="arrow-left" />
            </ActionIcon>

            <small style={{ fontSize: '13px' }}>
              {tr('每組')}
              {PAGE_SIZE} {mixed ? tr('筆') : tr('張 ·')}
              {page + 1}／{Math.ceil(images.length / PAGE_SIZE)}
            </small>

            <ActionIcon
              variant="light"
              disabled={(page + 1) * PAGE_SIZE >= images.length}
              onClick={() => changePage(page + 1)}
            >
              <Icon name="arrow-right" />
            </ActionIcon>
          </div>
        </Center>
      )}

      {reader !== undefined && (
        <Suspense
          fallback={
            <div className="reader-loading-overlay" role="status">
              {tr('開啟圖片…')}
            </div>
          }
        >
          <Reader
            images={images}
            start={reader}
            manga={manga}
            prefs={prefs}
            save={save}
            close={() => setReader(undefined)}
          />
        </Suspense>
      )}
    </div>
  )
}
