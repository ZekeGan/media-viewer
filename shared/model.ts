import type { ActionTemplate, FolderDetails } from './explorer'
import { imageTypes } from './images'
export const DATA_DIR = '.media-viewer'
export type CellKind = 'name' | 'path' | 'field-text' | 'field-tags' | 'field-number' | 'field-date' | 'image' | 'divider' | 'open-folder'
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
  details?: FolderDetails
}
export interface Project {
  legacySourceId?: string
  kind: 'media-viewer.project'; schemaVersion: 1; projectId: string; rootFolderId: string; revision: number
  name: string; mediaCategory: string; depth: { mode: 'through' | 'exact'; level: number }
  fieldBindings: { alias: string; attributeId: string; type: string }[]
  cells: Cell[]; list: { itemsPerRow: number; pageSize: number }; excludedRelativePaths: string[]
  contentCells?: Record<string, Cell[]>; actionTemplates?: ActionTemplate[]
  layoutPresets?: { id:string; name:string; cells:Cell[] }[]; activeLayoutId?:string
  scanAll?: boolean
  videoAutoplay?: boolean
  cardView?: { mode:'multi'|'single'; level:number|'all' }
  traversal?: Record<string, boolean>; savedSearches?: { id: string; name: string; query: string }[]
}
export interface LinkedProject { projectId: string; root: string; project?: Project; error?: string }
export interface FolderRow { rowId: string; path: string; name: string; depth: number; projectId: string; record?: FolderRecord; error?: string; stopped: boolean; duplicate: boolean; structural?: boolean; readonly?: boolean; boundary?: { engines: string[]; evidence: string[]; state: string } }
export interface ScanProgress { visited: number; created: number; errors: number; active: boolean; cancelled: boolean }
export interface Snapshot { projects: LinkedProject[]; rows: FolderRow[]; problems: string[]; structure?: FolderRow[]; progress: ScanProgress; legacyAvailable: boolean }
export interface CleanupPreview { token: string; paths: string[]; skipped: string[]; count: number; scope: 'folder' | 'private' | 'all' }
export interface CleanupResult { removed: number; failed: string[]; skipped: string[] }
export interface ProjectRemovalPreview { token:string; projectId:string; name:string; paths:string[]; skipped:string[]; privateCount:number; rootCleanup?:boolean; recoveryPath?:string }
export interface ProjectInput { name: string; mediaCategory: string; depth: Project['depth']; scanAll?:boolean }
export interface LegacyPreview { token: string; projects: { id: string; name: string; root: string; values: number }[]; warnings: string[] }
export type Request =
  | { action: 'snapshot' | 'scan' | 'cancelScan' | 'link' | 'cleanupAllPreview' | 'legacyPreview' | 'chooseRoot' }
  | { action: 'create'; input: ProjectInput; rootToken?:string }
  | { action: 'saveProject'; project: Project }
  | { action: 'unlink'; projectId: string }
  | { action: 'removeProjectPreview'; projectId:string }
  | { action: 'removeProject'; token:string }
  | { action: 'restoreProject'; projectId: string }
  | { action: 'saveFolder'; rowId: string; revision: number; values: Record<string, string> }
  | { action: 'image'; rowId: string; revision: number; cellId?:string }
  | { action: 'open' | 'restore' | 'copyIdentity' | 'resume'; rowId: string }
  | { action: 'cleanupPreview'; rowId: string; scope: 'folder' | 'private' }
  | { action: 'cleanup'; token: string; restart: boolean }
  | { action: 'legacyImport'; token: string; ids: string[]; depth: Project['depth'] }
export interface Response { snapshot: Snapshot; preview?: CleanupPreview; cleanup?: CleanupResult; removalPreview?:ProjectRemovalPreview; removal?:CleanupResult; legacy?: LegacyPreview; message?: string; cancelled?: boolean; rootSelection?:{token:string;path:string} }
export interface MediaApi { request(request: Request): Promise<Response>; onProgress(callback: (progress: ScanProgress) => void): () => void }

