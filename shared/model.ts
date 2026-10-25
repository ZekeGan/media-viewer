export const DATA_DIR = '.media-viewer'
export type CellKind = 'name' | 'path' | 'field-text' | 'open-folder'
export interface Cell {
  cellId: string; kind: CellKind; attributeId?: string
  grid: { x: number; y: number; w: number; h: number }
  style: { textColor: string; backgroundColor: string }
}
export interface Attribute { attributeId: string; key: string; type: string; value: unknown; source: string }
export interface Asset { assetId: string; relativePath: string; originalName: string; mediaType: string }
export interface FolderRecord {
  kind: 'media-viewer.folder'; schemaVersion: 1; folderId: string; revision: number
  attributes: Attribute[]; projectOverrides: Record<string, Attribute[]>; assets: Asset[]
}
export interface Project {
  legacySourceId?: string
  kind: 'media-viewer.project'; schemaVersion: 1; projectId: string; rootFolderId: string; revision: number
  name: string; mediaCategory: string; depth: { mode: 'through' | 'exact'; level: number }
  fieldBindings: { alias: string; attributeId: string; type: string }[]
  cells: Cell[]; list: { itemsPerRow: number; pageSize: number }; excludedRelativePaths: string[]
}
export interface LinkedProject { projectId: string; root: string; project?: Project; error?: string }
export interface FolderRow { rowId: string; path: string; name: string; depth: number; projectId: string; record?: FolderRecord; error?: string; stopped: boolean; duplicate: boolean }
export interface ScanProgress { visited: number; created: number; errors: number; active: boolean; cancelled: boolean }
export interface Snapshot { projects: LinkedProject[]; rows: FolderRow[]; problems: string[]; progress: ScanProgress; legacyAvailable: boolean }
export interface CleanupPreview { token: string; paths: string[]; skipped: string[]; count: number; scope: 'folder' | 'private' | 'all' }
export interface CleanupResult { removed: number; failed: string[]; skipped: string[] }
export interface ProjectInput { name: string; mediaCategory: string; depth: Project['depth'] }
export interface LegacyPreview { token: string; projects: { id: string; name: string; root: string; values: number }[]; warnings: string[] }
export type Request =
  | { action: 'snapshot' | 'scan' | 'cancelScan' | 'link' | 'cleanupAllPreview' | 'legacyPreview' }
  | { action: 'create'; input: ProjectInput }
  | { action: 'saveProject'; project: Project }
  | { action: 'unlink'; projectId: string }
  | { action: 'restoreProject'; projectId: string }
  | { action: 'saveFolder'; rowId: string; revision: number; values: Record<string, string> }
  | { action: 'image'; rowId: string; revision: number }
  | { action: 'open' | 'restore' | 'copyIdentity' | 'resume'; rowId: string }
  | { action: 'cleanupPreview'; rowId: string; scope: 'folder' | 'private' }
  | { action: 'cleanup'; token: string; restart: boolean }
  | { action: 'legacyImport'; token: string; ids: string[]; depth: Project['depth'] }
export interface Response { snapshot: Snapshot; preview?: CleanupPreview; cleanup?: CleanupResult; legacy?: LegacyPreview; message?: string }
export interface MediaApi { request(request: Request): Promise<Response>; onProgress(callback: (progress: ScanProgress) => void): () => void }

