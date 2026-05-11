import { ipcMain } from 'electron'
import { getGameList } from '../services/game'

export function registerGameIPC() {
  ipcMain.handle('game:list', () => {
    return getGameList()
  })
}
