import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Library } from '../electron/library'
import { atomicJson, exists, folderFile, readFolder, readJson, safePath } from '../electron/files'
import { DATA_DIR, type Project } from '../shared/model'
import { hideDirectories } from '../electron/hidden'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const base = path.resolve('.test-output'); await fs.mkdir(base, { recursive: true })
  const root = await fs.mkdtemp(path.join(base, 'library-'))
  t.after(async () => { if (!root.startsWith(base + path.sep)) throw new Error('Unsafe fixture'); await fs.rm(root, { recursive: true, force: true }) })
  const p1 = path.join(root, 'P1'), p2 = path.join(root, 'P2')
  await fs.mkdir(path.join(p1, 'A'), { recursive: true }); await fs.mkdir(path.join(p1, 'B', 'C'), { recursive: true }); await fs.mkdir(p2)
  const lib = new Library(path.join(root, 'local'), undefined, false); await lib.init()
  return { root, p1, p2, lib }
}
const input = { name: '漫畫', mediaCategory: 'manga', depth: { mode: 'through' as const, level: 2 } }

test('root and project corruption can reconnect and recover without replacing good backups', async t => {
  const { root, p1, lib } = await fixture(t)
  const s = await lib.create(p1, input), project = s.projects[0].project!
  const file = path.join(p1, DATA_DIR, 'projects', `${project.projectId}.json`)
  const backup = await fs.readFile(`${file}.bak`)
  await fs.writeFile(file, 'broken project'); await fs.writeFile(folderFile(p1), 'broken root')
  const fresh = new Library(path.join(root, 'fresh'), undefined, false); await fresh.init()
  assert.ok((await fresh.link(p1)).projects[0].error)
  const recovered = await fresh.restoreProject(project.projectId)
  assert.equal(recovered.projects[0].error, undefined)
  assert.equal(recovered.rows.length, 3)
  assert.deepEqual(await fs.readFile(`${file}.bak`), backup)
  assert.ok((await fs.readdir(path.dirname(file))).some(n => n.endsWith('.damaged')))
  await fs.writeFile(file, 'broken again')
  await fs.writeFile(`${file}.bak`, JSON.stringify({ ...project, rootFolderId: 'wrong-id' }))
  await assert.rejects(fresh.restoreProject(project.projectId), /身分不符/)
  assert.equal(await fs.readFile(file, 'utf8'), 'broken again')
})

test('failed atomic replacement leaves original readable and retry succeeds', async t => {
  const { p1, lib } = await fixture(t)
  const s = await lib.create(p1, input), row = s.rows.find(r => r.name === 'A')!
  const original = await fs.readFile(folderFile(row.path)), rename = fs.rename
  const injected = t.mock.method(fs, 'rename', async (source: any, target: any) => {
    if (String(target) === folderFile(row.path)) throw Object.assign(new Error('simulated disk full'), { code: 'ENOSPC' })
    return rename(source, target)
  })
  await assert.rejects(lib.saveValues(row.rowId, row.record!.revision, { [s.projects[0].project!.fieldBindings[0].attributeId]: 'new value' }), /disk full/)
  assert.deepEqual(await fs.readFile(folderFile(row.path)), original)
  assert.deepEqual(await fs.readFile(`${folderFile(row.path)}.bak`), original)
  injected.mock.restore()
  await lib.saveValues(row.rowId, row.record!.revision, { [s.projects[0].project!.fieldBindings[0].attributeId]: 'retry' })
  assert.equal((await readFolder(row.path)).attributes[0].value, 'retry')
})

test('cancelled scanning preserves completed records and can resume', async t => {
  const { root, p1 } = await fixture(t)
  for (let i = 0; i < 40; i++) await fs.mkdir(path.join(p1, `more-${i}`))
  let cancel = true
  const lib = new Library(path.join(root, 'cancel'), progress => { if (cancel && progress.visited >= 20) lib.cancelScan() }, false)
  await lib.init()
  const partial = await lib.create(p1, input)
  assert.equal(partial.progress.cancelled, true)
  assert.ok(partial.rows.length >= 20 && partial.rows.length <= 27)
  const identities = new Map(partial.rows.map(row => [row.path, row.record!.folderId]))
  cancel = false
  const complete = await lib.scan()
  assert.equal(complete.rows.length, 43)
  for (const row of complete.rows) if (identities.has(row.path)) assert.equal(row.record!.folderId, identities.get(row.path))
})

