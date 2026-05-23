// src/main/services/ViewService.ts
import { v4 as uuidv4 } from 'uuid'
// import { FolderSyncService } from './FolderSyncService';
import { Column, Layout, View } from '../../shared/main'
import { layouts } from '../_mock/layout'
import { IDataStorage } from '../storage/IDataStorage'
import { FolderSyncService } from './folderSyncService'

export class ViewService {
  private Storage: IDataStorage

  private FolderSync: FolderSyncService

  constructor(storage: IDataStorage, folderSync: FolderSyncService) {
    this.Storage = storage
    this.FolderSync = folderSync
  }

  private dataGenerator(targetFolderPath: string, dataSearchDepth: number = 1) {
    const viewId = uuidv4()
    const colNameId: string = uuidv4()
    const colPathId: string = uuidv4()
    const colUpdateDateId: string = uuidv4()
    const layoutId = uuidv4()

    // 創建 column
    const columns: Column[] = [
      {
        id: colNameId,
        viewId,
        name: 'name',
        dataType: 'STRING',
        isSystem: true,
      },
      {
        id: colPathId,
        viewId,
        name: 'path',
        dataType: 'FILE_PATH',
        isSystem: true,
      },
      {
        id: colUpdateDateId,
        viewId,
        name: 'updateDate',
        dataType: 'DATETIME',
        isSystem: true,
      },
    ]

    // layout
    const layout: Layout = {
      id: layoutId,
      name: 'DEFAULT_LAYOUT',
      viewId,
      updateDate: new Date(),
      layoutItems: [
        {
          id: uuidv4(),
          columnId: colNameId,
          layoutId,
          grid: {
            i: uuidv4(),
            x: 0,
            y: 0,
            h: 1,
            w: 3,
          },
          renderer: 'TEXT',
          rendererConfig: {},
        },
        {
          id: uuidv4(),
          columnId: colPathId,
          layoutId,
          grid: {
            i: uuidv4(),
            x: 0,
            y: 1,
            h: 1,
            w: 3,
          },
          renderer: 'TEXT',
          rendererConfig: {},
        },
        {
          id: uuidv4(),
          columnId: colUpdateDateId,
          layoutId,
          grid: {
            i: uuidv4(),
            x: 0,
            y: 2,
            h: 1,
            w: 3,
          },
          renderer: 'DATE_TEXT',
          rendererConfig: {},
        },
      ],
    }

    // 創建 View
    const view: View = {
      id: viewId,
      selectedLayoutId: layoutId,
      targetFolderPath,
      name: 'DEFAULT_NAME',
      layouts: [],
      folders: [],
      columns: [],
      config: {
        dataSearchDepth,
        colCount: 5,
        autoWidth: true,
      },
    }

    return { view, columns, layout }
  }

  public async getAllViews() {
    return this.Storage.getAllViews()
  }

  public async getView(viewId: string) {
    const views = await this.Storage.getAllViews()
    let view = views.find(d => d.id === viewId)
    if (!view) return

    const folderIds = await this.Storage.getFolderIdsByView(viewId)

    const folders = (
      await Promise.all(folderIds.map(id => this.Storage.getFolder(id)))
    ).filter(f => !!f)
    view.folders = folders

    const columns = await this.Storage.getColumnsByView(viewId)
    view.columns = columns

    const layouts = await this.Storage.getLayoutsByView(viewId)
    view.layouts = layouts

    return view
  }

  public async saveView(view: View) {
    await this.Storage.saveView(view)
  }

  public async createView(targetFolderPath: string, dataSearchDepth: number) {
    const { view, columns, layout } = this.dataGenerator(
      targetFolderPath,
      dataSearchDepth
    )

    await this.Storage.saveView(view)

    await this.Storage.saveColumnsByView(view.id, columns)

    await this.Storage.saveLayout(layout)

    await this.FolderSync.syncView(view.id, targetFolderPath, dataSearchDepth)
  }
}