const obj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)
const id = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v) && !['__proto__','constructor','prototype'].includes(v)
const integer = (v: unknown, min: number, max: number) => Number.isInteger(v) && Number(v) >= min && Number(v) <= max
const text = (v: unknown, max = 10000): v is string => typeof v === 'string' && v.length <= max
const relative = (v: unknown): v is string => text(v) && !v.startsWith('/') && !v.includes('\\') && !v.includes(':') && !v.split('/').includes('..')
const attribute = (a: unknown): a is Attribute => obj(a) && id(a.attributeId) && text(a.key, 100) && text(a.type, 40) && text(a.source, 100) && 'value' in a
export function validateFolder(v: unknown): asserts v is FolderRecord {
  if (!obj(v) || v.kind !== 'media-viewer.folder' || v.schemaVersion !== 1 || !id(v.folderId) || !integer(v.revision, 1, Number.MAX_SAFE_INTEGER) || !Array.isArray(v.attributes) || !v.attributes.every(attribute) || new Set(v.attributes.map(a => a.attributeId)).size !== v.attributes.length || !obj(v.projectOverrides) || !Object.entries(v.projectOverrides).every(([k, a]) => id(k) && Array.isArray(a) && a.every(attribute)) || !Array.isArray(v.assets) || !v.assets.every(a => obj(a) && id(a.assetId) && relative(a.relativePath) && /^assets\/[a-zA-Z0-9_-]+\.(png|jpg|webp|gif|bmp|avif|ico)$/.test(a.relativePath) && text(a.originalName, 255) && Object.values(imageTypes).includes(a.mediaType))) throw new Error('記錄損壞、版本不支援或不屬於本程式；原檔保留')
  if (v.details !== undefined) validateDetails(v.details)
}
export function validateDetails(v: unknown): asserts v is FolderDetails {
  if (!obj(v) || v.schemaVersion !== 1 || JSON.stringify(v).length > 2000000) throw new Error('內容設定不合法')
  if (v.boundary && (!obj(v.boundary) || !['root','not-game','candidate'].includes(v.boundary.state) || !Array.isArray(v.boundary.engines) || !v.boundary.engines.every((x: unknown) => text(x,100)) || !Array.isArray(v.boundary.evidence) || !v.boundary.evidence.every((x: unknown) => text(x,500)))) throw new Error('遊戲邊界設定不合法')
  if (v.bannerAssetId !== undefined && !id(v.bannerAssetId)) throw new Error('封面身分不合法')
  if(v.cellImages!==undefined&&(!obj(v.cellImages)||Object.keys(v.cellImages).length>1000||!Object.entries(v.cellImages).every(([slot,asset])=>id(slot)&&id(asset))))throw new Error('圖片組件設定不合法')
  if (v.reading && (!obj(v.reading) || (v.reading.page !== undefined && !integer(v.reading.page,0,1000000)) || (v.reading.fit !== undefined && !['width','height','original'].includes(v.reading.fit)) || ['spread','rtl','firstSingle'].some(k => v.reading[k] !== undefined && typeof v.reading[k] !== 'boolean'))) throw new Error('閱讀設定不合法')
  if (v.targets && (!obj(v.targets) || !Object.entries(v.targets).every(([k,t]) => id(k) && obj(t) && ['exe','folder'].includes(t.kind) && text(t.path,10000) && typeof t.relative === 'boolean' && (!t.relative || relative(t.path)) && Array.isArray(t.args) && t.args.length <= 100 && t.args.every((a: unknown) => text(a,10000) && !String(a).includes('\0'))))) throw new Error('任務設定不合法')
  if (v.subtitles && (!Array.isArray(v.subtitles) || !v.subtitles.every(s => obj(s) && id(s.id) && text(s.name,255) && relative(s.relativePath) && /^subtitles\/[\w-]+\.(srt|vtt)$/.test(s.relativePath)))) throw new Error('字幕記錄不合法')
  if (v.playback && (!obj(v.playback) || Object.keys(v.playback).length > 10000 || !Object.entries(v.playback).every(([k,p]) => id(k) && obj(p) && typeof p.time === 'number' && Number.isFinite(p.time) && p.time >= 0 && p.time < 1e9 && (!p.subtitle || text(p.subtitle,200)) && (!p.settings || obj(p.settings) && Object.values(p.settings).every(s => obj(s) && typeof s.offset === 'number' && Number.isFinite(s.offset) && Math.abs(s.offset) <= 86400 && integer(s.size,10,80) && typeof s.bottom === 'number' && s.bottom >= 0 && s.bottom <= 80 && /^#[0-9a-f]{6}$/i.test(s.color) && /^#[0-9a-f]{6}$/i.test(s.background) && ['utf-8','big5','shift_jis'].includes(s.encoding)))))) throw new Error('播放設定不合法')
}
export function validateProject(v: unknown): asserts v is Project {
  if(obj(v)&&v.videoAutoplay!==undefined&&typeof v.videoAutoplay!=='boolean')throw new Error('影片自動播放設定不合法')
  if(obj(v)&&(v.scanAll!==undefined&&typeof v.scanAll!=='boolean'||v.cardView!==undefined&&(!obj(v.cardView)||!['multi','single'].includes(v.cardView.mode)||!(integer(v.cardView.level,1,Number.MAX_SAFE_INTEGER)||v.cardView.mode==='multi'&&v.cardView.level==='all'))))throw new Error('CARD 顯示範圍不合法')
  if (!obj(v) || v.kind !== 'media-viewer.project' || v.schemaVersion !== 1 || !id(v.projectId) || !id(v.rootFolderId) || !integer(v.revision, 1, Number.MAX_SAFE_INTEGER) || !text(v.name, 100) || !v.name.trim() || !text(v.mediaCategory, 40) || !obj(v.depth) || !['through', 'exact'].includes(v.depth.mode) || !integer(v.depth.level, 1, 50) || !obj(v.list) || !integer(v.list.itemsPerRow, 1, 6) || !integer(v.list.pageSize, 1, 500) || !Array.isArray(v.excludedRelativePaths) || !v.excludedRelativePaths.every(relative) || !Array.isArray(v.fieldBindings) || !v.fieldBindings.every(f => obj(f) && text(f.alias, 100) && id(f.attributeId) && text(f.type, 40)) || !Array.isArray(v.cells) || v.cells.length > 50 || !v.cells.every(c => obj(c) && id(c.cellId) && ['name', 'path', 'field-text', 'field-tags', 'field-number', 'field-date', 'image', 'divider', 'open-folder'].includes(c.kind) && (!c.kind.startsWith('field-') || id(c.attributeId)) && (c.kind!=='image'||c.attributeId===undefined||id(c.attributeId)) && obj(c.grid) && integer(c.grid.x, 0, 11) && integer(c.grid.y, 0, 99) && integer(c.grid.w, 1, 12) && integer(c.grid.h, 1, 100) && c.grid.x + c.grid.w <= 12 && c.grid.y + c.grid.h <= 100 && obj(c.style) && /^#[0-9a-f]{6}$/i.test(c.style.textColor) && (c.style.backgroundColor==='transparent'||/^#[0-9a-f]{6}$/i.test(c.style.backgroundColor)))) throw new Error('專案設定不合法或版本不支援')
  if (new Set(v.cells.map(c => c.cellId)).size !== v.cells.length || new Set(v.fieldBindings.map(f => f.alias.toLowerCase())).size !== v.fieldBindings.length) throw new Error('組件 ID 或欄位別名重複')
  if (v.layoutPresets !== undefined) {
    if (!Array.isArray(v.layoutPresets)||!v.layoutPresets.length||v.layoutPresets.length>30||new Set(v.layoutPresets.map(p=>p.id)).size!==v.layoutPresets.length||new Set(v.layoutPresets.map(p=>typeof p.name==='string'?p.name.toLocaleLowerCase():p.name)).size!==v.layoutPresets.length||!v.layoutPresets.every(p=>obj(p)&&id(p.id)&&text(p.name,100)&&p.name.trim()))throw new Error('版面方案不合法或名稱重複')
    if(!id(v.activeLayoutId)||!v.layoutPresets.some(p=>p.id===v.activeLayoutId))throw new Error('作用中方案不存在')
    for(const preset of v.layoutPresets)validateProject({...v,cells:preset.cells,layoutPresets:undefined,activeLayoutId:undefined,contentCells:undefined})
  } else if(v.activeLayoutId!==undefined)throw new Error('方案清單不存在')
  if (v.contentCells !== undefined) { if (!obj(v.contentCells) || !Object.keys(v.contentCells).every(k => ['manga','album','game','video','other'].includes(k))) throw new Error('內容模板不合法'); for (const cells of Object.values(v.contentCells)) validateProject({ ...v, cells, contentCells: undefined }) }
  if (v.traversal !== undefined && (!obj(v.traversal) || !Object.entries(v.traversal).every(([k,b]) => id(k) && typeof b === 'boolean'))) throw new Error('遍歷偏好不合法')
  if (v.actionTemplates !== undefined && (!Array.isArray(v.actionTemplates) || v.actionTemplates.length > 30 || new Set(v.actionTemplates.map(t => t.id)).size !== v.actionTemplates.length || !v.actionTemplates.every(t => obj(t) && id(t.id) && text(t.label,100) && ['exe','folder'].includes(t.kind) && /^#[0-9a-f]{6}$/i.test(t.color)))) throw new Error('任務版型不合法')
  if (v.savedSearches !== undefined && (!Array.isArray(v.savedSearches) || v.savedSearches.length > 100 || !v.savedSearches.every(s => obj(s) && id(s.id) && text(s.name,100) && text(s.query,2000)))) throw new Error('常用搜尋不合法')
  for (let i = 0; i < v.cells.length; i++) for (let j = i + 1; j < v.cells.length; j++) {
    const a = v.cells[i].grid, b = v.cells[j].grid
    if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) throw new Error('組件不能重疊')
  }
}
export function defaultCells(makeId: () => string, attributeId?: string): Cell[] {
  return (['name', 'path', ...(attributeId?['field-text' as const]:[]), 'open-folder'] as const).map((kind, y) => ({ cellId: makeId(), kind, ...(kind === 'field-text' ? { attributeId } : {}), grid: { x: 0, y, w: 12, h: 1 }, style: { textColor: '#e4e6e8', backgroundColor: 'transparent' } }))
}
export function fieldValue(row: FolderRow, attributeId: string): unknown {
  const override = row.record?.projectOverrides[row.projectId]?.find(a => a.attributeId === attributeId)
  return (override ?? row.record?.attributes.find(a => a.attributeId === attributeId))?.value
}
