import { useEffect, useMemo, useRef, useState } from 'react'
import { ActionIcon, Button, Menu, Select, Tooltip } from '@mantine/core'
import type {
  ContentResult,
  ExplorerRequest,
  ExplorerResponse,
  MediaEntry,
  OverviewEntry,
} from '../shared/explorer'
import type { FolderRow, Project, Request, Response } from '../shared/model'
import {
  canPreviewMedia,
  matchesMedia,
  mediaIdentity,
  visibleFile,
  type MediaFilter,
} from '../shared/media'
import { Gallery } from './Gallery'
import { MediaViewer } from './MediaViewer'
import { usePlayback } from './Playback'
import { Card } from './Card'
import { contentCells } from '../shared/explorer'
import { useFileVisibility } from './useFileVisibility'
import { Icon } from './icons'
import { t as tr, useLocale } from './i18n'
import './media-workspace.css'

export function MediaBrowser({
  row,
  project,
  entries,
  loading,
  error,
  reload,
  onChild,
  run,
  act,
  busy,
  configure,
  childNames,
  sourceRows,
  onSource,
}: {
  row: FolderRow
  project: Project
  entries: ContentResult['entries']
  loading: boolean
  error: string
  reload: () => void
  onChild: (name: string) => void
  configure: () => void
  childNames?: string[]
  sourceRows: FolderRow[]
  onSource: (id: string) => void
  run: (request: ExplorerRequest) => Promise<ExplorerResponse | undefined>
  act: (request: Request) => Promise<Response | undefined>
  busy: boolean
}) {
  useLocale()
  const [filter, setFilter] = useState<MediaFilter>(
      project.mediaCategory === 'music' || project.mediaSourceCategory === 'music' ? 'audio' : 'all'
    ),
    [view, setView] = useState('masonry')
  const [scope, setScope] = useState<'current' | 'descendants'>('current'),
    [grouped, setGrouped] = useState(false),
    [version, setVersion] = useState(0)
  const [overview, setOverview] = useState<{
    entries: OverviewEntry[]
    notices: string[]
    loading: boolean
  }>({ entries: [], notices: [], loading: false })
  const [session, setSession] = useState<{
      file: MediaEntry
      source: FolderRow
      filter: MediaFilter
      added?: string[]
    }>(),
    [opening, setOpening] = useState('')
  const [audioIds, setAudioIds] = useState<string[]>([])
  const alive = useRef(true),
    operation = useRef(0)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      operation.current++
    }
  }, [])
  const { visibility, save, error: visibilityError } = useFileVisibility()
  useEffect(() => {
    if (scope !== 'descendants') return
    let active = true
    setOverview({ entries: [], notices: [], loading: true })
    void (async () => {
      let cursor: string | undefined
      do {
        const response = await window.explorer.request({
          action: 'overview',
          rowId: row.rowId,
          scope,
          limit: cursor ? 200 : 96,
          cursor,
        })
        if (!active) return
        const page = response.overview
        if (!page) throw new Error(tr('無法取得檔案總覽'))
        setOverview((previous) => ({
          entries: [...previous.entries, ...page.entries],
          notices: [...new Set([...previous.notices, ...page.notices])].slice(0, 100),
          loading: !!page.nextCursor,
        }))
        cursor = page.nextCursor
        if (cursor) await new Promise((resolve) => setTimeout(resolve, 20))
      } while (active && cursor)
    })().catch((reason) => {
      if (active)
        setOverview((previous) => ({
          ...previous,
          notices: [...previous.notices, String(reason)],
          loading: false,
        }))
    })
    return () => {
      active = false
    }
  }, [scope, row.rowId, version])
  const files = useMemo(
    () =>
      scope === 'descendants'
        ? overview.entries
        : entries
            .filter((entry) => entry.kind !== 'folder')
            .map((entry) => ({
              ...entry,
              rowId: row.rowId,
              folderName: row.name,
              sourcePath: row.path,
            })),
    [scope, overview.entries, entries, row.rowId, row.name, row.path]
  )
  const visible = useMemo(
    () => files.filter((entry) => visibleFile(entry, visibility)),
    [files, visibility]
  )
  const shown = useMemo(
    () => visible.filter((entry) => matchesMedia(entry, filter)),
    [visible, filter]
  )
  const folders = entries.filter((entry) => entry.kind === 'folder'),
    pending = scope === 'descendants' ? overview.loading : loading
  const added = useMemo(() => {
    const byId = new Map(
      shown.filter((entry) => entry.kind === 'audio').map((entry) => [mediaIdentity(entry), entry])
    )
    return audioIds.flatMap((id) => byId.get(id) ?? [])
  }, [shown, audioIds])
  const addedSources = new Map<string, typeof added>()
  for (const entry of added) {
    const group = addedSources.get(entry.rowId) ?? []
    group.push(entry)
    addedSources.set(entry.rowId, group)
  }
  const playback = usePlayback()
  useEffect(() => {
    playback?.source({ row, project, entries: entries.filter((entry) => entry.kind !== 'folder') })
  }, [row.rowId, entries, project])
  const open = async (entry: MediaEntry, playAdded = false) => {
    if (!canPreviewMedia(entry) || busy || opening) return
    const sourceId = (entry as OverviewEntry).rowId ?? row.rowId,
      token = ++operation.current
    setOpening(sourceId)
    try {
      const result = await run({ action: 'visit', rowId: sourceId })
      if (!alive.current || token !== operation.current || !result?.snapshot) return
      const source = (result.snapshot.structure ?? result.snapshot.rows).find(
        (item) => item.rowId === sourceId
      )
      if (source?.record && ['audio', 'video'].includes(entry.kind) && playback) {
        await playback.open(
          { row: source, project, entries: visible.filter((file) => file.rowId === source.rowId) },
          entry
        )
        return
      }
      if (source?.record)
        setSession({ file: entry, source, filter, ...(playAdded ? { added: [...audioIds] } : {}) })
    } finally {
      if (alive.current && token === operation.current) setOpening('')
    }
  }
  const sourceFiles = session ? visible.filter((entry) => entry.rowId === session.source.rowId) : []
  const viewerFiles = session
    ? sourceFiles.filter(
        (entry) =>
          entry.kind === 'subtitle' ||
          (matchesMedia(entry, session.filter) &&
            (!session.added || session.added.includes(mediaIdentity(entry))))
      )
    : []
  return (
    <div className="mixed-media-browser">
      <div className="mixed-media-toolbar">
        <Select
          className="media-scope-select"
          aria-label={tr('檔案範圍')}
          size="xs"
          allowDeselect={false}
          value={scope}
          disabled={busy || !!opening}
          onChange={(value) => value && setScope(value as typeof scope)}
          data={[
            { value: 'current', label: tr('目前資料夾') },
            { value: 'descendants', label: tr('包含子資料夾') },
          ]}
        />
        <Select
          aria-label={tr('檔案類型')}
          size="xs"
          allowDeselect={false}
          value={filter}
          onChange={(value) => value && setFilter(value as MediaFilter)}
          data={(['all', 'video', 'image', 'audio', 'other'] as const).map((value) => ({
            value,
            label: tr(
              { all: '全部', video: '影片', image: '圖片', audio: '音樂', other: '其他' }[value]
            ),
          }))}
        />
        <Select
          className="media-view-select"
          aria-label={tr('檔案展示方式')}
          size="xs"
          allowDeselect={false}
          value={view}
          onChange={(value) => value && setView(value)}
          data={[
            { value: 'masonry', label: tr('瀑布流') },
            { value: 'tiles', label: tr('縮圖') },
            { value: 'list', label: tr('列表') },
          ]}
        />
        <Tooltip label={tr('重新整理')}>
          <ActionIcon
            variant="subtle"
            aria-label={tr('重新整理')}
            disabled={pending || busy || !!opening}
            onClick={() => {
              reload()
              setVersion((value) => value + 1)
            }}
          >
            <Icon name="refresh" />
          </ActionIcon>
        </Tooltip>
        <Menu position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" aria-label={tr('更多檔案選項')}>
              <Icon name="more" />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={grouped ? <Icon name="check" /> : null}
              onClick={() => setGrouped((value) => !value)}
            >
              {tr('依來源分組')}
            </Menu.Item>
            <Menu.Item
              leftSection={visibility.hidden ? <Icon name="check" /> : null}
              onClick={() => void save({ ...visibility, hidden: !visibility.hidden })}
            >
              {tr('顯示隱藏檔案')}
            </Menu.Item>
            <Menu.Item
              leftSection={visibility.dotfiles ? <Icon name="check" /> : null}
              onClick={() => void save({ ...visibility, dotfiles: !visibility.dotfiles })}
            >
              {tr('顯示點開頭檔案')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
      {(error || visibilityError || overview.notices.length > 0) && (
        <p role="alert">
          {[error, visibilityError, ...(scope === 'descendants' ? overview.notices : [])]
            .filter(Boolean)
            .join('\n')}
        </p>
      )}
      {!!opening && <small role="status">{tr('載入內容…')}</small>}
      <details className="media-folder-info">
        <summary>{tr('資料夾資訊')}</summary>
        <Card
          row={row}
          project={{
            ...project,
            folderLayouts: undefined,
            cells: contentCells(project, project.mediaCategory),
          }}
          open={() => void act({ action: 'open', rowId: row.rowId })}
        />
      </details>
      {!!folders.length && (
        <details className="media-subfolders" open>
          <summary>
            {tr('子資料夾')} ({folders.length})
          </summary>
          <div>
            {folders.map((folder) => (
              <div className="media-subfolder" key={folder.id}>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  disabled={busy || !childNames?.includes(folder.name)}
                  title={childNames?.includes(folder.name) ? folder.name : tr('尚未建立或受保護')}
                  onClick={() => onChild(folder.name)}
                >
                  <Icon name="folder" size={14} />
                  {folder.name}
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
      <Gallery
        key={scope + '/' + filter + '/' + view}
        entries={shown}
        mixed
        manga={false}
        presentation={view}
        suspended={!!session}
        loading={pending}
        groupBySource={grouped}
        sourceRoot={row.path}
        onSource={(id) => {
          if (
            !busy &&
            sourceRows.some(
              (source) =>
                source.rowId === id &&
                source.record &&
                !source.readonly &&
                !source.error &&
                !source.stopped
            )
          )
            onSource(id)
        }}
        onReader={() => {}}
        save={() => {}}
        onOpen={(entry) => void open(entry)}
        onOpenFolder={(entry) =>
          void act({ action: 'open', rowId: (entry as OverviewEntry).rowId ?? row.rowId })
        }
        onEnqueue={(entry) => {
          const source = sourceRows.find(
            (source) => source.rowId === ((entry as OverviewEntry).rowId ?? row.rowId)
          )
          if (source && playback) {
            playback.add(
              {
                row: source,
                project,
                entries: visible.filter((file) => file.rowId === source.rowId),
              },
              entry
            )
            return
          }
          setAudioIds((ids) => {
            const id = mediaIdentity(entry)
            return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]
          })
        }}
        queuedIds={audioIds}
      />
      {session && (
        <MediaViewer
          row={session.source}
          project={project}
          file={session.file}
          entries={viewerFiles}
          coverEntries={sourceFiles}
          loading={pending}
          run={run}
          act={act}
          busy={busy}
          close={() => setSession(undefined)}
        />
      )}
    </div>
  )
}
