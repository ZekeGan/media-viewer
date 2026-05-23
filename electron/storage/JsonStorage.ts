import fs from 'fs/promises'
import path from 'path'
import { Folder, View } from '../../shared/main'
import { mockView } from '../_mock'
import { IDataStorage } from './IDataStorage'

export class JsonStorage implements IDataStorage {
  private basePath: string
  private viewFile: string
  private viewDir: string
  private folderDir: string
  private viewFolderDir: string
  private columnDir: string

  private async initDir() {
    await fs.mkdir(this.basePath)
    await fs.mkdir(this.viewDir)
    await fs.mkdir(this.folderDir)
    await fs.mkdir(this.viewFolderDir)
    await fs.mkdir(this.columnDir)
  }

  constructor(userDataPath: string) {
    this.basePath = path.join(userDataPath, 'app-data')
    this.viewDir = path.join(this.basePath, 'view')
    this.viewFile = path.join(this.basePath, 'view.json')
    this.folderDir = path.join(this.basePath, 'folder')
    this.viewFolderDir = path.join(userDataPath, 'viewFolder')
    this.columnDir = path.join(this.basePath, 'column')

    this.initDir()
  }

  // ===== util =====
  private async readJsonFile<T>(path: string, defaultData: T): Promise<T> {
    try {
      const data = await fs.readFile(path, 'utf8')
      return JSON.parse(data)
    } catch (err: any) {
      if (err.code === 'ENOENT') return defaultData
      throw err
    }
  }

  private async writeJsonFile(path: string, data: any): Promise<void> {
    await fs.writeFile(path, JSON.stringify(data, null, 2))
  }

  // ===== View =====
  public async getAllViews(): Promise<View[]> {
    const data = this.readJsonFile<View[]>(this.viewFile, [])
    return [mockView]
  }

  public async getView(id: string): Promise<View | undefined> {
    const views = await this.getAllViews()
    return views.find(d => d.id === id)
  }

  public async createView(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  public async updateView(view: View): Promise<void> {
    const views = await this.getAllViews()
    const idx = views.findIndex(d => d.id === view.id)

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
    const dataPath = path.join(this.basePath, `${id}.json`)
    return await this.readJsonFile<Folder | undefined>(dataPath, undefined)
  }

  public async saveFolder(folder: Folder): Promise<void> {
    const folderFile = path.join(this.folderDir, `${folder.id}.json`)
    await this.writeJsonFile(folderFile, folder)
  }

  public async batchSaveFolders(folders: Folder[]): Promise<void> {
    await Promise.all(folders.map(f => this.saveFolder(f)))
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
}
