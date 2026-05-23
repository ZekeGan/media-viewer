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

  async getView(id: string) {
    return this.Storage.getView(id)
  }

  async createView(targetFolderPath: string, dataSearchDepth: number = 1) {
    const viewId = uuidv4()
    // 根據提供路徑for該路徑下的所有資料
    // 如果有資料則跳過 沒有則創建資料
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
    // TODO 儲存預設 column

    const defaultData: View = {
      id: uuidv4(),
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
    await this.FolderSync.syncView(viewId, targetFolderPath)

    await this.Storage.createView(defaultData)
  }
}
