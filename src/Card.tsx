import { Button } from '@mantine/core'
import { fieldValue, type Cell, type FolderRow, type Project } from '../shared/model'
export function CellContent({ cell, row, open, preview = false }: { cell: Cell; row?: FolderRow; open?: () => void; preview?: boolean }) {
  if (cell.kind === 'open-folder') return <Button size="compact-sm" variant="light" disabled={!row || preview} onClick={open}>開啟資料夾</Button>
  const value = cell.kind === 'name' ? row?.name : cell.kind === 'path' ? row?.path : row && cell.attributeId ? fieldValue(row, cell.attributeId) : undefined
  const label = typeof value === 'string' ? value : value == null ? '' : `⚠ 型別不符：${String(value)}`
  return <span className={cell.kind === 'name' ? 'cell-name' : ''} title={label}>{label || (preview ? '（此筆沒有值）' : '\u00a0')}</span>
}
export function Card({ project, row, open }: { project: Project; row: FolderRow; open: () => void }) {
  return <div className="card-grid">{project.cells.map(cell => <div key={cell.cellId} className="card-cell" style={{ gridColumn: `${cell.grid.x + 1} / span ${cell.grid.w}`, gridRow: `${cell.grid.y + 1} / span ${cell.grid.h}`, color: cell.style.textColor, background: cell.style.backgroundColor }}><CellContent cell={cell} row={row} open={open} /></div>)}</div>
}
