import { BrowserWindow, app, net, protocol } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { registerDoujinshiIPC } from './ipc/doujinshi'
import { registerGameIPC } from './ipc/game'
import { registerOsIPC } from './ipc/os'

const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

const preloadPath = path.join(_dirname, '../preload/preload.js')

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'media',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
])

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 800,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      // 儘管electron官方默認開啟，但是electron-vite的配置中還是推薦關閉。https://electron-vite.org/guide/dev#limitations-of-sandboxing
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => {
    if (process.env.NODE_ENV === 'development') {
      win.showInactive()
      win.minimize()
    } else {
      win.show()
    }
  })

  win.loadURL('http://localhost:3000')
}

app.whenReady().then(() => {
  protocol.handle('media', req => {
    const url = new URL(req.url)
    const filePath = decodeURIComponent(url.searchParams.get('path') || '')
    return net.fetch(`file://${filePath}`)
  })
  registerDoujinshiIPC()
  registerGameIPC()
  registerOsIPC()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
