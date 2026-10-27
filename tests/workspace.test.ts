import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { WorkspaceStore } from '../electron/workspace'
import { sectionProjects, sectionIds, type WorkspaceCommand } from '../shared/workspace'
const unclassified=(ids:string[],prefs:Parameters<typeof sectionProjects>[1])=>sectionProjects(ids,prefs,'unclassified')

async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const base = path.resolve('.test-output'); await fs.mkdir(base, { recursive: true })
  const root = await fs.mkdtemp(path.join(base, 'workspace-'))
  t.after(async () => { const target = await fs.realpath(root); if (!target.startsWith(base + path.sep)) throw new Error('Unsafe test cleanup'); await fs.rm(target, { recursive: true, force: true }) })
  const store = new WorkspaceStore(root); await store.init(); return { root, store }
}
test('sidebar classification, favorite, deletion and layout survive reload without losing placement', async t => {
  const { root, store } = await fixture(t), ids = ['p1', 'p2']
  let s = await store.read(ids)
  assert.deepEqual(unclassified(ids, s.prefs), ['p1', 'p2'])
  s = await store.update({ action: 'createGroup', name: '動作遊戲' }, ids)
  const id = s.prefs.groups[0].id
  await store.update({ action: 'moveProject', projectId: 'p2', groupId: id }, ids)
  await store.update({ action: 'favorite', projectId: 'p1', value: true }, ids)
  await store.update({ action: 'collapseGroup', id, value: true }, ids)
  await store.update({ action: 'layout', sidebarWidth: 310, sidebarHidden: true }, ids)
  const reopened = new WorkspaceStore(root); await reopened.init(); s = await reopened.read(ids)
  assert.equal(s.prefs.sidebarWidth, 310); assert.equal(s.prefs.sidebarHidden, true)
  assert.equal(s.prefs.groups[0].collapsed, true); assert.deepEqual(unclassified(ids, s.prefs), ['p1'])
  s = await reopened.update({ action: 'removeGroup', id }, ids)
  assert.equal(s.prefs.projects.p1.favorite, true); assert.equal(s.prefs.projects.p2.groupId, null)
  assert.deepEqual(unclassified(ids, s.prefs), ['p1','p2'])
  s = await reopened.update({ action: 'favorite', projectId: 'p1', value: false }, ids)
  assert.deepEqual(unclassified(ids, s.prefs), ['p1','p2'])
})
test('invalid commands do not persist and queued updates retain both results', async t => {
  const { store } = await fixture(t), ids = ['p1']
  await store.read(ids)
  await Promise.all([store.update({ action: 'createGroup', name: 'A' }, ids), store.update({ action: 'createGroup', name: 'B' }, ids)])
  const before = await fs.readFile(store.file, 'utf8')
  for (const command of [{ action: 'createGroup', name: 'a' }, { action: 'createGroup', name: '\n' }, { action: 'moveProject', projectId: 'p1', groupId: 'missing' }, { action: 'favorite', projectId: 'unknown', value: true }, { action: 'layout', sidebarWidth: 900 }, { action: 'collapseSection', section: '__proto__', value: true }, { action: 'execute' }]) {
    await assert.rejects(store.update(command as WorkspaceCommand, ids))
    assert.equal(await fs.readFile(store.file, 'utf8'), before)
  }
  assert.equal((await store.read(ids)).prefs.groups.length, 2)
})

test('manual group/project order persists; favorites remain independent from unclassified',async t=>{
  const {root,store}=await fixture(t),ids=['p1','p2','p3'];await store.read(ids)
  let state=await store.update({action:'createGroup',name:'G'},ids);const id=state.prefs.groups[0].id
  await store.update({action:'favorite',projectId:'p1',value:true},ids)
  await store.update({action:'reorderProject',projectId:'p3',sectionId:'unclassified',beforeId:'p1'},ids)
  await store.update({action:'moveProject',projectId:'p2',groupId:id},ids)
  await store.update({action:'moveProject',projectId:'p3',groupId:id,beforeId:'p2'},ids)
  await store.update({action:'reorderSections',ids:['unclassified',id,'favorites']},ids)
  const reopened=new WorkspaceStore(root);await reopened.init();state=await reopened.read(ids)
  assert.deepEqual(sectionIds(state.prefs),['unclassified',id,'favorites']);assert.deepEqual(sectionProjects(ids,state.prefs,id),['p3','p2']);assert.deepEqual(unclassified(ids,state.prefs),['p1']);assert.deepEqual(sectionProjects(ids,state.prefs,'favorites'),['p1'])
  const added=await reopened.update({action:'createGroup',name:'G2'},ids);assert.deepEqual(sectionIds(added.prefs).filter(v=>v!=='favorites'&&v!=='unclassified'&&v!==id).length,1);assert.deepEqual(sectionIds(added.prefs).filter(v=>['favorites','unclassified',id].includes(v)),['unclassified',id,'favorites'])
  const view={mode:'TREE' as const,location:'',widths:{name:220},panelWidth:400,scrolls:{CARD:120,TABLE:50},viewport:{x:10,y:20,zoom:.8}};await reopened.update({action:'browse',projectId:'p1',value:view},ids);const reload=new WorkspaceStore(root);await reload.init();assert.deepEqual((await reload.read(ids)).prefs.browse?.p1,view)
  await assert.rejects(reopened.update({action:'reorderSections',ids:['favorites','favorites']},ids));await assert.rejects(reopened.update({action:'reorderProject',projectId:'p1',sectionId:id,beforeId:'p3'},ids))
})
test('real write failure leaves previous disk and memory state intact', async t => {
  const { store } = await fixture(t), ids = ['p1']; await store.read(ids)
  const before = await fs.readFile(store.file, 'utf8')
  await fs.unlink(`${store.file}.bak`); await fs.mkdir(`${store.file}.bak`)
  await assert.rejects(store.update({ action: 'favorite', projectId: 'p1', value: true }, ids))
  assert.equal(await fs.readFile(store.file, 'utf8'), before)
  assert.equal((await store.read(ids)).prefs.projects.p1.favorite, false)
})
test('corrupt UI settings remain untouched while projects can still be displayed', async t => {
  const { root, store } = await fixture(t); await fs.writeFile(store.file, '{ broken')
  const reopened = new WorkspaceStore(root); await reopened.init()
  const state = await reopened.read(['p1']); assert.match(state.error!, /原檔保留/)
  assert.equal(state.prefs.projects.p1.favorite, false)
  await assert.rejects(reopened.update({ action: 'createGroup', name: 'new' }, ['p1']))
  assert.equal(await fs.readFile(store.file, 'utf8'), '{ broken')
})
