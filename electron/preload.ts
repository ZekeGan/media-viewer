import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  getGameList: () => ipcRenderer.invoke('game:list'),
  getDoujinshiList: () => ipcRenderer.invoke('doujinshi:list'),
})
