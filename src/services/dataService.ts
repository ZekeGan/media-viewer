// services/dataService.ts
import { ipcRenderer } from 'electron'
import { Folder, WindowView } from 'shared/main'

export const dataService = {
  // 扫描根文件夹，返回所有子文件夹及元数据
  async scanRootFolder(rootPath: string): Promise<Folder[]> {
    return ipcRenderer.invoke('fs:scan-folders', rootPath)
  },

  // 加载某个 WindowView（含 layouts, columns 等）
  async loadView(viewId: string): Promise<WindowView> {
    return ipcRenderer.invoke('db:load-view', viewId)
  },

  // 保存整个 WindowView
  async saveView(view: WindowView): Promise<void> {
    return ipcRenderer.invoke('db:save-view', view)
  },
}
