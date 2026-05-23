import { Folder, View } from '../../shared/main'

export interface IDataStorage {
  // View
  getAllViews(): Promise<View[]>
  getView(id: string): Promise<View | undefined>
  createView(view: View): Promise<void>
  updateView(view: View): Promise<void>
  deleteView(id: string): Promise<void>

  // folder
  getAllFolders(): Promise<Folder[]>
  getFolder(id: string): Promise<Folder | undefined>
  saveFolder(folder: Folder): Promise<void>
  batchSaveFolders(folders: Folder[]): Promise<void>

  // viewFolder
  getFolderIdsByView(viewId: string): Promise<string[]>
  addFoldersToView(viewId: string, folderIds: string[]): Promise<void>
  removeFoldersFromView(viewId: string, folderIds: string[]): Promise<void>
}
