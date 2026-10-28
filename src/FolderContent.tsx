import {DocumentViewer} from './DocumentViewer'
import {cacheFolderStats} from './folderStats'
import {t as tr, useLocale} from './i18n'
import { Icon } from './icons'
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
const Reader = lazy(() => import('./Reader').then(module=>({default:module.Reader})))
const VideoViewer = lazy(() => import('./VideoViewer').then((m) => ({ default: m.VideoViewer })))
export function FolderContent({
  row,
  project,
  run,
  onChild,
  act,
  busy,
  configure,
  selectedFileId,selectedEntry,
}: {
  row: FolderRow
  project: Project
  run: (r: ExplorerRequest) => Promise<ExplorerResponse | undefined>
  onChild: (name: string) => void
  act: (r: Request) => Promise<Response | undefined>
  busy: boolean
  configure: () => void
  selectedFileId?:string
  selectedEntry?:ContentResult['entries'][number]
}) {
 useLocale()

  const [content, setContent] = useState<ContentResult>(),
    [error, setError] = useState(''),
    [reload, setReload] = useState(0),
    [, setReader] = useState(false),[fileReader,setFileReader]=useState(false),[documentFile,setDocumentFile]=useState<ContentResult['entries'][number]>()
  useEffect(() => {
    let alive = true
    setContent(undefined)
    setError('')
    const paged=['album','manga'].includes(project.mediaCategory)
    void (async()=>{
      let cursor:string|undefined
      const counted:ContentResult['entries']=[]
      do{
        const response=await window.explorer.request({action:'content',rowId:row.rowId,...(paged?{limit:cursor?256:96,cursor}:{})})
        if(!alive)return
        const chunk=response.content;if(!chunk)throw new Error(tr("無法取得資料夾內容"))
        const append=!!cursor
        setContent(previous=>append&&previous?{...chunk,entries:[...previous.entries,...chunk.entries],notices:[...previous.notices,...chunk.notices]}:chunk)
        counted.push(...chunk.entries)
        cursor=chunk.nextCursor
        if(!cursor)cacheFolderStats(row.rowId,counted)
        // Yield between chunks so navigation and the first screen can render.
        if(cursor)await new Promise(resolve=>setTimeout(resolve,50))
      }while(alive&&cursor)
    })().catch(e=>{if(alive)setError(String(e))})
    return () => {
      alive = false
    }
  }, [row.rowId, row.path, project.mediaCategory, reload])
  useEffect(()=>{setFileReader(false);setDocumentFile(undefined)},[row.rowId,selectedFileId])
  if (error&&!content)
    return (
      <p role="alert" className="media-content-error">
        {error}
      </p>
    )
  if (!content) return <p className="media-loading">{tr("載入內容…")}</p>
  const selectedFile=content.entries.find(entry=>entry.id===selectedFileId)??selectedEntry
  if(selectedFile&&selectedFile.kind!=='video')return <div className="single-file-preview">
    <h3>{selectedFile.name}</h3><small className="path">{row.path}</small>
    {documentFile&&<DocumentViewer rowId={row.rowId} file={documentFile} close={()=>setDocumentFile(undefined)}/>}
    {['pdf','archive'].includes(selectedFile.kind)&&<Button onClick={()=>setDocumentFile(selectedFile)}>{tr('開啟檢視器')}</Button>}
    {selectedFile.kind==='image'?<><img className="single-file-image" src={selectedFile.url} alt={selectedFile.name}/><Button variant="light" onClick={()=>setFileReader(true)}>{tr('開啟閱讀器')}</Button>{fileReader&&<Suspense fallback={<p>{tr('載入內容…')}</p>}><Reader images={content.entries.filter(entry=>entry.kind==='image')} start={content.entries.filter(entry=>entry.kind==='image').findIndex(entry=>entry.id===selectedFile.id)} manga={project.mediaCategory==='manga'} prefs={row.record?.details?.reading} close={()=>setFileReader(false)} save={prefs=>void run({action:'reading',rowId:row.rowId,revision:row.record!.revision,prefs})}/></Suspense>}</>:<p>{selectedFile.mime} · {selectedFile.size.toLocaleString()} B</p>}
    <Button variant="default" onClick={()=>void act({action:'open',rowId:row.rowId})}>{tr('開啟所在資料夾')}</Button>
  </div>
  if (project.mediaCategory === 'video'||selectedFile?.kind==='video')
    return (
      <Suspense fallback={<p>{tr("載入播放器…")}</p>}>
        <VideoViewer initialFileId={selectedFile?.id} key={row.rowId} row={row} entries={content.entries} run={run} busy={busy} autoplay={project.videoAutoplay!==false} autoNext={project.videoAutoNext===true} changeAutoplay={async value=>!!await act({action:'saveProject',project:{...project,videoAutoplay:value}})} changeAutoNext={async value=>!!await act({action:'saveProject',project:{...project,videoAutoNext:value}})} />
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
            <span>{tr("沒有遊戲封面")}</span>
          )}
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon
                className="cover-change"
                aria-label={tr("更換遊戲封面")}
                disabled={disabled}
                variant="default"
              ><Icon name="edit"/></ActionIcon>
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
                {tr("匯入封面圖片")}</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <Group className="game-actions" gap="sm">
          {project.actionTemplates?.map((t) => (
            <Button
              key={t.id}
              color={t.color}
              disabled={busy || !row.record?.details?.targets?.[t.id]}
              title={row.record?.details?.targets?.[t.id]?.path ?? tr("尚未綁定")}
              onClick={() => {
                if (t.kind === 'exe' && !window.confirm(tr("啟動「{0}」？",t.label))) return
                void run({ action: 'runTarget', rowId: row.rowId, templateId: t.id })
              }}
            >
              {t.label}
            </Button>
          ))}
          {!project.actionTemplates?.length && <small className="muted">{tr("尚未設定操作按鈕")}</small>}
          <Tooltip label={tr("自訂操作與目標")}>
            <ActionIcon aria-label={tr("自訂遊戲操作")} variant="subtle" onClick={configure}><Icon name="sliders"/></ActionIcon>
          </Tooltip>
        </Group>
        <table className="attribute-table game-fields">
          <thead>
            <tr>
              <th>{tr("欄位")}</th>
              <th>{tr("內容")}</th>
              <th>{tr("來源")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{tr("資料夾名稱")}</td>
              <td>{row.name}</td>
              <td>{tr("檔案系統")}</td>
            </tr>
            <tr>
              <td>{tr("目前路徑")}</td>
              <td>{row.path}</td>
              <td>{tr("檔案系統")}</td>
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
                  <td>{attribute?.source ?? tr("未設定")}</td>
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
      {documentFile&&<DocumentViewer rowId={row.rowId} file={documentFile} close={()=>setDocumentFile(undefined)}/>}
      <Group gap="xs">{content.entries.filter(entry=>['archive','pdf'].includes(entry.kind)).map(entry=><Button key={entry.id} variant="light" onClick={()=>setDocumentFile(entry)}><Icon name="file"/>{entry.name}</Button>)}</Group>
      {error&&<p role="alert" className="media-content-error">{tr("部分內容讀取未完成，已載入的圖片仍可查看。")}{error}<Button size="compact-xs" variant="subtle" onClick={()=>setReload(value=>value+1)}>{tr("重新載入")}</Button></p>}
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
          project={{ ...project, folderLayouts: undefined, cells: contentCells(project, project.mediaCategory) }}
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
                <Icon name="folder" size={15}/> {e.name}
              </Button>
            ))}
        </div>
      )}
    </div>
  )
}
