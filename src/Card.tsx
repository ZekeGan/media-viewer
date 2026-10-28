import {t as tr, useLocale, currentLocale} from './i18n'
import { Badge, Button, Group } from '@mantine/core'
import { fieldValue, type Cell, type FolderRow, type Project } from '../shared/model'
import { visibleCells } from '../shared/layouts'
import { rowCells } from '../shared/layouts'
import { useState } from 'react'
import { httpUrl } from '../shared/fields'
import { useFolderStats } from './folderStats'
import { cellColors } from './themes/cellStyle'
export function CellContent({ cell, row, open, preview = false, project }: { cell: Cell; row?: FolderRow; open?: () => void; preview?: boolean; project?:Project }) {
 useLocale()
  const stats=useFolderStats(row?.rowId),[linkError,setLinkError]=useState('')
  if(cell.kind==='static-text')return <span style={{whiteSpace:'pre-wrap'}}>{cell.text??''}</span>
  if(cell.kind==='spacer')return preview?<span className="spacer-preview" aria-label={tr('空白間距')}/>:null
  if(cell.kind==='system-info') {
    const category={manga:tr('漫畫'),album:tr('相簿'),video:tr('影片'),game:tr('遊戲'),other:tr('其他')}
    return <span title={stats?new Date(stats.updated).toLocaleString(currentLocale()):tr('開啟資料夾內容後更新')}>
      {cell.systemInfo==='files'?stats?tr('{0} 個檔案',stats.files):tr('尚未計算'):cell.systemInfo==='size'?stats?`${(stats.size/1024/1024).toLocaleString(currentLocale(),{maximumFractionDigits:2})} MB`:tr('尚未計算'):category[project?.mediaCategory as keyof typeof category]??tr('其他')}
    </span>
  }

  if (cell.kind === 'open-folder') return <Button size="compact-sm" variant="light" style={{ color: 'inherit' }} disabled={!row || preview} onClick={e=>{e.stopPropagation();open?.()}} onDoubleClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>{tr("開啟資料夾")}</Button>
  if(cell.kind==='divider')return <hr className="cell-divider"/>
  if(cell.kind==='image'){const selected=row?.record?.details?.cellImages?.[cell.attributeId??cell.cellId],asset=selected?row?.record?.assets.find(a=>a.assetId===selected):cell.attributeId?undefined:row?.record?.assets.find(a=>a.assetId===row.record?.details?.bannerAssetId)??row?.record?.assets[0];return asset?<img className="cell-image" src={`media://asset/${row!.rowId}/${asset.assetId}`} alt={asset.originalName}/>:preview?<span>{tr("選用圖片 · 可留空")}</span>:null}
  const value = cell.kind === 'name' ? row?.name : cell.kind === 'path' ? row?.path : row && cell.attributeId ? fieldValue(row, cell.attributeId) : undefined
  const label = typeof value === 'string' ? value : value == null ? '' : tr("⚠ 型別不符：{0}",String(value))
  if(cell.kind==='field-tags') return Array.isArray(value)?<Group gap={4}>{value.map((v,i)=><Badge key={i} color="gray" variant="light">{String(v)}</Badge>)}</Group>:<span>{value==null?'': tr("⚠ 型別不符")}</span>
  if(cell.kind==='field-number')return <span>{typeof value==='number'?value.toLocaleString(currentLocale()):value==null?'':tr("⚠ 型別不符")}</span>
  if(cell.kind==='field-date')return <span>{typeof value==='string'?value.replace('T',' '):value==null?'':tr("⚠ 型別不符")}</span>
  if(cell.kind==='field-boolean')return <span>{value===true?tr('是'):value===false?tr('否'):value==null?tr('未填'):tr('⚠ 型別不符')}</span>
  if(cell.kind==='field-date-only'||cell.kind==='field-enum')return <span>{typeof value==='string'?value:value==null?tr('未填'):tr('⚠ 型別不符')}</span>
  if(cell.kind==='field-url')return httpUrl(value)?<span><button className="cell-link" disabled={preview} onKeyDown={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()} onClick={async event=>{event.stopPropagation();try{await window.explorer.request({action:'openExternal',url:value});setLinkError('')}catch(reason){setLinkError(String(reason))}}}>{cell.text||value}</button>{linkError&&<small role="alert">{linkError}</small>}</span>:<span>{value==null?tr('未填'):tr('⚠ 型別不符')}</span>
  return <span className={cell.kind === 'name' ? 'cell-name' : ''} title={label}>{label || (preview ? tr("（此筆沒有值）") : '\u00a0')}</span>
}
export function Card({ project, row, open }: { project: Project; row: FolderRow; open: () => void }) {
 useLocale()

  return <div className="card-grid">{rowCells(project,row).map(cell => <div key={cell.cellId} className="card-cell" style={{ gridColumn: `${cell.grid.x + 1} / span ${cell.grid.w}`, gridRow: `${cell.grid.y + 1} / span ${cell.grid.h}`, ...cellColors(cell) }}><CellContent cell={cell} row={row} project={project} open={open} /></div>)}</div>
}
