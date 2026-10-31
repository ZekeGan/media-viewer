import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { Library } from '../electron/library'
import { closeApp, launchApp } from './support/app'

const base = path.resolve('.test-output')
await fs.mkdir(base, { recursive: true })
const root = await fs.mkdtemp(path.join(base, 'settings-dock-ui-')),
  media = path.join(root, 'Dock'),
  local = path.join(root, 'local')
await fs.mkdir(path.join(media, 'Child'), { recursive: true })
await fs.writeFile(path.join(media, 'original.txt'), 'PRESERVE ORIGINAL')
const lib = new Library(local, undefined, false)
await lib.init()
await lib.create(media, {
  name: 'Dock Test',
  mediaCategory: 'other',
  scanAll: true,
  depth: { mode: 'through', level: 2 },
})
const errors: string[] = []
const launch = () => launchApp(local, errors)
const close = closeApp
let { app, page } = await launch()
const button = (name: string) => page.getByRole('button', { name, exact: true })
try {
  await button('開啟專案 Dock Test').first().click()
  await page.locator('.folder-panel-header').waitFor()
  // Default stays a drawer.
  await button('資料夾設定').click()
  await page.locator('.mantine-Drawer-content').waitFor()
  assert.equal(await page.locator('.folder-panel-dock-settings').count(), 0)
  // Dock it: settings move into the right panel and the drawer goes away.
  await button('停靠到右側面板').click()
  await page.locator('.folder-panel-dock-settings').waitFor()
  await page.locator('.mantine-Drawer-content').waitFor({ state: 'detached' })
  assert.equal(await page.getByRole('tab', { name: /^設定/ }).getAttribute('aria-selected'), 'true')
  await page.screenshot({ path: path.join(root, 'docked.png') })
  // Switch between content and settings without losing the dock.
  await page.getByRole('tab', { name: '內容', exact: true }).click()
  await page.locator('.folder-panel-dock-settings').waitFor({ state: 'detached' })
  await page.getByRole('tab', { name: /^設定/ }).click()
  await page.locator('.folder-panel-dock-settings').waitFor()
  // Narrow windows fall back to the drawer without changing the preference.
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setBounds({ width: 1000, height: 800 })
  )
  await page.locator('.mantine-Drawer-content').waitFor()
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setBounds({ width: 1500, height: 900 })
  )
  await page.locator('.folder-panel-dock-settings').waitFor()
  // The preference survives a restart.
  await close(app)
  ;({ app, page } = await launch())
  await button('開啟專案 Dock Test').first().click()
  await page.locator('.folder-panel-header').waitFor()
  await button('資料夾設定').click()
  await page.locator('.folder-panel-dock-settings').waitFor()
  assert.equal(await page.locator('.mantine-Drawer-content').count(), 0)
  // Undock again.
  await button('改為抽屜顯示設定').click()
  await page.locator('.mantine-Drawer-content').waitFor()
  assert.equal(await fs.readFile(path.join(media, 'original.txt'), 'utf8'), 'PRESERVE ORIGINAL')
  assert.deepEqual(errors, [])
  console.log(
    'PASS settings dock: default drawer, dock/undock, tab switching, narrow fallback and restart persistence. ' +
      root
  )
} catch (error) {
  await page.screenshot({ path: path.join(root, 'failure.png') }).catch(() => {})
  console.error('Artifacts: ' + root)
  throw error
} finally {
  await close(app)
}
