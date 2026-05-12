import { ipcMain } from 'electron'
import { openFolder } from '../services/os'

export function registerOsIPC() {
  ipcMain.handle('os:open-folder', (_, path: string) => {
    return openFolder(path)
  })
}
