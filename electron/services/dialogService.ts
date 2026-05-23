// src/main/services/DialogService.ts
import { BrowserWindow, dialog } from 'electron'

export interface IDialogService {
  selectFolder(): Promise<string | null>
  showError(title: string, content: string): Promise<void>
  showMessage(option: {
    title: string
    message: string
    type?: 'info' | 'warning' | 'error'
  }): Promise<void>
}

export class DialogService implements IDialogService {
  constructor(private parentWindow: BrowserWindow | null = null) {}

  public async selectFolder(
    title: string = '選擇資料夾'
  ): Promise<string | null> {
    const result = await dialog.showOpenDialog(this.parentWindow!, {
      properties: ['openDirectory'],
      title,
    })
    return result.canceled ? null : result.filePaths[0]
  }

  public async showError(title: string, content: string): Promise<void> {
    await dialog.showErrorBox(title, content)
  }

  public async showMessage(options: {
    title: string
    message: string
    type?: 'info' | 'warning' | 'error'
  }) {
    await dialog.showMessageBox(this.parentWindow!, {
      type: options.type || 'info',
      title: options.title,
      message: options.message,
    })
  }
}
