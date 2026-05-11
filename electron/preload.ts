import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  getGameList: () => ipcRenderer.invoke('game:list'),
})
