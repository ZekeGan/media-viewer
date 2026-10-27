import { visibleCells } from './layouts'
import type { Attribute, Cell, Snapshot } from './model'
export type BrowseMode = 'CARD' | 'TREE' | 'TABLE'
export interface BrowseState { mode: BrowseMode; location: string; locations?:Partial<Record<BrowseMode,string>>; widths: Record<string, number>; panelWidth: number; panelVisible?:boolean; detailId?:string; scroll?: number; scrolls?: Partial<Record<BrowseMode,number>>; viewport?: { x: number; y: number; zoom: number } }
export interface GameBoundary { state: 'root' | 'not-game' | 'candidate'; engines: string[]; evidence: string[] }
export interface ReadingPrefs { page?: number; fit?: 'height' | 'width' | 'original'; spread?: boolean; rtl?: boolean; firstSingle?: boolean }
export interface SubtitlePrefs { offset: number; size: number; bottom: number; color: string; background: string; encoding: 'utf-8' | 'big5' | 'shift_jis' }
export interface FolderDetails {
  schemaVersion: 1; boundary?: GameBoundary; bannerAssetId?: string; reading?: ReadingPrefs
  playback?: Record<string, { time: number; subtitle?: string; settings?: Record<string, SubtitlePrefs> }>
  targets?: Record<string, { kind: 'exe' | 'folder'; path: string; relative: boolean; args: string[] }>
  subtitles?: { id: string; name: string; relativePath: string }[]
}
export interface ActionTemplate { id: string; label: string; kind: 'exe' | 'folder'; color: string }
export interface MediaEntry { id: string; name: string; kind: 'image' | 'video' | 'subtitle' | 'folder' | 'other'; size: number; modified: number; mime: string; url: string; thumb?: string }
export interface ContentResult { entries: MediaEntry[]; notices: string[] }
export interface SearchHit { rowId: string; projectId: string; name: string; path: string; matched: string[] }
export interface SearchResult { hits: SearchHit[]; total: number; fields: { key: string; type: string; projectId: string; attributeId: string }[]; incomplete: string[]; parsed: string; index: string }
export interface MetadataPreview { token: string; title: string; source: string; values: { key: string; type: string; value: unknown }[]; image?: string }
export type ExplorerRequest =
 | { action: 'search'; query: string; projectId?: string; offset?: number; limit?: number }
 | { action: 'content'; rowId: string }
 | { action: 'visit'; rowId:string }
 | { action: 'attributes'; rowId: string; revision: number; values: Attribute[]; private: boolean }
 | { action: 'batch'; rows: { rowId: string; revision: number }[]; attributeId: string; value: unknown; mode: 'replace' | 'add' | 'remove' }
 | { action: 'reading'; rowId: string; revision: number; prefs: ReadingPrefs }
 | { action: 'playback'; rowId: string; revision: number; fileId: string; time: number; subtitle?: string; settings?: SubtitlePrefs }
 | { action: 'boundary'; rowId: string; revision: number; state: 'root' | 'not-game' | 'candidate'; traverse?: boolean }
 | { action: 'banner'; rowId: string; revision: number; assetId: string }
 | { action: 'bindTarget'; rowId: string; revision: number; templateId: string; args: string[] }
 | { action: 'runTarget'; rowId: string; templateId: string }
 | { action: 'subtitle'; rowId: string; fileId?: string; externalToken?: string; import?: boolean; encoding?: string }
 | { action: 'chooseSubtitle'; rowId: string }
 | { action: 'metadataPreview'; source: string }
 | { action: 'metadataApply'; rowId: string; revision: number; token: string; keys: string[]; image: boolean }
 | { action: 'rebuildIndex' }
export interface ExplorerResponse { snapshot?: Snapshot; content?: ContentResult; search?: SearchResult; subtitle?: { token: string; name: string; text: string; portable: boolean }; preview?: MetadataPreview; cancelled?: boolean; message?: string }
export interface ExplorerApi { request(request: ExplorerRequest): Promise<ExplorerResponse>; dropSubtitle(rowId: string,file: File): Promise<ExplorerResponse> }
export const newDetails = (): FolderDetails => ({ schemaVersion: 1 })
export const defaultSubtitle = (): SubtitlePrefs => ({ offset: 0, size: 24, bottom: 8, color: '#ffffff', background: '#000000', encoding: 'utf-8' })
export const isFieldKind = (kind: string) => ['field-text', 'field-tags', 'field-number', 'field-date'].includes(kind)
export const cellType = (kind: string) => ({ 'field-text': 'string', 'field-tags': 'tags', 'field-number': 'number', 'field-date': 'datetime' }[kind] ?? 'string')
export const contentCells = (project: { cells: Cell[]; contentCells?: Record<string, Cell[]> }, category: string) => project.contentCells?.[category] ?? visibleCells(project).filter(c => ['name','path'].includes(c.kind))
