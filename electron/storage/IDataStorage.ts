import { Column, Folder, Layout, View } from '../../shared/main'

export interface IDataStorage {
  // view
  getAllViews(): Promise<View[]>
  getView(viewId: string): Promise<View | undefined>
  saveView(view: View): Promise<void>
  // createView(view: View): Promise<void>
  // updateView(view: View): Promise<void>
  deleteView(viewId: string): Promise<void>

  // folder
  getAllFolders(): Promise<Folder[]>
  getFolder(id: string): Promise<Folder | undefined>
  updateFolder(folder: Folder): Promise<void>
  deleteFolder(id: string): Promise<void>
  batchUpdateFolders(folders: Folder[]): Promise<void>

  // viewFolder
  getFolderIdsByView(viewId: string): Promise<string[]>
  addFoldersToView(viewId: string, folderIds: string[]): Promise<void>
  removeFoldersFromView(viewId: string, folderIds: string[]): Promise<void>

  // column
  getColumnsByView(viewId: string): Promise<Column[]>
  saveColumn(column: Column): Promise<void>
  deleteColumn(id: string): Promise<void>

  // layout
  getLayoutByView(viewId: string): Promise<Layout[]>
  createLayout(layout: Layout): Promise<void>
  updateLayout(id: string): Promise<void>
  deleteLayout(id: string): Promise<void>

  // ===== layoutItem =====
  getLayoutItems(layoutId: string): Promise<Layout['layoutItems']>
  createLayoutItem(
    layoutId: string,
    layoutItem: Layout['layoutItems'][0]
  ): Promise<void>
  updateLayoutItems(
    layoutId: string,
    layoutItems: Layout['layoutItems']
  ): Promise<void>
  deleteLayoutItem(layoutItemId: string): Promise<void>
}
