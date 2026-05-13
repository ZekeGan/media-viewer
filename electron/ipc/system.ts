import { ipcMain } from 'electron'
import { getSystemData } from '../services/system'

export function registerSystemIPC() {
  // ipcMain.handle('system:save-tags', (_, tags) => saveTags(tags))
  ipcMain.handle('system:get-system-data', () => getSystemData())
}
