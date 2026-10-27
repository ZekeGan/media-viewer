import { lazy, Suspense, useEffect, useState } from 'react'
import { ActionIcon, Button, Group, Menu, Tooltip } from '@mantine/core'
import { Card } from './Card'
import { Gallery } from './Gallery'
import {
  contentCells,
  type ContentResult,
  type ExplorerRequest,
  type ExplorerResponse,
} from '../shared/explorer'
import {
  fieldValue,
  type FolderRow,
  type Project,
  type Request,
  type Response,
} from '../shared/model'
const VideoViewer = lazy(() => import('./VideoViewer').then((m) => ({ default: m.VideoViewer })))
export function FolderContent({
  row,
  project,
  run,
  onChild,
  act,
  busy,
  configure,
  subtitleSettingsOpen,
  closeSubtitleSettings,
}: {
  row: FolderRow
  project: Project
  run: (r: ExplorerRequest) => Promise<ExplorerResponse | undefined>
  onChild: (name: string) => void
  act: (r: Request) => Promise<Response | undefined>
  busy: boolean
  configure: () => void
  subtitleSettingsOpen: boolean
  closeSubtitleSettings: () => void
}) {
  const [content, setContent] = useState<ContentResult>(),
    [error, setError] = useState(''),
    [reload, setReload] = useState(0),
    [, setReader] = useState(false)
  useEffect(() => {
    let alive = true
    setContent(undefined)
    setError('')
    const paged=['album','manga'].includes(project.mediaCategory)
    void (async()=>{
      let cursor:string|undefined
      do{
        const response=await window.explorer.request({action:'content',rowId:row.rowId,...(paged?{limit:cursor?256:96,cursor}:{})})
        if(!alive)return
        const chunk=response.content;if(!chunk)throw new Error('無法取得資料夾內容')
        const append=!!cursor
        setContent(previous=>append&&previous?{...chunk,entries:[...previous.entries,...chunk.entries],notices:[...previous.notices,...chunk.notices]}:chunk)
        cursor=chunk.nextCursor
        // Yield between chunks so navigation and the first screen can render.
        if(cursor)await new Promise(resolve=>setTimeout(resolve,50))
      }while(alive&&cursor)
    })().catch(e=>{if(alive)setError(String(e))})
    return () => {
      alive = false
    }
  }, [row.rowId, row.path, project.mediaCategory, reload])
  if (error&&!content)
    return (
      <p role="alert" className="media-content-error">
        {error}
      </p>
    )
  if (!content) return <p className="media-loading">載入內容…</p>
  if (project.mediaCategory === 'video')
    return (
      <Suspense fallback={<p>載入播放器…</p>}>
        <VideoViewer key={row.rowId} row={row} entries={content.entries} run={run} autoplay={project.videoAutoplay!==false} settingsOpened={subtitleSettingsOpen} closeSettings={closeSubtitleSettings} />
      </Suspense>
    )
  const cover =
      row.record?.assets.find((a) => a.assetId === row.record?.details?.bannerAssetId) ??
      row.record?.assets[0],
    first = content.entries.find((e) => e.kind === 'image')
  if (project.mediaCategory === 'game') {
    const disabled = busy || !row.record || row.readonly || row.stopped || !!row.error
    const fields = [
      ...new Map(
        [
          ...project.fieldBindings.map((f) => ({ attributeId: f.attributeId, key: f.alias })),
          ...(row.record?.attributes ?? []),
          ...(row.record?.projectOverrides[row.projectId] ?? []),
        ].map((a) => [a.attributeId, a])
      ).values(),
    ]
    return (
      <div className="game-content">
        <div className="game-banner">
          {cover ? (
            <img src={`media://asset/${row.rowId}/${cover.assetId}`} alt={cover.originalName} />
          ) : (
            <span>沒有遊戲封面</span>
          )}
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon
                className="cover-change"
                aria-label="更換遊戲封面"
                disabled={disabled}
                variant="default"
              >
                ✎
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {row.record?.assets.map((a) => (
                <Menu.Item
                  key={a.assetId}
                  onClick={() =>
                    void run({
                      action: 'banner',
                      rowId: row.rowId,
                      revision: row.record!.revision,
                      assetId: a.assetId,
                    })
                  }
                >
                  {a.originalName}
                </Menu.Item>
              ))}
              <Menu.Item
                onClick={async () => {
                  const result = await act({
                      action: 'image',
                      rowId: row.rowId,
                      revision: row.record!.revision,
                    }),
                    next =
                      result && !result.cancelled
                        ? result.snapshot.structure?.find((r) => r.rowId === row.rowId)?.record
                        : undefined,
                    asset = next?.assets.at(-1)
                  if (next && asset)
                    await run({
                      action: 'banner',
                      rowId: row.rowId,
                      revision: next.revision,
                      assetId: asset.assetId,
                    })
                }}
              >
                匯入封面圖片
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <Group className="game-actions" gap="sm">
          {project.actionTemplates?.map((t) => (
            <Button
              key={t.id}
              color={t.color}
              disabled={busy || !row.record?.details?.targets?.[t.id]}
              title={row.record?.details?.targets?.[t.id]?.path ?? '尚未綁定'}
              onClick={() => {
                if (t.kind === 'exe' && !window.confirm(`啟動「${t.label}」？`)) return
                void run({ action: 'runTarget', rowId: row.rowId, templateId: t.id })
              }}
            >
              {t.label}
            </Button>
          ))}
          {!project.actionTemplates?.length && <small className="muted">尚未設定操作按鈕</small>}
          <Tooltip label="自訂操作與目標">
            <ActionIcon aria-label="自訂遊戲操作" variant="subtle" onClick={configure}>
              ⚙
            </ActionIcon>
          </Tooltip>
        </Group>
        <table className="attribute-table game-fields">
          <thead>
            <tr>
              <th>欄位</th>
              <th>內容</th>
              <th>來源</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>資料夾名稱</td>
              <td>{row.name}</td>
              <td>檔案系統</td>
            </tr>
            <tr>
              <td>目前路徑</td>
              <td>{row.path}</td>
              <td>檔案系統</td>
            </tr>
            {fields.map((f) => {
              const value = fieldValue(row, f.attributeId),
                attribute =
                  row.record?.projectOverrides[row.projectId]?.find(
                    (a) => a.attributeId === f.attributeId
                  ) ?? row.record?.attributes.find((a) => a.attributeId === f.attributeId)
              return (
                <tr key={f.attributeId}>
                  <td>
                    {project.fieldBindings.find((b) => b.attributeId === f.attributeId)?.alias ??
                      f.key}
                  </td>
                  <td>
                    {value == null
                      ? '—'
                      : Array.isArray(value)
                        ? value.join(', ')
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                  </td>
                  <td>{attribute?.source ?? '未設定'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
  return (
    <div className="media-content">
      {error&&<p role="alert" className="media-content-error">部分內容讀取未完成，已載入的圖片仍可查看。{error}<Button size="compact-xs" variant="subtle" onClick={()=>setReload(value=>value+1)}>重新載入</Button></p>}
      <div className="media-info-template">
        {project.mediaCategory === 'manga' && first && (
          <img
            className="manga-cover"
            src={first.thumb ?? first.url}
            onError={(e) => {
              if (e.currentTarget.src !== first.url) e.currentTarget.src = first.url
              else e.currentTarget.style.display = 'none'
            }}
            alt={first.name}
          />
        )}
        <Card
          project={{ ...project, cells: contentCells(project, project.mediaCategory) }}
          row={row}
          open={() => {
            void window.media.request({ action: 'open', rowId: row.rowId })
          }}
        />
      </div>
      {['manga', 'album'].includes(project.mediaCategory) ? (
        <Gallery
          entries={content.entries}
          loading={!!content.nextCursor&&!error}
          manga={project.mediaCategory === 'manga'}
          prefs={row.record?.details?.reading}
          onReader={setReader}
          save={(prefs) => {
            if (row.record && !row.readonly && !row.stopped && !row.error)
              void run({
                action: 'reading',
                rowId: row.rowId,
                revision: row.record.revision,
                prefs,
              })
          }}
        />
      ) : null}
      {content.entries.some((e) => e.kind === 'folder') && (
        <div className="content-subfolders">
          {content.entries
            .filter((e) => e.kind === 'folder')
            .map((e) => (
              <Button key={e.id} variant="subtle" onClick={() => onChild(e.name)}>
                ▱ {e.name}
              </Button>
            ))}
        </div>
      )}
    </div>
  )
}
