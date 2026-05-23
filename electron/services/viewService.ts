// src/main/services/ViewService.ts
import { v4 as uuidv4 } from 'uuid'
// import { FolderSyncService } from './FolderSyncService';
import { Column, View } from '../../shared/main'
import { IDataStorage } from '../storage/IDataStorage'
import { FolderSyncService } from './folderSyncService'

export class ViewService {
  private Storage: IDataStorage

  private FolderSync: FolderSyncService

  constructor(storage: IDataStorage, folderSync: FolderSyncService) {
    this.Storage = storage
    this.FolderSync = folderSync
  }

  async getAllViews() {
    return this.Storage.getAllViews()
  }

  async getView(viewId: string) {
    const views = await this.Storage.getAllViews()
    let view = views.find(d => d.id === viewId)
    if (!view) return
    console.log(view)

    const folderIds = await this.Storage.getFolderIdsByView(viewId)
    console.log(folderIds)

    const folders = (
      await Promise.all(folderIds.map(id => this.Storage.getFolder(id)))
    ).filter(f => !!f)
    console.log('folders:', folders)
    view.folders = folders

    const columns = await this.Storage.getColumnsByView(viewId)
    view.columns = columns

    const layouts = await this.Storage.getLayoutByView(viewId)
    view.layouts = layouts
    console.log('get')

    return view
  }

  async saveView(view: View) {
    await this.Storage.saveView(view)
  }

  async createView(targetFolderPath: string, dataSearchDepth: number = 1) {
    const viewId = uuidv4()

    // 創建 View
    const defaultData: View = {
      id: viewId,
      selectedLayoutId: '',
      targetFolderPath,
      name: 'DEFAULT_NAME',
      layouts: [],
      folders: [],
      columns: [],
      config: {
        dataSearchDepth,
        colCount: 0,
        autoWidth: false,
      },
    }
    await this.Storage.saveView(defaultData)

    // 創建 column
    const systemColumns: Column[] = [
      {
        id: uuidv4(),
        viewId,
        name: 'name',
        dataType: 'STRING',
        isSystem: true,
      },
      {
        id: uuidv4(),
        viewId,
        name: 'path',
        dataType: 'FILE_PATH',
        isSystem: true,
      },
      {
        id: uuidv4(),
        viewId,
        name: 'updateDate',
        dataType: 'DATETIME',
        isSystem: true,
      },
    ]
    await Promise.all(systemColumns.map(c => this.Storage.saveColumn(c)))

    await this.FolderSync.syncView(viewId, targetFolderPath, 1)
  }
}
