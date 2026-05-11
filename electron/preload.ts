import { contextBridge, ipcRenderer } from 'electron'


contextBridge.exposeInMainWorld('api', {
  getGameList: () => ipcRenderer.invoke('game:list'),
})
