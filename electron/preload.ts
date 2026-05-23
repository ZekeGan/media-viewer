import { contextBridge, ipcRenderer } from 'electron'
import { View } from '../shared/main'

contextBridge.exposeInMainWorld('electronApi', {
  getGameList: () => ipcRenderer.invoke('game:list'),
  getDoujinshiList: () => ipcRenderer.invoke('doujinshi:list'),
  openFolder: (path: string) => ipcRenderer.invoke('os:open-folder', path),
  // saveTags: (tags: any) => ipcRenderer.invoke('system:save-tags', tags),
  getSystemData: () => ipcRenderer.invoke('system:get-system-data'),

  // v2
  getViewList: () => ipcRenderer.invoke('view:get-all'),
  getView: (viewId: string) => ipcRenderer.invoke('view:get', viewId),
  saveView: (viewId: string) => ipcRenderer.invoke('view:save', viewId),
  createView: (path: string, depth?: number) =>
    ipcRenderer.invoke('view:create', path, depth),
})
