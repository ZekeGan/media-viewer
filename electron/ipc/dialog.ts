import { ipcMain } from 'electron'
import { IDialogService } from '../services/dialogService'

export function registerDialogIPC(service: IDialogService) {
  ipcMain.handle('dialog:selectFolder', () => service.selectFolder())
}