const obj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)
const id = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v)
const integer = (v: unknown, min: number, max: number) => Number.isInteger(v) && Number(v) >= min && Number(v) <= max
const text = (v: unknown, max = 10000): v is string => typeof v === 'string' && v.length <= max
const relative = (v: unknown): v is string => text(v) && !v.startsWith('/') && !v.includes('\\') && !v.includes(':') && !v.split('/').includes('..')
const attribute = (a: unknown): a is Attribute => obj(a) && id(a.attributeId) && text(a.key, 100) && text(a.type, 40) && text(a.source, 100) && 'value' in a
export function validateFolder(v: unknown): asserts v is FolderRecord {
  if (!obj(v) || v.kind !== 'media-viewer.folder' || v.schemaVersion !== 1 || !id(v.folderId) || !integer(v.revision, 1, Number.MAX_SAFE_INTEGER) || !Array.isArray(v.attributes) || !v.attributes.every(attribute) || new Set(v.attributes.map(a => a.attributeId)).size !== v.attributes.length || !obj(v.projectOverrides) || !Object.entries(v.projectOverrides).every(([k, a]) => id(k) && Array.isArray(a) && a.every(attribute)) || !Array.isArray(v.assets) || !v.assets.every(a => obj(a) && id(a.assetId) && relative(a.relativePath) && /^assets\/[a-zA-Z0-9_-]+\.(png|jpg|webp|gif)$/.test(a.relativePath) && text(a.originalName, 255) && ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(a.mediaType))) throw new Error('記錄損壞、版本不支援或不屬於本程式；原檔保留')
}
export function validateProject(v: unknown): asserts v is Project {
  if (!obj(v) || v.kind !== 'media-viewer.project' || v.schemaVersion !== 1 || !id(v.projectId) || !id(v.rootFolderId) || !integer(v.revision, 1, Number.MAX_SAFE_INTEGER) || !text(v.name, 100) || !v.name.trim() || !text(v.mediaCategory, 40) || !obj(v.depth) || !['through', 'exact'].includes(v.depth.mode) || !integer(v.depth.level, 1, 50) || !obj(v.list) || !integer(v.list.itemsPerRow, 1, 6) || !integer(v.list.pageSize, 1, 500) || !Array.isArray(v.excludedRelativePaths) || !v.excludedRelativePaths.every(relative) || !Array.isArray(v.fieldBindings) || !v.fieldBindings.every(f => obj(f) && text(f.alias, 100) && id(f.attributeId) && text(f.type, 40)) || !Array.isArray(v.cells) || v.cells.length > 50 || !v.cells.every(c => obj(c) && id(c.cellId) && ['name', 'path', 'field-text', 'open-folder'].includes(c.kind) && (c.kind !== 'field-text' || id(c.attributeId)) && obj(c.grid) && integer(c.grid.x, 0, 11) && integer(c.grid.y, 0, 99) && integer(c.grid.w, 1, 12) && integer(c.grid.h, 1, 100) && c.grid.x + c.grid.w <= 12 && c.grid.y + c.grid.h <= 100 && obj(c.style) && /^#[0-9a-f]{6}$/i.test(c.style.textColor) && /^#[0-9a-f]{6}$/i.test(c.style.backgroundColor))) throw new Error('專案設定不合法或版本不支援')
  if (new Set(v.cells.map(c => c.cellId)).size !== v.cells.length || new Set(v.fieldBindings.map(f => f.alias.toLowerCase())).size !== v.fieldBindings.length) throw new Error('組件 ID 或欄位別名重複')
  for (let i = 0; i < v.cells.length; i++) for (let j = i + 1; j < v.cells.length; j++) {
    const a = v.cells[i].grid, b = v.cells[j].grid
    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) throw new Error('組件不能重疊')
  }
}
export function defaultCells(makeId: () => string, attributeId: string): Cell[] {
  return (['name', 'path', 'field-text', 'open-folder'] as const).map((kind, y) => ({ cellId: makeId(), kind, ...(kind === 'field-text' ? { attributeId } : {}), grid: { x: 0, y, w: 12, h: 1 }, style: { textColor: '#243247', backgroundColor: '#ffffff' } }))
}
export function fieldValue(row: FolderRow, attributeId: string): unknown {
  const override = row.record?.projectOverrides[row.projectId]?.find(a => a.attributeId === attributeId)
  return (override ?? row.record?.attributes.find(a => a.attributeId === attributeId))?.value
}
