import { ipcMain } from 'electron'
import { ViewService } from '../services/viewService'


export function registerViewIPC(service: ViewService) {
  ipcMain.handle('view:get-all', () => {
    service.createView('D://MediaViewerData//Game')
    return service.getAllViews()
  })
  //   ipcMain.handle('window-view:get', (_, id: string) => {})
  //   ipcMain.handle('window-view:create', () => {})
  //   ipcMain.handle('window-view:update', () => {})
  //   ipcMain.handle('window-view:delete', () => {})
}
