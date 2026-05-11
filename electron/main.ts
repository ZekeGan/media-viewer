import { BrowserWindow, app } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerGameIPC } from './ipc/game'


const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

const preloadPath = path.join(_dirname, '../preload/preload.js')

console.log(preloadPath)

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,

    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.loadURL('http://localhost:3000')
}

app.whenReady().then(() => {
  registerGameIPC()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
