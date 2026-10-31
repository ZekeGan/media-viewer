// Historical C-87 UI harness; selectors target the earlier UI. Current entry: pnpm test:ui.
import { _electron as electron } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import assert from 'node:assert/strict'
import { Library } from '../electron/library'
import { DATA_DIR } from '../shared/model'
const base = path.resolve('.test-output')
await fs.mkdir(base, { recursive: true })
const root = await fs.mkdtemp(path.join(base, 'stages23-')),
  local = path.join(root, 'local'),
  screens = path.join(base, 'stages23-screens')
await fs.mkdir(screens, { recursive: true })
const album = path.join(root, 'Album'),
  manga = path.join(root, 'Manga'),
  game = path.join(root, 'Games'),
  video = path.join(root, 'Video')
for (const folder of [
  album,
  manga,
  game,
  video,
  path.join(album, '相簿A', '子相簿'),
  path.join(album, '相簿B'),
  path.join(game, 'Unity', 'Game_Data', 'inner'),
])
  await fs.mkdir(folder, { recursive: true })
const ffmpeg = promisify(execFile)
await ffmpeg(
  'ffmpeg',
  [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=160x240:rate=1',
    '-frames:v',
    '1',
    path.join(manga, '1.png'),
  ],
  { windowsHide: true }
)
await fs.copyFile(path.join(manga, '1.png'), path.join(manga, '2.png'))
await fs.copyFile(path.join(manga, '1.png'), path.join(manga, '10.png'))
await fs.copyFile(path.join(manga, '1.png'), path.join(album, '相簿A', 'image.png'))
await ffmpeg(
  'ffmpeg',
  [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=32x32:rate=3',
    '-t',
    '1',
    '-loop',
    '0',
    path.join(album, '相簿A', 'moving.gif'),
  ],
  { windowsHide: true }
)
await ffmpeg(
  'ffmpeg',
  [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=blue:s=320x180:r=24',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:sample_rate=44100',
    '-t',
    '3',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    path.join(video, 'sample.mp4'),
  ],
  { windowsHide: true }
)
await fs.writeFile(
  path.join(video, 'sample.srt'),
  '1\n00:00:00,000 --> 00:00:02,000\nControlled subtitle\n'
)
await fs.writeFile(path.join(video, 'notes.txt'), 'ORIGINAL')
for (const name of ['Game.exe', 'UnityPlayer.dll'])
  await fs.writeFile(path.join(game, 'Unity', name), 'not executable, controlled fixture')
const lib = new Library(local, undefined, false)
await lib.init()
const input = { depth: { mode: 'through' as const, level: 3 } }
const ap = (
  await lib.create(album, { ...input, name: '相簿收藏', mediaCategory: 'album' })
).projects.at(-1)!.project!
await lib.saveProject({
  ...ap,
  fieldBindings: [...ap.fieldBindings, { attributeId: 'tags', alias: 'tag', type: 'tags' }],
})
await lib.create(manga, { ...input, name: '漫畫收藏', mediaCategory: 'manga' })
await lib.create(game, { ...input, name: '遊戲收藏', mediaCategory: 'game' })
await lib.create(video, { ...input, name: '影片收藏', mediaCategory: 'video' })
const env: Record<string, string> = Object.fromEntries(
  Object.entries({ ...process.env, MEDIA_VIEWER_TEST_DATA: local }).filter(
    (e): e is [string, string] => e[1] !== undefined
  )
)
delete env.ELECTRON_RUN_AS_NODE
const app = await electron.launch({ args: ['out/main/main.js'], env, timeout: 30000 }),
  page = await app.firstWindow(),
  errors: string[] = []
page.on('pageerror', (e) => errors.push(e.message))
page.setDefaultTimeout(12000)
const open = async (name: string) => {
  await page
    .getByRole('button', { name: `開啟專案 ${name}`, exact: true })
    .first()
    .click()
  await page.getByRole('heading', { name, exact: true }).waitFor()
}
const select = async (name: string) => {
  await page
    .locator('.folder-card')
    .filter({ has: page.locator('.cell-name').getByText(name, { exact: true }) })
    .getByRole('button', { name: '詳情／編輯', exact: true })
    .click()
  await page.locator('.folder-panel-header strong').getByText(name, { exact: true }).waitFor()
}
const group = () =>
  page
    .locator('.sidebar-section')
    .filter({ has: page.getByRole('button', { name: '收合 圖書', exact: true }) })
