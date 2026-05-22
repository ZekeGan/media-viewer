import { LayoutItem as ReactGridLayoutItem } from 'react-grid-layout'

// 每次打開該ELECTRON APP 後
// 都會根據FOLDERPATH去FOR該資料夾底下所有資料夾 然後每個資料夾都會有個資料夾ID
// 再拿ID去資料庫找資料 就算路徑修改也不會有問題 除非ID被刪

export interface WindowView {
  id: string
  name: string
  targetFolderPath: string
  layouts: Layout[]
  selectedLayoutId: string
  folders: Folder[]
  columns: Column[]
  config: {
    dataSearchDepth: number
    colCount: number
    autoWidth: boolean
  }
}

export type DataType =
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'DATETIME'
  | 'ARRAY_STRING'
  | 'ARRAY_NUMBER'
  | 'JSON'
  | 'FILE_PATH'

//* Column
export interface Column {
  id: string
  // windowViewId: string
  name: string
  dataType: DataType
  isSystem?: boolean // 新增：是否為系統內建欄位（如：建立時間，不可刪除）
}
//*

//* Layout
export interface Layout {
  id: string
  name: string
  // updateDate: Date
  layoutItems: (DataLayoutItem | VisualLayoutItem)[]
}

interface LayoutItemBase {
  id: string
  layoutId: string
  grid: ReactGridLayoutItem
}

export type DataRendererType =
  // | 'BUTTON'
  | 'TEXT'
  // | 'IMAGE'
  // | 'LINK'
  // | 'TAG'
  // | 'PROGRESS'
  | 'DATE_TEXT' // 等等
interface DataLayoutItemBase extends LayoutItemBase {
  columnId: string
  renderer: DataRendererType
  rendererConfig: Record<string, any>
}

export interface TextLayoutItem extends DataLayoutItemBase {
  renderer: 'TEXT'
  rendererConfig: {
    label?: string
    fontSize?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl' | '3xl'
    color?: string // Tailwind 颜色类名，如 'gray-700' 或任意颜色值
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold'
    textAlign?: 'left' | 'center' | 'right'
    truncate?: boolean
    padding?: number
  }
}
export interface DateTextLayoutItem extends DataLayoutItemBase {
  renderer: 'DATE_TEXT'
  rendererConfig: {
    format?: string
  }
}
export type DataLayoutItem = TextLayoutItem | DateTextLayoutItem

export type VisualRendererType = 'DIVIDER' | 'LABEL' // 等等
interface VisualLayoutItemBase extends LayoutItemBase {
  renderer: VisualRendererType
  rendererConfig: Record<string, any>
}

export interface DividerLayoutItem extends VisualLayoutItemBase {
  renderer: 'DIVIDER'
  rendererConfig: {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    labelPosition?: 'center' | 'left' | 'right'
    label?: string
    orientation?: 'horizontal' | 'vertical'
  }
}
interface LabelLayoutItem extends VisualLayoutItemBase {
  renderer: 'LABEL'
  rendererConfig: {
    label: string
  }
}

export type VisualLayoutItem = DividerLayoutItem | LabelLayoutItem
//*

//* Folder
// 只對應一個資料夾，該資料夾儲存 FolderId
// 深度搜尋該子資料夾可設定深度
export interface Folder {
  id: string
  parentFolderId: string
  lastReadPath: string // 用於交叉驗證，防止資料夾複製造成的 ID 重複衝突
  updateDate: Date
  cells: Cell[]
}

interface CellBase {
  id: string
  columnId: string
  updateDate: Date // 新增：欄位值最後修改時間，用於精準的資料庫同步（Incremental Sync）
}
// 一個Cell只對應一個Column
export interface CellString extends CellBase {
  value: string
}
export interface CellDate extends CellBase {
  value: string
}
export interface CellNumber extends CellBase {
  value: number
}
export interface CellBoolean extends CellBase {
  value: boolean
}
export type Cell = CellDate | CellBoolean | CellNumber | CellString
