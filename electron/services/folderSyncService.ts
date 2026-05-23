import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { Folder } from '../../shared/main'
import { IDataStorage } from '../storage/IDataStorage'

export class FolderSyncService {
  private storage: IDataStorage

  constructor(storage: IDataStorage) {
    this.storage = storage
  }

  private async scanFileSystem(
    rootPath: string,
    maxDepth: number
  ): Promise<Array<{ path: string; parentId: string }>> {
    const result: Array<{ path: string; parentId: string }> = []

    const scan = async (
      currentPath: string,
      depth: number,
      parentPath: string
    ) => {
      if (maxDepth !== -1 && depth > maxDepth) return
      result.push({ path: currentPath, parentId: parentPath })
      const entries = await fs
        .readdir(currentPath, { withFileTypes: true, encoding: 'utf8' })
        .catch(() => [])
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          await scan(path.join(currentPath, entry.name), depth + 1, currentPath)
        }
      }
    }

    await scan(rootPath, 0, rootPath)
    return result
  }

  async syncView(
    viewId: string,
    rootPath: string,
    maxDepth: number = 2
  ): Promise<void> {
    // 1. 扫描文件系统，获取当前所有文件夹的路径及父子关系（临时）
    const currentInfos = await this.scanFileSystem(rootPath, maxDepth)
    // console.log(currentInfos)

    // 2. 获取全局已有的 Folder 列表（用于去重）
    const allFolders = await this.storage.getAllFolders()
    const pathToFolder = new Map<string, Folder>()
    for (const f of allFolders) {
      pathToFolder.set(f.lastReadPath, f)
    }

    // 3. 确定需要保存的 Folder（新建或更新路径）
    const foldersToSave: Folder[] = []
    const currentFolderIds: string[] = []

    for (const info of currentInfos) {
      let folder = pathToFolder.get(info.path)
      if (!folder) {
        // 新建 Folder
        folder = {
          id: uuidv4(),
          parentFolderId: info.parentId,
          lastReadPath: info.path,
          updateDate: new Date(),
          cells: [], // 稍后填充
        }
        foldersToSave.push(folder)
      } else if (
        folder.parentFolderId !== info.parentId ||
        folder.lastReadPath !== info.path
      ) {
        // 路径或父级变化，更新
        folder.parentFolderId = info.parentId
        folder.lastReadPath = info.path
        folder.updateDate = new Date()
        foldersToSave.push(folder)
      }
      currentFolderIds.push(folder.id)
    }
    // console.log(currentFolderIds)

    // 4. 批量保存 Folder（全局）
    if (foldersToSave.length > 0) {
      await this.storage.batchUpdateFolders(foldersToSave)
    }

    // 5. 更新视图与 Folder 的关联
    const existingFolderIds = await this.storage.getFolderIdsByView(viewId)
    const toAdd = currentFolderIds.filter(id => !existingFolderIds.includes(id))
    const toRemove = existingFolderIds.filter(
      id => !currentFolderIds.includes(id)
    )

    if (toAdd.length) {
      await this.storage.addFoldersToView(viewId, toAdd)
    }
    if (toRemove.length) {
      await this.storage.removeFoldersFromView(viewId, toRemove)
    }

    // 6. 确保所有在视图中的 Folder 拥有所有列的空 Cell
    // await this.ensureCellsForView(viewId)
  }
}