try {
  await page.getByRole('heading', { name: '你的資料夾，你的瀏覽方式' }).waitFor()
  assert.equal(await page.locator('.titlebar input').count(), 0)
  assert.equal(await page.locator('.app-brand').innerText(), '◫')
  await page.getByRole('button', { name: '收合 未分類', exact: true }).waitFor()
  assert.equal(await page.getByText('最近新增', { exact: true }).count(), 0)
  await page.evaluate(() => {
    window.confirm = () => true
    window.prompt = () => '常用查詢'
  })
  await page.getByRole('button', { name: '新增群組', exact: true }).click()
  await page.getByLabel('群組名稱').fill('圖書')
  await page.getByRole('button', { name: '保存群組', exact: true }).click()
  for (const name of ['相簿收藏', '漫畫收藏']) {
    await page.getByRole('button', { name: `開啟專案 ${name}`, exact: true }).hover()
    await page.getByRole('button', { name: `移動專案 ${name}`, exact: true }).click()
    await page.getByRole('menuitem', { name: '圖書', exact: true }).click()
  }
  await group().getByRole('button', { name: '開啟專案 漫畫收藏', exact: true }).hover()
  await group().getByRole('button', { name: '移動專案 漫畫收藏', exact: true }).click()
  await page.getByRole('menuitem', { name: '專案上移', exact: true }).click()
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.sidebar-section')]
        .find((s) => s.textContent?.includes('圖書'))
        ?.querySelector('.project-name')?.textContent === '漫畫收藏'
  )
  await group()
    .getByRole('button', { name: '開啟專案 相簿收藏', exact: true })
    .locator('..')
    .dragTo(group().getByRole('button', { name: '開啟專案 漫畫收藏', exact: true }).locator('..'))
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('.sidebar-section')]
        .find((s) => s.textContent?.includes('圖書'))
        ?.querySelector('.project-name')?.textContent === '相簿收藏'
  )
  await page.getByRole('button', { name: '管理群組 圖書', exact: true }).click()
  await page.getByRole('menuitem', { name: '群組上移', exact: true }).click()
  await page.waitForFunction(() =>
    document.querySelector('.sidebar-section .section-heading')?.textContent?.includes('圖書')
  )
  await page.getByRole('button', { name: '開啟搜尋', exact: true }).click()
  await page.getByRole('textbox', { name: '搜尋範圍', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await page.reload()
  await page.getByRole('heading', { name: '你的資料夾，你的瀏覽方式' }).waitFor()
  await group().waitFor()
  assert.equal(await group().locator('.project-name').first().textContent(), '相簿收藏')
  await page.screenshot({ path: path.join(screens, 'home.png') })
  console.log('PASS shell revision and manual ordering')
  await open('相簿收藏')
  await select('相簿A')
  await page.locator('.media-thumbnail img').first().waitFor()
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.media-thumbnail img')].every(
      (e) => (e as HTMLImageElement).naturalWidth > 0
    )
  )
  assert.ok((await page.locator('img[src*="media://file/"]').count()) > 0)
  await page.locator('.media-thumbnail').first().click()
  await page.getByRole('dialog', { name: '圖片檢視', exact: true }).waitFor()
  await page.getByText(/160 × 240|32 × 32/).waitFor()
  assert.equal(await page.locator('.masonry-gallery img[src*="media://file/"]').count(), 0)
  await page.getByRole('button', { name: '100%／原尺寸', exact: true }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: '圖片檢視', exact: true }).waitFor({ state: 'hidden' })
  await page.getByRole('tab', { name: '欄位／圖片', exact: true }).click()
  await page.getByRole('textbox', { name: 'tag', exact: true }).fill('收藏')
  await page.getByRole('textbox', { name: 'tag', exact: true }).press('Enter')
  await page.getByRole('button', { name: '保存欄位資料', exact: true }).click()
  await page.waitForFunction(async () => {
    const s = (await window.media.request({ action: 'snapshot' })).snapshot
    return s.rows.some(
      (r) =>
        r.name === '相簿A' &&
        r.record?.attributes.some(
          (a) => a.attributeId === 'tags' && Array.isArray(a.value) && a.value.includes('收藏')
        )
    )
  })
  await page.getByRole('textbox', { name: 'tag', exact: true }).fill('尚未保存')
  await page.getByRole('textbox', { name: 'tag', exact: true }).press('Enter')
  await page.evaluate(() => {
    window.confirm = () => false
  })
  await page.getByRole('button', { name: '返回首頁', exact: true }).click()
  await page.getByRole('heading', { name: '相簿收藏', exact: true }).waitFor()
  await page.evaluate(() => {
    window.confirm = () => true
  })
  await page
    .locator('.folder-panel-header')
    .getByRole('button', { name: '關閉', exact: true })
    .click()
  await page.getByText('TABLE', { exact: true }).click()
  await page.locator('.folder-table').waitFor()
  await page.locator('.folder-table tbody tr').filter({ hasText: '相簿A' }).dblclick()
  await page.locator('.folder-table').getByText('子相簿', { exact: true }).waitFor()
  await page.getByRole('button', { name: '父層', exact: true }).click()
  await page.locator('.folder-table').getByText('相簿B', { exact: true }).waitFor()
  await page.getByRole('button', { name: '返回', exact: true }).click()
  await page.locator('.folder-table').getByText('子相簿', { exact: true }).waitFor()
  await page.getByRole('button', { name: '前進', exact: true }).click()
  await page.getByText('TREE', { exact: true }).click()
  await page.locator('.react-flow__node').first().waitFor()
  await page.locator('.react-flow__node').filter({ hasText: '相簿A' }).click()
  await page.locator('.folder-panel-header strong').getByText('相簿A', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(screens, 'tree-album.png') })
  await page
    .locator('.folder-panel-header')
    .getByRole('button', { name: '放大內容區', exact: true })
    .click()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.expanded-details').count(), 0)
  await page.getByRole('button', { name: '開啟搜尋', exact: true }).click()
  await page.getByRole('textbox', { name: '搜尋條件', exact: true }).fill('tag:收藏')
  await page.locator('.search-results > button').filter({ hasText: '相簿A' }).waitFor()
  await page.getByRole('textbox', { name: '常用搜尋名稱', exact: true }).fill('常用查詢')
  await page.getByRole('button', { name: '保存常用搜尋', exact: true }).click()
  await page.getByRole('button', { name: '常用查詢', exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await open('漫畫收藏')
  await select('Manga')
  await page.locator('.manga-gallery .media-thumbnail').first().click()
  await page.getByRole('dialog', { name: '漫畫閱讀器', exact: true }).waitFor()
  await page.keyboard.press('d')
  assert.equal(await page.locator('.reader-pages img').count(), 2)
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.locator('.reader-pages img').count(), 1)
  await page.keyboard.press('t')
  assert.equal(await page.locator('.reader-toolbar').count(), 0)
  await page.keyboard.press('t')
  await page.screenshot({ path: path.join(screens, 'manga-reader.png') })
  await page.keyboard.press('Escape')
  await page.waitForFunction(async () => {
    const s = (await window.media.request({ action: 'snapshot' })).snapshot
    return s.rows.some((r) => r.name === 'Manga' && r.record?.details?.reading?.spread === true)
  })
  await open('遊戲收藏')
  await select('Unity')
  await page.getByText('疑似遊戲，已停止深入', { exact: true }).waitFor()
  assert.equal(
    await fs.stat(path.join(game, 'Unity', 'Game_Data', DATA_DIR)).then(
      () => true,
      () => false
    ),
    false
  )
  await page.getByRole('button', { name: '自訂工具列', exact: true }).click()
  await page.getByRole('button', { name: '加入按鈕', exact: true }).click()
  await page.getByRole('button', { name: '保存工具列版型', exact: true }).click()
  await page
    .locator('.folder-panel')
    .getByRole('button', { name: '開啟遊戲', exact: true })
    .waitFor()
  await page.screenshot({ path: path.join(screens, 'game.png') })
  await open('影片收藏')
  await select('Video')
  await page.locator('video').waitFor()
  await page.waitForFunction(() => {
    const v = document.querySelector('video')
    return !!v && v.readyState >= 1 && Number.isFinite(v.duration)
  })
  await page.evaluate(async () => {
    const v = document.querySelector('video')!
    await v.play()
  })
  await page.waitForFunction(() => document.querySelector('video')!.currentTime > 0.2)
  await page.evaluate(() => {
    document.querySelector('video')!.pause()
    document.querySelector('video')!.currentTime = 0.8
  })
  await page.waitForFunction(
    () => Math.abs(document.querySelector('video')!.currentTime - 0.8) < 0.2
  )
  await page.getByRole('button', { name: 'sample.srt', exact: true }).click()
  await page.getByText('Controlled subtitle', { exact: true }).waitFor()
  await page.getByRole('button', { name: '延後 0.1 秒', exact: true }).click()
  await page.getByRole('button', { name: '保存進度／字幕設定', exact: true }).click()
  await page.waitForFunction(async () => {
    const s = (await window.media.request({ action: 'snapshot' })).snapshot
    return s.rows.some((r) =>
      Object.values(r.record?.details?.playback ?? {}).some((p) =>
        Object.values(p.settings ?? {}).some((s) => s.offset === 0.1)
      )
    )
  })
  const media = await page.locator('video').evaluate((el) => {
    const v = el as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }
    return {
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
      audioBytes: v.webkitAudioDecodedByteCount ?? 0,
    }
  })
  assert.equal(media.width, 320)
  assert.equal(media.height, 180)
  assert.ok(media.duration > 2.5)
  assert.ok(media.audioBytes > 0, 'AAC audio decoded')
  await page.screenshot({ path: path.join(screens, 'video-subtitles.png') })
  await page
    .locator('.folder-panel-header')
    .getByRole('button', { name: '關閉', exact: true })
    .click()
  assert.equal(await page.locator('video').count(), 0)
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(800, 700))
  await page.waitForFunction(() => window.innerWidth === 800)
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false
  )
  await page.screenshot({ path: path.join(screens, 'narrow.png') })
  assert.equal(errors.length, 0, errors.join('\n'))
  assert.equal(await fs.readFile(path.join(video, 'notes.txt'), 'utf8'), 'ORIGINAL')
  console.log(
    `PASS: TABLE/TREE selection and navigation, typed values/draft protection, search/saved query, album/GIF/reader, manga spreads/keys/prefs, game boundary/templates, actual MP4 H264/AAC playback/seek/subtitles/stop, 800px; ${screens}; isolated ${root}`
  )
} catch (error) {
  await page.screenshot({ path: path.join(screens, 'failure.png') }).catch(() => {})
  throw error
} finally {
  await app
    .evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().forEach((w) => w.destroy()))
    .catch(() => {})
  await app.close().catch(() => {})
}
