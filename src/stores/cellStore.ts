// stores/useCellStore.ts
import { Cell } from 'shared/main'
import { create } from 'zustand'

type CellMap = Record<string, Record<string, Cell>> // folderId -> (columnId -> Cell)

interface CellState {
  cells: CellMap
  // 获取某个文件夹下所有单元格（返回数组）
  getCellsForFolder: (folderId: string) => Cell[]
  // 获取某个文件夹下特定列的值
  getCell: (folderId: string, columnId: string) => Cell | undefined
  // 设置整个文件夹的单元格（用于初次加载或全量同步）
  setCellsForFolder: (folderId: string, cells: Cell[]) => void
  // 更新单个单元格（用于编辑）
  updateCell: (
    folderId: string,
    columnId: string,
    value: any,
    updateDate: Date
  ) => void
  // 清除某个文件夹的所有单元格（用于缓存失效）
  clearFolderCells: (folderId: string) => void
}

export const useCellStore = create<CellState>((set, get) => ({
  cells: {},

  getCellsForFolder: folderId => {
    const folderCells = get().cells[folderId] || {}
    return Object.values(folderCells)
  },

  getCell: (folderId, columnId) => get().cells[folderId]?.[columnId],

  setCellsForFolder: (folderId, cells) =>
    set(state => {
      const newFolderMap: Record<string, Cell> = {}
      for (const cell of cells) {
        newFolderMap[cell.columnId] = cell
      }
      return {
        cells: { ...state.cells, [folderId]: newFolderMap },
      }
    }),

  updateCell: (folderId, columnId, value, updateDate) =>
    set(state => {
      const existing =
        state.cells[folderId]?.[columnId] ||
        ({
          id: `${folderId}-${columnId}`, // 临时生成，实际应来自后端
          columnId,
          updateDate,
          // 其他字段根据类型填充，简化处理
        } as Cell)
      const updatedCell = { ...existing, value, updateDate }
      return {
        cells: {
          ...state.cells,
          [folderId]: {
            ...state.cells[folderId],
            [columnId]: updatedCell,
          },
        },
      }
    }),

  clearFolderCells: folderId =>
    set(state => {
      const { [folderId]: _, ...rest } = state.cells
      return { cells: rest }
    }),
}))
