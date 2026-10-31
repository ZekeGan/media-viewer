import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { Library } from '../electron/library'
import { projectFile, readJson } from '../electron/files'
import type { Cell, Project } from '../shared/model'
import { closeApp, launchApp } from './support/app'

const base = path.resolve('.test-output')
await fs.mkdir(base, { recursive: true })
const root = await fs.mkdtemp(path.join(base, 'cell-group-ui-')),
  media = path.join(root, 'Groups'),
  local = path.join(root, 'local')
await fs.mkdir(media)
await fs.writeFile(path.join(media, 'original.txt'), 'PRESERVE ORIGINAL')
const lib = new Library(local, undefined, false)
await lib.init()
await lib.create(media, {
  name: 'Group Test',
  mediaCategory: 'other',
  scanAll: true,
  depth: { mode: 'through', level: 1 },
})
const project = lib.snapshot().projects[0].project!,
  style = { textColor: '#e4e6e8', backgroundColor: 'transparent' }
const text = (cellId: string, y: number): Cell => ({
  cellId,
  kind: 'static-text',
  text: cellId,
  grid: { x: 0, y, w: 12, h: 1 },
  style,
})
const cells: Cell[] = [
  {
    cellId: 'group',
    kind: 'group',
    grid: { x: 0, y: 0, w: 12, h: 3 },
    style,
    cells: [text('inner-one', 0), text('inner-two', 1)],
  },
  text('outer', 3),
]
await lib.saveProject({
  ...project,
  cells,
  layoutPresets: [{ id: 'default', name: 'Default', cells }],
  activeLayoutId: 'default',
})
const errors: string[] = []
const { app, page } = await launchApp(local, errors)
const button = (name: string) => page.getByRole('button', { name, exact: true })
try {
  await button('開啟專案 Group Test').first().click()
  const card = page.locator('.folder-card').first()
  await card.getByText('inner-two', { exact: true }).waitFor()
  assert.equal(await card.locator('.cell-group .card-cell').count(), 2)
  await button('更改樣式').click()
  await page.locator('.editor-cell').first().waitFor()
  assert.equal(await page.locator('.editor-cell').count(), 2)
  await page.locator('.editor-cell').first().dblclick()
  await page.locator('.group-editing-bar').waitFor()
  assert.ok(
    await page.locator('.canvas.group-editing').count(),
    'group editing is visibly distinct'
  )
  assert.match(
    await page.locator('.group-editing-bar').innerText(),
    /剩餘 \d+ 列/,
    'capacity shown'
  )
  assert.equal(await page.locator('.editor-cell').count(), 2, 'inner level shows the two children')
  assert.equal(
    await page.locator('.basic-palette').getByRole('button', { name: '群組', exact: true }).count(),
    0,
    'no nested groups'
  )
  await page
    .locator('.basic-palette')
    .getByRole('button', { name: '固定文字', exact: true })
    .click()
  assert.equal(await page.locator('.editor-cell').count(), 3)
  await page
    .locator('.basic-palette')
    .getByRole('button', { name: '固定文字', exact: true })
    .click()
  await page.getByRole('alert').filter({ hasText: '群組空間不足' }).waitFor()
  assert.equal(
    await page.locator('.editor-cell').count(),
    3,
    'a cell outside the group bounds is refused'
  )
  await page.screenshot({ path: path.join(root, 'group-inner.png') })
  await button('← 返回上層').click()
  await page.locator('.group-editing-bar').waitFor({ state: 'detached' })
  assert.equal(await page.locator('.editor-cell').count(), 2)
  await button('儲存變更').click()
  await page.locator('.editor-page').waitFor({ state: 'hidden' })
  const saved = (await readJson(projectFile(media, project.projectId))) as Project
  assert.equal(saved.cells.find((c) => c.cellId === 'group')!.cells!.length, 3)
  assert.equal(saved.cells.length, 2)
  await card.getByText('inner-two', { exact: true }).waitFor()
  assert.equal(await card.locator('.cell-group .card-cell').count(), 3)
  assert.equal(await fs.readFile(path.join(media, 'original.txt'), 'utf8'), 'PRESERVE ORIGINAL')
  assert.deepEqual(errors, [])
  console.log('PASS cell groups: render, enter/leave, one level only, bounds, save/reopen. ' + root)
} catch (error) {
  await page.screenshot({ path: path.join(root, 'failure.png') }).catch(() => {})
  console.error('Artifacts: ' + root)
  throw error
} finally {
  await closeApp(app)
}
