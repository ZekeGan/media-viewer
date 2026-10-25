import type { FolderRow } from './model'

const collator = new Intl.Collator('zh-Hant', { numeric: true })
export function sortRows(rows: FolderRow[]) {
  return [...rows].sort((a, b) => collator.compare(a.name, b.name)
    || collator.compare(a.record?.folderId ?? a.rowId, b.record?.folderId ?? b.rowId)
    || collator.compare(a.rowId, b.rowId))
}
export function filterRows(sortedRows: FolderRow[], query: string) {
  const q = query.toLocaleLowerCase()
  return q ? sortedRows.filter(r => r.name.toLocaleLowerCase().includes(q) || r.path.toLocaleLowerCase().includes(q)) : sortedRows
}
