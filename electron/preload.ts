import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  getGameList: () => ipcRenderer.invoke('game:list'),
  getDoujinshiList: () => ipcRenderer.invoke('doujinshi:list'),
  openFolder: (path: string) => ipcRenderer.invoke('os:open-folder', path),
  // saveTags: (tags: any) => ipcRenderer.invoke('system:save-tags', tags),
  getSystemData: () => ipcRenderer.invoke('system:get-system-data'),
})
