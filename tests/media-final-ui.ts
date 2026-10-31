// Historical C-87 UI harness; selectors target the earlier UI. Current entry: pnpm test:ui.
import { _electron as electron } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { Library } from '../electron/library'
const base = path.resolve('.test-output')
await fs.mkdir(base, { recursive: true })
const root = await fs.mkdtemp(path.join(base, 'media-final-')),
  local = path.join(root, 'local'),
  manga = path.join(root, 'Manga'),
  video = path.join(root, 'Video')
await fs.mkdir(manga)
await fs.mkdir(video)
const exec = promisify(execFile)
await exec(
  'ffmpeg',
  [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=80x120:rate=1',
    '-frames:v',
    '1',
    path.join(manga, '1.png'),
  ],
  { windowsHide: true }
)
await exec(
  'ffmpeg',
  [
    '-v',
    'error',
    '-f',
    'lavfi',
    '-i',
    'color=c=green:s=160x90:r=12',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=400:sample_rate=48000',
    '-t',
    '2',
    '-c:v',
    'libvpx-vp9',
    '-c:a',
    'libopus',
    path.join(video, 'sample.webm'),
  ],
  { windowsHide: true }
)
const subtitle = path.join(root, 'external.srt')
await fs.writeFile(subtitle, '1\n00:00:00,000 --> 00:00:01,500\nExternal subtitle\n')
const lib = new Library(local, undefined, false)
await lib.init()
await lib.create(manga, {
  name: '漫畫',
  mediaCategory: 'manga',
  depth: { mode: 'through', level: 1 },
})
await lib.create(video, {
  name: '影片',
  mediaCategory: 'video',
  depth: { mode: 'through', level: 1 },
})
const env: Record<string, string> = Object.fromEntries(
  Object.entries({ ...process.env, MEDIA_VIEWER_TEST_DATA: local }).filter(
    (e): e is [string, string] => e[1] !== undefined
  )
)
delete env.ELECTRON_RUN_AS_NODE
const app = await electron.launch({ args: ['out/main/main.js'], env }),
  page = await app.firstWindow(),
  errors: string[] = []
page.on('pageerror', (e) => errors.push(e.message))
page.setDefaultTimeout(15000)
try {
  await page.getByRole('button', { name: '開啟專案 漫畫', exact: true }).click()
  await page.getByRole('button', { name: '詳情／編輯', exact: true }).click()
  await page.locator('.media-thumbnail').first().click()
  await page.waitForFunction(() => {
    const el = document.querySelector<HTMLImageElement>('.reader-pages img')
    return !!el && el.naturalHeight > 0
  })
  const fit = await page.locator('.reader-pages img').evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    natural: (el as HTMLImageElement).naturalHeight,
  }))
  assert.ok(fit.height > fit.natural * 2, 'height fit scales small images into available viewport')
  await page.getByRole('button', { name: '寬度適應', exact: true }).hover()
  await page.getByRole('tooltip').filter({ hasText: 'W' }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '開啟專案 影片', exact: true }).click()
  await page.getByRole('button', { name: '詳情／編輯', exact: true }).click()
  await page.waitForFunction(() => {
    const v = document.querySelector('video')
    return !!v && v.readyState >= 1
  })
  await page.evaluate(async () => {
    await document.querySelector('video')!.play()
  })
  await page.waitForFunction(() => document.querySelector('video')!.currentTime > 0.2)
  const decoded = await page.locator('video').evaluate((el) => {
    const v = el as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }
    return { width: v.videoWidth, audio: v.webkitAudioDecodedByteCount ?? 0 }
  })
  assert.equal(decoded.width, 160)
  assert.ok(decoded.audio > 0)
  const range = await page.evaluate(async () => {
    const url = document.querySelector('video')!.currentSrc
    const r = await fetch(url, { headers: { Range: 'bytes=0-63' } })
    return {
      status: r.status,
      size: (await r.arrayBuffer()).byteLength,
      range: r.headers.get('Content-Range'),
    }
  })
  assert.equal(range.status, 206)
  assert.equal(range.size, 64)
  await page.evaluate(() => {
    document.querySelector('video')!.pause()
    const input = document.createElement('input')
    input.type = 'file'
    input.id = 'controlled-file'
    input.style.display = 'none'
    document.body.append(input)
  })
  await page.locator('#controlled-file').setInputFiles(subtitle)
  const transfer = await page.evaluateHandle(() => {
    const data = new DataTransfer()
    data.items.add((document.querySelector('#controlled-file') as HTMLInputElement).files![0])
    return data
  })
  await page.locator('.video-stage').dispatchEvent('drop', { dataTransfer: transfer })
  await page.getByText(/external.srt（本次臨時來源）/).waitFor()
  await page.getByRole('button', { name: '匯入字幕可攜副本', exact: true }).click()
  await page.getByText(/external.srt（資料夾內來源）/).waitFor()
  assert.equal(
    await fs.readFile(subtitle, 'utf8'),
    '1\n00:00:00,000 --> 00:00:01,500\nExternal subtitle\n'
  )
  const denied = await app.evaluate(async ({ BrowserWindow }, preload) => {
    const child = new BrowserWindow({
      show: false,
      webPreferences: { preload, contextIsolation: true, sandbox: true },
    })
    try {
      await child.loadURL('about:blank')
      return await child.webContents.executeJavaScript(
        'window.explorer.request({action:"search",query:""}).then(()=>"ALLOWED",e=>String(e))'
      )
    } finally {
      child.destroy()
    }
  }, path.resolve('out/preload/preload.cjs'))
  assert.match(denied, /拒絕未授權/)
  assert.equal(errors.length, 0, errors.join('\n'))
  console.log(
    `PASS: height fit/shortcut tooltip, actual WebM VP9/Opus decode, browser Range 206, native-file subtitle drag/import and original unchanged, unauthorized explorer IPC rejected; isolated ${root}`
  )
} catch (e) {
  await page.screenshot({ path: path.join(base, 'media-final-failure.png') }).catch(() => {})
  throw e
} finally {
  await app
    .evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().forEach((w) => w.destroy()))
    .catch(() => {})
  await app.close().catch(() => {})
}
