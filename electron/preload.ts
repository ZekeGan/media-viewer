import { contextBridge, ipcRenderer } from 'electron'
import type { MediaApi, Request, Response, ScanProgress } from '../shared/model'
const api: MediaApi = {
  request: (request: Request): Promise<Response> => ipcRenderer.invoke('library:request', request),
  onProgress(callback) {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress) => callback(progress)
    ipcRenderer.on('library:progress', listener)
    return () => ipcRenderer.removeListener('library:progress', listener)
  },
}
contextBridge.exposeInMainWorld('media', api)
