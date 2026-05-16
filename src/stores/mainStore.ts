// stores/useAppStore.ts
import {
  Cell,
  Column,
  DataLayoutItem,
  Folder,
  Layout,
  VisualLayoutItem,
  WindowView,
} from 'shared/main'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // 当前激活的视图（支持多视图，但一次只激活一个）
  activeViewId: string | null
  views: Record<string, WindowView>

  // 便捷访问当前视图
  currentView: WindowView | null

  // Actions
  loadViews: (views: WindowView[]) => void
  // setActiveView: (viewId: string) => void

  // // 视图级别操作
  // addView: (view: WindowView) => void
  // updateViewName: (viewId: string, name: string) => void
  // updateViewTargetPath: (viewId: string, path: string) => void
  // updateViewConfig: (
  //   viewId: string,
  //   config: Partial<WindowView['config']>
  // ) => void

  // // 布局操作
  // addLayout: (viewId: string, layout: Layout) => void
  // removeLayout: (viewId: string, layoutId: string) => void
  // selectLayout: (viewId: string, layoutId: string) => void
  updateLayoutItems: (layoutId: string, items: Layout['layoutItems']) => void

  // // column操作
  // addColumn: (viewId: string, column: Column) => void
  // updateColumn: (
  //   viewId: string,
  //   columnId: string,
  //   updates: Partial<Column>
  // ) => void
  // deleteColumn: (viewId: string, columnId: string) => void

  // // 文件夹 + Cell 操作
  // addFolder: (viewId: string, folder: Folder) => void
  // updateFolderPath: (viewId: string, folderId: string, newPath: string) => void
  // deleteFolder: (viewId: string, folderId: string) => void

  // // Cell 值更新（核心）
  // updateCellValue: (
  //   viewId: string,
  //   folderId: string,
  //   columnId: string,
  //   value: string | number | boolean | Date
  // ) => void

  // // 批量更新文件夹的 Cells（例如扫描后同步）
  // syncFolderCells: (viewId: string, folderId: string, cells: Cell[]) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  activeViewId: null,
  views: {},
  currentView: null,

  loadViews: views => {
    const viewsMap: Record<string, WindowView> = views.reduce(
      (acc, v) => ({ ...acc, [v.id]: v }),
      {}
    )

    const firstViewId = views[0]?.id || null
    set({
      views: viewsMap,
      activeViewId: firstViewId,
      currentView: firstViewId ? viewsMap[firstViewId] : null,
    })
  },

  // setActiveView: viewId => {
  //   const view = get().views[viewId]
  //   if (view) {
  //     set({ activeViewId: viewId, currentView: view })
  //   }
  // },

  // addView: view => {
  //   set(state => ({
  //     views: { ...state.views, [view.id]: view },
  //     activeViewId: state.activeViewId || view.id,
  //     currentView: state.activeViewId ? state.currentView : view,
  //   }))
  // },

  // updateViewName: (viewId, name) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = { ...view, name }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // updateViewTargetPath: (viewId, path) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = { ...view, targetFolderPath: path }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // updateViewConfig: (viewId, config) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = { ...view, config: { ...view.config, ...config } }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // addLayout: (viewId, layout) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = {
  //       ...view,
  //       layouts: [...view.layouts, layout],
  //     }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // removeLayout: (viewId, layoutId) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const newLayouts = view.layouts.filter(l => l.id !== layoutId)
  //     let newSelectedId = view.selectedLayoutId
  //     if (view.selectedLayoutId === layoutId) {
  //       newSelectedId = newLayouts[0]?.id || ''
  //     }
  //     const updated = {
  //       ...view,
  //       layouts: newLayouts,
  //       selectedLayoutId: newSelectedId,
  //     }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // selectLayout: (viewId, layoutId) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view || !view.layouts.some(l => l.id === layoutId)) return state
  //     const updated = { ...view, selectedLayoutId: layoutId }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  updateLayoutItems: (layoutId, items) => {
    set(state => {
      const viewId = state.activeViewId
      const view = state.views[viewId ?? '']
      if (!view || !viewId) return state
      const newLayouts = view.layouts.map(l =>
        l.id === layoutId ? { ...l, layoutItems: items } : l
      )
      const updated = { ...view, layouts: newLayouts }
      return {
        views: { ...state.views, [viewId]: updated },
        currentView:
          state.activeViewId === viewId ? updated : state.currentView,
      }
    })
  },

  // addColumn: (viewId, column) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = { ...view, columns: [...view.columns, column] }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // updateColumn: (viewId, columnId, updates) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const newColumns = view.columns.map(c =>
  //       c.id === columnId ? { ...c, ...updates } : c
  //     )
  //     const updated = { ...view, columns: newColumns }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // deleteColumn: (viewId, columnId) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state

  //     // 删除列时，需要同时删除所有文件夹下该列的 Cell
  //     const newFolders = view.folders.map(folder => ({
  //       ...folder,
  //       cells: folder.cells.filter(cell => cell.columnId !== columnId),
  //     }))

  //     // 删除布局中使用了该列的 DataLayoutItem
  //     const newLayouts = view.layouts.map(layout => ({
  //       ...layout,
  //       layoutItems: layout.layoutItems.filter(item => {
  //         if ('columnId' in item) {
  //           return item.columnId !== columnId
  //         }
  //         return true
  //       }),
  //     }))

  //     const updated = {
  //       ...view,
  //       columns: view.columns.filter(c => c.id !== columnId),
  //       folders: newFolders,
  //       layouts: newLayouts,
  //     }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // addFolder: (viewId, folder) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = { ...view, folders: [...view.folders, folder] }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // updateFolderPath: (viewId, folderId, newPath) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const newFolders = view.folders.map(f =>
  //       f.id === folderId
  //         ? { ...f, lastReadPath: newPath, updateDate: new Date() }
  //         : f
  //     )
  //     const updated = { ...view, folders: newFolders }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // deleteFolder: (viewId, folderId) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state
  //     const updated = {
  //       ...view,
  //       folders: view.folders.filter(f => f.id !== folderId),
  //     }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // updateCellValue: (viewId, folderId, columnId, value) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state

  //     const newFolders = view.folders.map(folder => {
  //       if (folder.id !== folderId) return folder

  //       const existingCellIndex = folder.cells.findIndex(
  //         cell => cell.columnId === columnId
  //       )
  //       let newCells
  //       const now = new Date()

  //       if (existingCellIndex >= 0) {
  //         // 更新已有 Cell
  //         newCells = [...folder.cells]
  //         newCells[existingCellIndex] = {
  //           ...newCells[existingCellIndex],
  //           value: value as any, // 实际类型会由 column 定义保证
  //           updateDate: now,
  //         }
  //       } else {
  //         // 新增 Cell
  //         const newCell: Cell = {
  //           id: `${folderId}_${columnId}_${Date.now()}`,
  //           columnId,
  //           value: value as any,
  //           updateDate: now,
  //         }
  //         newCells = [...folder.cells, newCell]
  //       }

  //       return { ...folder, cells: newCells, updateDate: now }
  //     })

  //     const updated = { ...view, folders: newFolders }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },

  // syncFolderCells: (viewId, folderId, cells) => {
  //   set(state => {
  //     const view = state.views[viewId]
  //     if (!view) return state

  //     const newFolders = view.folders.map(folder =>
  //       folder.id === folderId
  //         ? { ...folder, cells, updateDate: new Date() }
  //         : folder
  //     )
  //     const updated = { ...view, folders: newFolders }
  //     return {
  //       views: { ...state.views, [viewId]: updated },
  //       currentView:
  //         state.activeViewId === viewId ? updated : state.currentView,
  //     }
  //   })
  // },
}))
