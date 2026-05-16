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

export interface Column {
  id: string
  // windowViewId: string
  name: string
  dataType: DataType
  isSystem?: boolean // 新增：是否為系統內建欄位（如：建立時間，不可刪除）
}

export type DataRendererType =
  | 'BUTTON'
  | 'TEXT'
  | 'IMAGE'
  | 'LINK'
  | 'TAG'
  | 'PROGRESS' // 等等
export type VisualRendererType = 'DIVIDER' // 等等

export interface Layout {
  id: string
  name: string
  // updateDate: Date
  layoutItems: (DataLayoutItem | VisualLayoutItem)[]
}
export interface DataLayoutItem {
  id: string
  layoutId: string
  columnId: string
  grid: ReactGridLayoutItem
  renderer: DataRendererType
  rendererConfig?: Record<string, any>
}
export interface VisualLayoutItem {
  id: string
  layoutId: string
  grid: ReactGridLayoutItem
  renderer: VisualRendererType
  rendererConfig?: Record<string, any>
}

// 只對應一個資料夾，該資料夾儲存 FolderId
// 深度搜尋該子資料夾可設定深度
export interface Folder {
  id: string
  parentFolderId: string
  lastReadPath: string // 用於交叉驗證，防止資料夾複製造成的 ID 重複衝突
  updateDate: Date
  cells: Cell[]
}

// 一個Cell只對應一個Column
export interface Cell {
  id: string
  columnId: string
  value: string | number | boolean | Date // 根據 column 去查找該欄位的型別 string | number | boolean | Date
  updateDate: Date // 新增：欄位值最後修改時間，用於精準的資料庫同步（Incremental Sync）
}