test('Windows hidden batching treats special characters as data and refuses junctions', { skip: process.platform !== 'win32' }, async t => {
  const { root, p1, lib } = await fixture(t)
  const special = path.join(p1, "中文 [test] & ' $name")
  await fs.mkdir(special); await lib.create(p1, input)
  const outside = path.join(root, 'outside'); await fs.mkdir(outside)
  const trap = path.join(root, 'trap'); await fs.mkdir(trap)
  await fs.symlink(outside, path.join(trap, DATA_DIR), 'junction')
  const failures = await hideDirectories([special, trap])
  assert.equal(failures.length, 1); assert.equal(failures[0].dir, trap)
  const { stdout } = await promisify(execFile)('attrib.exe', [path.join(special, DATA_DIR)])
  assert.match(stdout.slice(0, stdout.indexOf(path.parse(special).root)), /H/)
  const hiddenLibrary = new Library(path.join(root, 'hidden-local'))
  await hiddenLibrary.init(); const linked = await hiddenLibrary.link(p1)
  const row = linked.rows.find(r => r.name === 'A')!
  const preview = await hiddenLibrary.previewCleanup(row.rowId)
  await hiddenLibrary.cleanup(preview.token, false)
  await hiddenLibrary.resume(row.rowId)
  const resumed = await promisify(execFile)('attrib.exe', [path.join(row.path, DATA_DIR)])
  assert.match(resumed.stdout.slice(0, resumed.stdout.indexOf(path.parse(row.path).root)), /H/)
})

test('Windows denied-write ACL reports the row and scan continues', { skip: process.platform !== 'win32' }, async t => {
  const { p1, lib } = await fixture(t), target = path.join(p1, 'A'), exec = promisify(execFile)
  const { stdout } = await exec('whoami.exe', ['/user', '/fo', 'csv', '/nh'])
  const sid = stdout.match(/S-1-[\d-]+/)?.[0]; assert.ok(sid)
  await exec('icacls.exe', [target, '/deny', `*${sid}:(W)`])
  try {
    const s = await lib.create(p1, input)
    assert.ok(s.rows.find(r => r.name === 'A')!.error)
    assert.ok(s.rows.find(r => r.name === 'B')!.record)
    assert.equal(await exists(folderFile(target)), false)
  } finally { await exec('icacls.exe', [target, '/remove:d', `*${sid}`]) }
  assert.ok((await lib.scan()).rows.find(r => r.name === 'A')!.record)
})

test('legacy string import backs up originals and retry preserves user edits', async t => {
  const { root, p1, lib } = await fixture(t)
  const base = path.join(root, 'local', 'app-data')
  const write = async (file: string, value: unknown) => {
    const target = path.join(base, file); await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, JSON.stringify(value))
  }
  await write('view.json', [{ id: 'old-view', name: '舊收藏', targetFolderPath: p1 }])
  await write('viewColumn/old-view.json', ['title'])
  await write('column/title.json', { id: 'old-column', dataSource: 'USER', dataType: 'STRING' })
  await write('viewFolder/old-view.json', ['old-folder'])
  await write('folder/old-folder.json', { lastReadPath: path.join(p1, 'A'), cells: [{ key: 'title', value: '舊作品' }] })
  let preview = await lib.previewLegacy()
  await lib.importLegacy(preview.token, ['old-view'], input.depth)
  let s = lib.snapshot(), a = s.rows.find(r => r.name === 'A')!
  const id = s.projects[0].project!.fieldBindings[0].attributeId
  assert.equal(a.record!.attributes.find(v => v.attributeId === id)!.value, '舊作品')
  await lib.saveValues(a.rowId, a.record!.revision, { [id]: '手動修正' })
  preview = await lib.previewLegacy(); await lib.importLegacy(preview.token, ['old-view'], input.depth)
  s = lib.snapshot(); a = s.rows.find(r => r.name === 'A')!
  assert.equal(s.projects.length, 1)
  assert.equal(a.record!.attributes.find(v => v.attributeId === id)!.value, '手動修正')
  assert.equal((await fs.readdir(path.join(root, 'local', 'legacy-backups'))).length, 2)
  assert.equal((await readJson(path.join(base, 'folder/old-folder.json')) as any).cells[0].value, '舊作品')
})

