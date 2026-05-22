import { ipcMain } from 'electron'
import { getAllWindowView } from '../services/windowView'

export function registerWindowViewIPC() {
  ipcMain.handle('window-view:get-all', () => getAllWindowView())
  //   ipcMain.handle('window-view:get', (_, id: string) => {})
  //   ipcMain.handle('window-view:create', () => {})
  //   ipcMain.handle('window-view:update', () => {})
  //   ipcMain.handle('window-view:delete', () => {})
}
