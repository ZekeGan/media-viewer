import { _electron as electron } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { Library } from '../electron/library'
import { randomUUID } from 'node:crypto'

const base = path.resolve('.test-output'), root = await fs.mkdtemp(path.join(await fs.mkdir(base, { recursive: true }).then(() => base), 'ui-'))
const data = path.join(root, 'local'), media = path.join(root, '漫畫收藏')
await fs.mkdir(path.join(media, '作品 A'), { recursive: true }); await fs.mkdir(path.join(media, '作品 B'))
await Promise.all(Array.from({ length: 1002 }, (_, i) => fs.mkdir(path.join(media, `測試 ${i.toString().padStart(4, '0')}`))))
const library = new Library(data, undefined, false)
await library.init()
const initial = await library.create(media, { name: 'POC 測試收藏', mediaCategory: 'manga', depth: { mode: 'through', level: 1 } })
// Seed UI fixtures without repeating the durable-write performance benchmark.
const children = (await fs.readdir(media, { withFileTypes: true })).filter(entry => entry.isDirectory() && entry.name !== '.media-viewer')
for (let index = 0; index < children.length; index += 32) await Promise.all(children.slice(index, index + 32).map(async entry => {
  const meta = path.join(media, entry.name, '.media-viewer'); await fs.mkdir(meta)
  await fs.writeFile(path.join(meta, 'folder.json'), JSON.stringify({ ...initial.rows[0].record!, folderId: randomUUID() }))
}))
await library.saveProject({ ...initial.projects[0].project!, depth: { mode: 'through', level: 2 } })
const env: Record<string, string> = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined))
env.MEDIA_VIEWER_TEST_DATA = data; delete env.ELECTRON_RUN_AS_NODE
const app = await electron.launch({ args: ['out/main/main.js'], env, timeout: 30000 })
const errors: string[] = []
const attemptClose = () => app.evaluate(({ BrowserWindow, dialog }) => new Promise<string>(resolve => {
  const original = dialog.showMessageBoxSync
  const timer = setTimeout(() => { dialog.showMessageBoxSync = original; resolve('no prompt') }, 3000)
  dialog.showMessageBoxSync = ((_window: unknown, options: { message: string }) => {
    clearTimeout(timer); dialog.showMessageBoxSync = original; resolve(options.message); return 0
  }) as typeof dialog.showMessageBoxSync
  BrowserWindow.getAllWindows()[0].close()
}))
try {
  const page = await app.firstWindow(); page.on('pageerror', e => errors.push(e.message))
  await page.getByRole('heading', { name: 'POC 測試收藏' }).waitFor()
  assert.equal(await page.locator('.folder-card').count(), 100)
  const allRows = await page.locator('.folder-card').allTextContents()
  for (let number = 2; number <= 11; number++) {
    await page.getByRole('button', { name: String(number), exact: true }).click()
    assert.equal(await page.locator('.folder-card').count(), number === 11 ? 5 : 100)
    allRows.push(...await page.locator('.folder-card').allTextContents())
  }
  assert.equal(new Set(allRows).size, 1005)
  const inputSamples: number[] = []
  for (const query of ['測試 000', '測試 001', '作品 A', '測試 003', '測試 004', '作品 B', '測試 006', '測試 007', '測試 008', '測試 009']) {
    const start = await page.evaluate(() => performance.now())
    await page.getByRole('textbox', { name: '搜尋名稱或路徑' }).fill(query)
    await page.waitForFunction(expected => document.querySelectorAll('.folder-card').length === expected, query.startsWith('作品') ? 1 : 10)
    const end = await page.evaluate(() => new Promise<number>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))))
    inputSamples.push(end - start)
  }
  inputSamples.sort((a, b) => a - b)
  await fs.writeFile(path.join(base, 'ui-performance.json'), JSON.stringify({ rows: 1005, samples: inputSamples, p95Ms: inputSamples[9], includesAutomationAndPaint: true }, null, 2))
  await page.getByRole('textbox', { name: '搜尋名稱或路徑' }).fill('作品 A')
  assert.equal(await page.locator('.folder-card').count(), 1)
  await page.getByRole('button', { name: '詳情／編輯' }).click()
  await page.getByLabel('title', { exact: true }).fill('測試作品名稱')
  await page.getByText('尚未保存', { exact: true }).waitFor()
  assert.match(await attemptClose(), /尚未保存/)
  assert.equal(await page.getByLabel('title', { exact: true }).inputValue(), '測試作品名稱')
  await page.getByRole('button', { name: '保存共用文字' }).click()
  await page.locator('.folder-card').getByText('測試作品名稱').waitFor()
  const imageFile = path.join(root, 'cover.png')
  await fs.writeFile(imageFile, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=', 'base64'))
  await app.evaluate(({ dialog }, file) => {
    const original = dialog.showOpenDialog
    dialog.showOpenDialog = (async () => { dialog.showOpenDialog = original; return { canceled: false, filePaths: [file] } }) as typeof dialog.showOpenDialog
  }, imageFile)
  await page.getByRole('button', { name: '選擇圖片並保存原檔' }).click()
  await page.waitForFunction(() => { const image = document.querySelector('.images img') as HTMLImageElement | null; return image?.complete && image.naturalWidth === 1 })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'CELL 編輯器', exact: true }).click()
  await page.getByRole('heading', { name: 'CELL 積木編輯器' }).waitFor()
  await page.locator('.palette-item').first().dragTo(page.locator('.canvas'), { targetPosition: { x: 50, y: 250 } })
  await page.waitForFunction(() => document.querySelectorAll('.editor-cell').length === 5)
  await page.getByText('尚未保存', { exact: true }).waitFor()
  assert.match(await attemptClose(), /尚未保存/)
  await page.getByRole('button', { name: '復原', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.editor-cell').length === 4)
  await page.getByRole('button', { name: '重做', exact: true }).click()
  await page.waitForFunction(() => document.querySelectorAll('.editor-cell').length === 5)
  await fs.mkdir(path.join(base, 'screens'), { recursive: true })
  const handle = page.locator('.editor-cell').last().locator('.react-resizable-handle')
  const box = await handle.boundingBox(); assert.ok(box)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 60, { steps: 6 }); await page.mouse.up()
  assert.ok(Number(await page.getByLabel('h', { exact: true }).inputValue()) > 1)
  await page.screenshot({ path: path.join(base, 'screens', 'editor.png') })
  await page.getByRole('button', { name: '保存模板', exact: true }).click()
  await page.getByRole('heading', { name: 'POC 測試收藏' }).waitFor()
  await page.getByRole('textbox', { name: '搜尋名稱或路徑' }).fill('')
  await page.screenshot({ path: path.join(base, 'screens', 'library.png') })
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(800, 700))
  await page.waitForFunction(() => window.innerWidth <= 800)
  await page.screenshot({ path: path.join(base, 'screens', 'narrow.png') })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
  assert.equal(errors.length, 0, errors.join('\n'))
  const snapshot = await page.evaluate(() => window.media.request({ action: 'snapshot' }))
  assert.equal(snapshot.snapshot.projects[0].project!.cells.length, 5)
  const project = snapshot.snapshot.projects[0].project!
  await fs.writeFile(path.join(media, '.media-viewer', 'projects', `${project.projectId}.json`), 'corrupt fixture')
  await page.getByRole('button', { name: '重新掃描', exact: true }).click()
  const restore = page.getByRole('button', { name: '從備份復原專案', exact: true })
  await restore.waitFor()
  await page.evaluate(() => { window.confirm = () => true })
  await restore.click()
  await page.getByRole('heading', { name: 'POC 測試收藏' }).waitFor()
  console.log(`Electron UI PASS: 1005-row pagination, search p95 ${inputSamples[9].toFixed(1)}ms (automation + paint), detail/editor close guards, drag/drop, resize, save, recovery, 800px layout`)
} catch (error) {
  console.error('UI failure:', error, 'Renderer errors:', errors)
  const page = app.windows()[0]
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(base, 'ui-failure.png') }).catch(() => {})
  throw error
} finally {
  await app.evaluate(({ BrowserWindow }) => { for (const window of BrowserWindow.getAllWindows()) window.destroy() }).catch(() => {})
  await app.close().catch(() => {})
  if (!root.startsWith(base + path.sep)) throw new Error('Unsafe fixture')
  await fs.rm(root, { recursive: true, force: true })
}
