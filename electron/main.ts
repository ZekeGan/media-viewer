import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Library } from './library'
import { safePath } from './files'
import type { Request, Response } from '../shared/model'

const directory = path.dirname(fileURLToPath(import.meta.url))
const rendererRoot = path.resolve(directory, '../renderer')
protocol.registerSchemesAsPrivileged(['app', 'media'].map(scheme => ({ scheme, privileges: { standard: true, secure: true, supportFetchAPI: true } })))
let win: BrowserWindow | undefined
let library: Library
let pendingRequests = 0
const devUrl = process.env.ELECTRON_RENDERER_URL
function trusted(url: string) { try { return devUrl ? new URL(url).origin === new URL(devUrl).origin : new URL(url).protocol === 'app:' && new URL(url).hostname === 'ui' } catch { return false } }
async function selectFolder() {
  const result = await dialog.showOpenDialog(win!, { properties: ['openDirectory'] })
  return result.canceled ? undefined : result.filePaths[0]
}
async function dispatch(request: Request): Promise<Response> {
  let extra: Partial<Response> = {}
  switch (request.action) {
    case 'snapshot': break
    case 'scan': await library.scan(); break
    case 'create': { const root = await selectFolder(); if (root) await library.create(root, request.input); break }
    case 'link': { const root = await selectFolder(); if (root) await library.link(root); break }
    case 'unlink': await library.unlink(request.projectId); break
    case 'saveProject': await library.saveProject(request.project); break
    case 'saveFolder': await library.saveValues(request.rowId, request.revision, request.values); break
    case 'image': {
      const selected = await dialog.showOpenDialog(win!, { properties: ['openFile'], filters: [{ name: '圖片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }] })
      if (!selected.canceled) await library.addImage(request.rowId, request.revision, selected.filePaths[0])
      break
    }
    case 'open': { const row = await library.checkedRow(request.rowId); const error = await shell.openPath(row.path); if (error) throw new Error(error); break }
    case 'restore': await library.restore(request.rowId); break
    case 'restoreProject': await library.restoreProject(request.projectId); break
    case 'copyIdentity': await library.copyIdentity(request.rowId); break
    case 'resume': await library.resume(request.rowId); break
    case 'cleanupPreview': extra.preview = await library.previewCleanup(request.rowId, request.scope); break
    case 'cleanupAllPreview': extra.preview = await library.previewCleanup(undefined, 'all'); break
    case 'cleanup': extra.cleanup = await library.cleanup(request.token, request.restart); break
    case 'legacyPreview': extra.legacy = await library.previewLegacy(); break
    case 'legacyImport': extra.message = await library.importLegacy(request.token, request.ids, request.depth); break
    default: throw new Error('不支援的操作')
  }
  return { snapshot: library.snapshot(), ...extra }
}
if (process.env.MEDIA_VIEWER_TEST_DATA) app.setPath('userData', path.resolve(process.env.MEDIA_VIEWER_TEST_DATA))
if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => { win?.restore(); win?.focus() })
  app.whenReady().then(async () => {
    library = new Library(app.getPath('userData'), progress => win?.webContents.send('library:progress', progress))
    let startupError = ''
    try { await library.init() } catch (e) { startupError = String(e); console.error(e) }
    protocol.handle('app', async request => {
      try {
        const url = new URL(request.url)
        if (url.hostname !== 'ui') return new Response(null, { status: 403 })
        const file = path.resolve(rendererRoot, '.' + decodeURIComponent(url.pathname))
        await safePath(rendererRoot, file)
        return net.fetch(pathToFileURL(file).toString())
      } catch { return new Response(null, { status: 404 }) }
    })
    protocol.handle('media', async request => {
      try {
        const url = new URL(request.url), parts = url.pathname.split('/').filter(Boolean)
        if (url.hostname !== 'asset' || parts.length !== 2) return new Response(null, { status: 403 })
        const asset = await library.asset(parts[0], parts[1])
        return net.fetch(pathToFileURL(asset.file).toString())
      } catch { return new Response(null, { status: 404 }) }
    })
    ipcMain.handle('library:request', async (event, request: Request) => {
      if (event.sender !== win?.webContents || event.senderFrame !== win.webContents.mainFrame || !trusted(event.senderFrame.url) || !request || typeof request.action !== 'string') throw new Error('拒絕未授權的操作')
      if (request.action === 'cancelScan') { library.cancelScan(); return { snapshot: library.snapshot() } }
      if (request.action === 'snapshot' && startupError) return { snapshot: library.snapshot(), message: startupError }
      pendingRequests++
      try { return await library.run(() => dispatch(request)) }
      finally { pendingRequests-- }
    })
    win = new BrowserWindow({ width: 1280, height: 850, minWidth: 760, minHeight: 580, show: false, webPreferences: { preload: path.join(directory, '../preload/preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } })
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    win.on('close', event => {
      if (pendingRequests) {
        event.preventDefault()
        dialog.showMessageBoxSync(win!, { type: 'info', message: '操作仍在進行', detail: '請等候保存完成；掃描可先按「取消掃描」，再關閉程式。', buttons: ['繼續等待'] })
      }
    })
    win.webContents.on('will-prevent-unload', event => {
      if (pendingRequests) return
      const choice = dialog.showMessageBoxSync(win!, { type: 'question', message: '要放棄尚未保存的變更嗎？', detail: '返回可繼續編輯；放棄後會關閉或重新載入畫面。', buttons: ['返回編輯', '放棄變更'], defaultId: 0, cancelId: 0 })
      if (choice === 1) event.preventDefault()
    })
    win.webContents.on('will-navigate', (event, url) => { if (!trusted(url)) event.preventDefault() })
    win.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false))
    win.once('ready-to-show', () => win?.show())
    await win.loadURL(devUrl ?? 'app://ui/index.html')
  }).catch(error => { console.error(error); dialog.showErrorBox('啟動失敗', String(error)); app.quit() })
  app.on('window-all-closed', () => app.quit())
}
