// Run manually for the POC performance gate, not on every code change.
import fs from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import assert from 'node:assert/strict'
import { Library } from '../electron/library'
import { filterRows, sortRows } from '../shared/search'

const base = path.resolve('.test-output')
await fs.mkdir(base, { recursive: true })
const root = await fs.mkdtemp(path.join(base, 'performance-'))
const count = Number(process.env.POC_PERF_COUNT ?? 1000)
assert.ok([1000, 10000].includes(count))
try {
  const media = path.join(root, 'media'); await fs.mkdir(media)
  for (let i = 0; i < count; i++) await fs.mkdir(path.join(media, `漫畫 ${String(i).padStart(4, '0')}`))
  const library = new Library(path.join(root, 'local'))
  await library.init()
  const start = performance.now()
  const snapshot = await library.create(media, { name: '效能測試', mediaCategory: 'manga', depth: { mode: 'exact', level: 2 } })
  const firstScanMs = performance.now() - start
  assert.equal(snapshot.rows.length, count)
  assert.equal(snapshot.problems.length, 0)
  const rescanStart = performance.now(); await library.scan()
  const rescanMs = performance.now() - rescanStart
  const samples = []
  for (let i = 0; i < 100; i++) {
    const startQuery = performance.now()
    const matches = filterRows(sortRows(snapshot.rows), '漫畫')
    assert.equal(matches.length, count)
    samples.push(performance.now() - startQuery)
  }
  samples.sort((a, b) => a - b)
  const result = { folders: count, windowsHidden: process.platform === 'win32', firstScanMs, rescanMs, filterAndSortP95Ms: samples[94], includesUIRender: false }
  await fs.writeFile(path.join(base, `performance-${count}.json`), JSON.stringify(result, null, 2))
  console.log(result)
  assert.ok(samples[94] < 200, 'POC in-memory filter/sort target exceeded')
} finally {
  if (!root.startsWith(base + path.sep)) throw new Error('Unsafe fixture')
  await fs.rm(root, { recursive: true, force: true })
}
