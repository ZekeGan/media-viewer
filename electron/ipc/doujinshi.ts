import { ipcMain } from 'electron'
import { getDoujinshiList } from '../services/doujinshi'

export function registerDoujinshiIPC() {
  return ipcMain.handle('doujinshi:list', () => {
    return getDoujinshiList()
  })
}
