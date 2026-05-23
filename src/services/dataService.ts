// services/dataService.ts
import { ipcRenderer } from 'electron'
import { Folder, View } from 'shared/main'

export const dataService = {
  // 扫描根文件夹，返回所有子文件夹及元数据
  async scanRootFolder(rootPath: string): Promise<Folder[]> {
    return ipcRenderer.invoke('fs:scan-folders', rootPath)
  },

  // 加载某个 View（含 layouts, columns 等）
  async loadView(viewId: string): Promise<View> {
    return ipcRenderer.invoke('db:load-view', viewId)
  },

  // 保存整个 View
  async saveView(view: View): Promise<void> {
    return ipcRenderer.invoke('db:save-view', view)
  },
}
