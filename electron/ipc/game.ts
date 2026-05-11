import { ipcMain } from 'electron'

export function registerGameIPC(getGameList: any) {
  ipcMain.handle('game:list', () => {
    return getGameList()
  })
}
