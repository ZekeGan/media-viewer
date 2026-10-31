import { _electron as electron } from 'playwright-core'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Library } from '../electron/library'
import { projectFile, folderFile } from '../electron/files'
import { WorkspaceStore } from '../electron/workspace'
const base = path.resolve('.test-output')
await fs.mkdir(base, { recursive: true })
const root = await fs.mkdtemp(path.join(base, 'conversion-ui-')),
  media = path.join(root, 'Media'),
  local = path.join(root, 'local')
await fs.mkdir(media)
await fs.writeFile(path.join(media, 'original.txt'), 'UNCHANGED')
const library = new Library(local, undefined, false)
await library.init()
await library.create(media, {
  name: 'Legacy conversion',
  mediaCategory: 'album',
  scanAll: true,
  depth: { mode: 'through', level: 1 },
})
const original = library.snapshot().projects[0].project!,
  file = projectFile(media, original.projectId),
  folder = await fs.readFile(folderFile(media))
const workspace = new WorkspaceStore(local, ['zh-TW'])
await workspace.init()
await workspace.update({ action: 'appearance', theme: 'glass', locale: 'zh-TW' }, [
  original.projectId,
])
const env = Object.fromEntries(
  Object.entries({ ...process.env, MEDIA_VIEWER_TEST_DATA: local }).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  )
)
delete env.ELECTRON_RUN_AS_NODE
const app = await electron.launch({ args: ['.'], env }),
  page = await app.firstWindow()
page.setDefaultTimeout(15000)
const settings = async () => {
  await page
    .getByRole('button', { name: '開啟專案 Legacy conversion', exact: true })
    .first()
    .hover()
  await page
    .getByRole('button', { name: '專案選單 Legacy conversion', exact: true })
    .first()
    .click()
  await page.getByRole('menuitem', { name: '專案設定', exact: true }).click()
  return page.getByRole('dialog', { name: '專案設定 · Legacy conversion', exact: true })
}
try {
  await page
    .getByRole('button', { name: '開啟專案 Legacy conversion', exact: true })
    .first()
    .click()
  await page.locator('.mixed-media-browser').waitFor()
  let dialog = await settings()
  const before = await fs.readFile(file)
  await dialog.getByRole('button', { name: '預覽轉換為媒體專案', exact: true }).click()
  const section = dialog
    .locator('section')
    .filter({ has: page.getByRole('button', { name: '確認轉換', exact: true }) })
  await section.getByRole('button', { name: '取消', exact: true }).click()
  assert.deepEqual(await fs.readFile(file), before)
  await dialog.getByRole('button', { name: '預覽轉換為媒體專案', exact: true }).click()
  await dialog.getByRole('button', { name: '確認轉換', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })
  assert.deepEqual(await fs.readFile(file + '.bak'), before)
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).mediaCategory, 'media')
  await page.screenshot({ path: path.join(root, 'converted.png') })
  dialog = await settings()
  await dialog.getByRole('button', { name: '恢復原分類', exact: true }).click()
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(JSON.parse(await fs.readFile(file, 'utf8')).mediaCategory, 'album')
  assert.deepEqual(await fs.readFile(folderFile(media)), folder)
  assert.equal(await fs.readFile(path.join(media, 'original.txt'), 'utf8'), 'UNCHANGED')
  console.log(
    'PASS conversion preview/cancel, backup, save and restore category; original media and folder identity preserved. ' +
      root
  )
} catch (error) {
  await page.screenshot({ path: path.join(root, 'failure.png') })
  console.error(root)
  throw error
} finally {
  await app.evaluate(({ BrowserWindow }) => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.removeAllListeners('close')
      win.webContents.on('will-prevent-unload', (event) => event.preventDefault())
    }
  })
  await app.close()
}