test('depth modes, portable values, templates, fresh-device reconnect and images', async t => {
  const { root, p1, p2, lib } = await fixture(t)
  let s = await lib.create(p1, input), p = s.projects[0].project!
  assert.deepEqual(s.rows.map(r => r.name).sort(), ['A', 'B', 'P1'])
  s = await lib.saveProject({ ...p, depth: { mode: 'exact', level: 3 } })
  assert.deepEqual(s.rows.map(r => r.name), ['C']); assert.ok(await readFolder(path.join(p1, 'B')))
  p = s.projects[0].project!
  s = await lib.saveProject({ ...p, depth: input.depth }); p = s.projects[0].project!
  let a = s.rows.find(r => r.name === 'A')!, field = p.fieldBindings[0].attributeId
  s = await lib.saveValues(a.rowId, a.record!.revision, { [field]: '可攜作品 A' })
  a = s.rows.find(r => r.name === 'A')!
  const image = path.join(root, 'cover.png'), bytes = Buffer.from('89504e470d0a1a0a00000000', 'hex')
  await fs.writeFile(image, bytes); s = await lib.addImage(a.rowId, a.record!.revision, image)
  a = s.rows.find(r => r.name === 'A')!; const originalId = a.record!.folderId
  await lib.create(p2, { ...input, name: '目的專案' }); await fs.rename(path.join(p1, 'A'), path.join(p2, 'A'))
  s = await lib.scan(); a = s.rows.find(r => r.name === 'A')!
  assert.equal(a.record!.folderId, originalId); assert.equal(a.record!.attributes[0].value, '可攜作品 A')
  assert.notEqual(s.projects[1].project!.fieldBindings[0].attributeId, field)
  const asset = await lib.asset(a.rowId, a.record!.assets[0].assetId); assert.deepEqual(await fs.readFile(asset.file), bytes)
  const newDevice = new Library(path.join(root, 'fresh-device'), undefined, false)
  await newDevice.init(); s = await newDevice.link(p2)
  assert.equal(s.rows.find(r => r.name === 'A')!.record!.folderId, originalId)
  assert.equal(s.projects[0].project!.cells.length, 4)
})

test('revision conflicts and interrupted writes preserve saved record; backup restores corrupt data', async t => {
  const { p1, lib } = await fixture(t)
  let s = await lib.create(p1, input), a = s.rows.find(r => r.name === 'A')!, field = s.projects[0].project!.fieldBindings[0].attributeId
  const revision = a.record!.revision
  s = await lib.saveValues(a.rowId, revision, { [field]: '已保存' }); a = s.rows.find(r => r.name === 'A')!
  await assert.rejects(lib.saveValues(a.rowId, revision, { [field]: '舊草稿' }), /版本/)
  assert.equal((await readFolder(a.path)).attributes[0].value, '已保存')
  await fs.writeFile(`${folderFile(a.path)}.unfinished.tmp`, '{ partial')
  s = await lib.scan(); assert.equal(s.rows.find(r => r.name === 'A')!.record!.attributes[0].value, '已保存')
  await lib.saveValues(a.rowId, a.record!.revision, { [field]: '下一版' })
  await fs.writeFile(folderFile(a.path), '{broken')
  s = await lib.scan(); a = s.rows.find(r => r.name === 'A')!; assert.ok(a.error)
  await assert.rejects(lib.saveValues(a.rowId, 3, { [field]: '不要覆寫' }))
  s = await lib.restore(a.rowId); assert.equal(s.rows.find(r => r.name === 'A')!.record!.attributes[0].value, '已保存')
  assert.ok((await fs.readdir(path.join(a.path, DATA_DIR))).some(n => n.endsWith('.damaged')))
})

test('O80 cleanup excludes overlapping projects, portable exclusions and moved fresh identity', async t => {
  const { root, p1, p2, lib } = await fixture(t)
  await fs.writeFile(path.join(p1, 'A', 'original.txt'), 'original media')
  await lib.create(p1, input); await lib.create(p1, { ...input, name: '同根第二專案' }); let s = await lib.create(p2, input)
  const a = s.rows.find(r => r.name === 'A')!, oldId = a.record!.folderId
  const preview = await lib.previewCleanup(a.rowId); assert.equal(preview.count, 1)
  await lib.cleanup(preview.token, false); s = lib.snapshot()
  assert.equal(s.rows.filter(r => r.name === 'A' && r.stopped).length, 2)
  assert.equal(await exists(folderFile(a.path)), false); assert.equal(await fs.readFile(path.join(a.path, 'original.txt'), 'utf8'), 'original media')
  const fresh = new Library(path.join(root, 'fresh'), undefined, false); await fresh.init(); s = await fresh.link(p1)
  assert.ok(s.rows.filter(r => r.name === 'A').every(r => r.stopped))
  await fs.rename(path.join(p1, 'A'), path.join(p2, 'A')); s = await lib.scan()
  const moved = s.rows.find(r => r.name === 'A')!
  assert.notEqual(moved.record!.folderId, oldId); assert.equal(moved.record!.attributes.length, 0)
  assert.ok(s.projects.filter(p => p.root === p1).every(p => !p.project!.excludedRelativePaths.length))
})

