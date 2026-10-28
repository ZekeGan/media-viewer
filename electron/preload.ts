import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { ExplorerApi } from '../shared/explorer'
import type { MediaApi, Request, Response, ScanProgress } from '../shared/model'
import type { DesktopApi, WindowState } from '../shared/workspace'
const api: MediaApi = {
  request: (request: Request): Promise<Response> => ipcRenderer.invoke('library:request', request),
  onProgress(callback) {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress) => callback(progress)
    ipcRenderer.on('library:progress', listener)
    return () => ipcRenderer.removeListener('library:progress', listener)
  },
}
contextBridge.exposeInMainWorld('media', api)
const desktop: DesktopApi = {
  settingsFile: action=>ipcRenderer.invoke('workspace:file',action),
  workspace: () => ipcRenderer.invoke('workspace:read'),
  updateWorkspace: command => ipcRenderer.invoke('workspace:update', command),
  windowAction: action => ipcRenderer.invoke('window:action', action),
  onWindowState(callback) {
    const listener = (_event: Electron.IpcRendererEvent, state: WindowState) => callback(state)
    ipcRenderer.on('window:state', listener)
    return () => ipcRenderer.removeListener('window:state', listener)
  },
}
contextBridge.exposeInMainWorld('desktop', desktop)
const explorer:ExplorerApi={ request:request=>ipcRenderer.invoke('explorer:request',request),dropSubtitle:(rowId,file)=>{const filePath=webUtils.getPathForFile(file);if(!filePath)return Promise.reject(new Error('需由檔案總管拖入實際字幕檔'));return ipcRenderer.invoke('explorer:subtitleDrop',rowId,filePath)} }
contextBridge.exposeInMainWorld('explorer',explorer)
