import fs from 'fs/promises'
import path from 'path'
import { Column, Folder, Layout, View } from '../../shared/main'
import { IDataStorage } from './IDataStorage'

export class JsonStorage implements IDataStorage {
  private basePath: string
  private viewFile: string
  private folderDir: string
  private viewFolderDir: string
  private columnDir: string
  private layoutDir: string

  public async initDir() {
    await fs.mkdir(this.basePath, { recursive: true })
    await fs.mkdir(this.folderDir, { recursive: true })
    await fs.mkdir(this.viewFolderDir, { recursive: true })
    await fs.mkdir(this.columnDir, { recursive: true })
    await fs.mkdir(this.layoutDir, { recursive: true })
  }

  constructor(userDataPath: string) {
    this.basePath = path.join(userDataPath, 'app-data')
    this.viewFile = path.join(this.basePath, 'view.json')
    this.folderDir = path.join(this.basePath, 'folder')
    this.columnDir = path.join(this.basePath, 'column')
    this.viewFolderDir = path.join(this.basePath, 'viewFolder')
    this.layoutDir = path.join(this.basePath, 'layout')
  }

  // ===== util =====
  private async readJsonFile<T>(path: string, defaultData: T): Promise<T> {
    try {
      const data = await fs.readFile(path, 'utf8')
      return JSON.parse(data)
    } catch (err: any) {
      if (err.code === 'ENOENT') return defaultData
      console.error(err.message)
      throw err
    }
  }

  private async writeJsonFile(path: string, data: any): Promise<void> {
    try {
      await fs.writeFile(path, JSON.stringify(data, null, 2))
    } catch (err: any) {
      console.error(err.message)
      throw err
    }
  }

  // ===== View =====
  public async getAllViews(): Promise<View[]> {
    return await this.readJsonFile<View[]>(this.viewFile, [])
  }

  public async getView(viewId: string): Promise<View | undefined> {
    const views = await this.getAllViews()
    return views.find(d => d.id === viewId)
  }

  public async saveView(view: View): Promise<void> {
    const views = await this.getAllViews()
    const idx = views.findIndex(v => v.id === view.id)

    if (idx >= 0) views[idx] = view
    else views.push(view)

    await this.writeJsonFile(this.viewFile, views)
  }

  public async deleteView(id: string): Promise<void> {
    // delete View
    const views = await this.getAllViews()
    const newViews = views.filter(v => v.id !== id)
    await this.writeJsonFile(this.viewFile, newViews)

    // delete column

    // delete layout
  }

  // ===== folder =====
  public async getAllFolders(): Promise<Folder[]> {
    let folders: Folder[] = []
    const paths = await fs.readdir(this.folderDir)
    for (const p in paths) {
      const data = await this.readJsonFile<Folder | undefined>(
        path.join(this.folderDir, `${p}.json`),
        undefined
      )
      if (data) folders.push(data)
    }
    return folders
  }

  public async getFolder(id: string): Promise<Folder | undefined> {
    const file = path.join(this.folderDir, `${id}.json`)
    return await this.readJsonFile<Folder | undefined>(file, undefined)
  }

  public async updateFolder(folder: Folder): Promise<void> {
    const folderFile = path.join(this.folderDir, `${folder.id}.json`)
    await this.writeJsonFile(folderFile, folder)
  }

  public async batchUpdateFolders(folders: Folder[]): Promise<void> {
    await Promise.all(folders.map(f => this.updateFolder(f)))
  }

  // TODO
  deleteFolder(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // ===== viewFolder =====
  public async getFolderIdsByView(viewId: string): Promise<string[]> {
    const file = path.join(this.viewFolderDir, `${viewId}.json`)
    return this.readJsonFile<string[]>(file, [])
  }

  public async addFoldersToView(
    viewId: string,
    folderIds: string[]
  ): Promise<void> {
    const existing = await this.getFolderIdsByView(viewId)
    const newIds = [...new Set([...existing, ...folderIds])]
    const file = path.join(this.viewFolderDir, `${viewId}.json`)
    await this.writeJsonFile(file, newIds)
  }

  public async removeFoldersFromView(
    viewId: string,
    folderIds: string[]
  ): Promise<void> {
    const existing = await this.getFolderIdsByView(viewId)
    const keep = existing.filter(e => !folderIds.includes(e))
    const file = path.join(this.viewFolderDir, `${viewId}.json`)
    await this.writeJsonFile(file, keep)
  }

  // ===== column =====
  public async getColumnsByView(viewId: string): Promise<Column[]> {
    const file = path.join(this.columnDir, `${viewId}.json`)
    return await this.readJsonFile<Column[]>(file, [])
  }
  // TODO
  public async saveColumn(column: Column): Promise<void> {
    if (!column.viewId) throw new Error('Column missing windowViewId')
    const columnsFile = path.join(this.columnDir, `${column.viewId}.json`)
    const columns = await this.readJsonFile<Column[]>(columnsFile, [])
    const index = columns.findIndex(c => c.id === column.id)

    if (index >= 0) columns[index] = column
    else columns.push(column)

    await this.writeJsonFile(columnsFile, columns)
  }

  deleteColumn(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // ===== layout =====
  public async getLayoutByView(viewId: string): Promise<Layout[]> {
    const file = path.join(this.layoutDir, `${viewId}.json`)
    return await this.readJsonFile<Layout[]>(file, [])
  }

  // TODO
  createLayout(layout: Layout): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updateLayout(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  deleteLayout(id: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // ===== layoutItem =====
  getLayoutItems(layoutId: string): Promise<Layout['layoutItems']> {
    throw new Error('Method not implemented.')
  }
  createLayoutItem(
    layoutId: string,
    layoutItem: Layout['layoutItems'][0]
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updateLayoutItems(
    layoutId: string,
    layoutItems: Layout['layoutItems']
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  deleteLayoutItem(layoutItemId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
