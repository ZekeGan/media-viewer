import { Badge, Button, Group } from '@mantine/core'
import { fieldValue, type Cell, type FolderRow, type Project } from '../shared/model'
import { visibleCells } from '../shared/layouts'
export function CellContent({ cell, row, open, preview = false }: { cell: Cell; row?: FolderRow; open?: () => void; preview?: boolean }) {
  if (cell.kind === 'open-folder') return <Button size="compact-sm" variant="light" style={{ color: 'inherit' }} disabled={!row || preview} onClick={e=>{e.stopPropagation();open?.()}} onDoubleClick={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>開啟資料夾</Button>
  if (cell.kind === 'image') { const asset=row?.record?.assets.find(a=>a.assetId===row.record?.details?.bannerAssetId)??row?.record?.assets[0];return asset?<img className="cell-image" src={`media://asset/${row!.rowId}/${asset.assetId}`} alt={asset.originalName}/>:<span>（沒有自訂圖片）</span> }
  const value = cell.kind === 'name' ? row?.name : cell.kind === 'path' ? row?.path : row && cell.attributeId ? fieldValue(row, cell.attributeId) : undefined
  const label = typeof value === 'string' ? value : value == null ? '' : `⚠ 型別不符：${String(value)}`
  if(cell.kind==='field-tags') return Array.isArray(value)?<Group gap={4}>{value.map((v,i)=><Badge key={i} color="gray" variant="light">{String(v)}</Badge>)}</Group>:<span>{value==null?'': '⚠ 型別不符'}</span>
  if(cell.kind==='field-number')return <span>{typeof value==='number'?value.toLocaleString():value==null?'':'⚠ 型別不符'}</span>
  if(cell.kind==='field-date')return <span>{typeof value==='string'?value.replace('T',' '):value==null?'':'⚠ 型別不符'}</span>
  return <span className={cell.kind === 'name' ? 'cell-name' : ''} title={label}>{label || (preview ? '（此筆沒有值）' : '\u00a0')}</span>
}
export function Card({ project, row, open }: { project: Project; row: FolderRow; open: () => void }) {
  return <div className="card-grid">{visibleCells(project).map(cell => <div key={cell.cellId} className="card-cell" style={{ gridColumn: `${cell.grid.x + 1} / span ${cell.grid.w}`, gridRow: `${cell.grid.y + 1} / span ${cell.grid.h}`, color: cell.style.textColor, background: cell.style.backgroundColor }}><CellContent cell={cell} row={row} open={open} /></div>)}</div>
}