test('cleanup preview refuses changed data and never deletes unknown files or originals', async t => {
  const { p1, lib } = await fixture(t)
  let s = await lib.create(p1, input), a = s.rows.find(r => r.name === 'A')!
  const preview = await lib.previewCleanup(a.rowId)
  await lib.saveValues(a.rowId, a.record!.revision, { [s.projects[0].project!.fieldBindings[0].attributeId]: 'changed' })
  await assert.rejects(lib.cleanup(preview.token, false), /預覽後資料已變更/)
  await fs.writeFile(path.join(a.path, DATA_DIR, 'unrelated.txt'), 'keep me')
  await fs.writeFile(path.join(a.path, 'game.dat'), 'original')
  const all = await lib.previewCleanup(undefined, 'all'); assert.ok(all.skipped.some(s => s.includes('unrelated.txt')))
  const result = await lib.cleanup(all.token, false)
  assert.equal(result.failed.length, 0); assert.equal(lib.snapshot().projects.length, 0)
  assert.equal(await fs.readFile(path.join(a.path, DATA_DIR, 'unrelated.txt'), 'utf8'), 'keep me')
  assert.equal(await fs.readFile(path.join(a.path, 'game.dat'), 'utf8'), 'original')
  assert.equal(await exists(folderFile(a.path)), false)
})

test('duplicate IDs block writes until explicit copy resolution', async t => {
  const { p1, lib } = await fixture(t)
  await lib.create(p1, input)
  await fs.cp(path.join(p1, 'A'), path.join(p1, 'copy'), { recursive: true })
  let s = await lib.scan(), copies = s.rows.filter(r => r.duplicate)
  assert.equal(copies.length, 2)
  await assert.rejects(lib.saveValues(copies[0].rowId, copies[0].record!.revision, {}))
  s = await lib.copyIdentity(copies.find(r => r.name === 'copy')!.rowId)
  assert.equal(s.rows.filter(r => r.duplicate).length, 0)
})

test('foreign metadata and junctions are not followed or overwritten', async t => {
  const { root, p1, lib } = await fixture(t)
  const foreign = path.join(p1, 'A', DATA_DIR); await fs.mkdir(foreign); await fs.writeFile(path.join(foreign, 'mine.txt'), 'foreign')
  const outside = path.join(root, 'outside'); await fs.mkdir(outside)
  await fs.symlink(outside, path.join(p1, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
  const s = await lib.create(p1, input)
  assert.ok(s.rows.find(r => r.name === 'A')!.error)
  assert.equal(await exists(path.join(outside, DATA_DIR)), false)
  await assert.rejects(safePath(p1, path.join(p1, 'linked', 'payload')))
  const preview = await lib.previewCleanup(undefined, 'all'); assert.ok(preview.skipped.some(s => s.includes('A')))
  await lib.cleanup(preview.token, false)
  assert.equal(await fs.readFile(path.join(foreign, 'mine.txt'), 'utf8'), 'foreign')
})

test('project writes reject overlapping cells and preserve external revision changes', async t => {
  const { p1, lib } = await fixture(t)
  const s = await lib.create(p1, input), p = s.projects[0].project!
  const bad = structuredClone(p); bad.cells[1].grid = { ...bad.cells[0].grid }
  await assert.rejects(lib.saveProject(bad), /重疊/)
  const file = path.join(p1, DATA_DIR, 'projects', `${p.projectId}.json`)
  await atomicJson(file, { ...p, revision: 2, name: '外部修改' }, 1)
  await assert.rejects(lib.saveProject({ ...p, name: '舊草稿' }), /版本/)
  assert.equal((await readJson(file) as Project).name, '外部修改')
})
