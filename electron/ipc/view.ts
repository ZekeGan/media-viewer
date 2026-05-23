import { ipcMain } from 'electron'
import { View } from '../../shared/main'
import { mockView } from '../_mock'
import { ViewService } from '../services/viewService'

export function registerViewIPC(service: ViewService) {
  ipcMain.handle('view:get-all', () => {
    return service.getAllViews()
    // return [mockView]
  })
  ipcMain.handle('view:get', (_, viewId: string) => service.getView(viewId))
  ipcMain.handle('view:save', (_, view: View) => service.saveView(view))
  ipcMain.handle('view:create', (_, path: string, depth: number) => {
    // service.createView(targetFolderPath, dataSearchDepth)
    service.createView(path, depth)
  })
  //   ipcMain.handle('window-view:get', (_, id: string) => {})
  //   ipcMain.handle('window-view:create', () => {})
  //   ipcMain.handle('window-view:update', () => {})
  //   ipcMain.handle('window-view:delete', () => {})
}
