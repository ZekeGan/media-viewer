import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {Library} from '../electron/library'
import {WorkspaceStore} from '../electron/workspace'
import {ensureFolder,exists,folderFile,projectFile} from '../electron/files'
import {DATA_DIR,validateProject} from '../shared/model'
import {browserRows} from '../shared/browse'
import {saveCardPreset} from '../shared/layouts'
async function fixture(t:{after:(fn:()=>Promise<void>)=>void}){
 const base=path.resolve('.test-output');await fs.mkdir(base,{recursive:true});const root=await fs.mkdtemp(path.join(base,'revision-')),media=path.join(root,'media');await fs.mkdir(media)
 t.after(async()=>{const target=await fs.realpath(root);assert.ok(target.startsWith(base+path.sep));await fs.rm(target,{recursive:true,force:true})})
 const lib=new Library(path.join(root,'local'),undefined,false);await lib.init();return{root,media,lib}
}
test('all-depth inventory and independent CARD/TREE/TABLE display; presets keep density',async t=>{
 const{media,lib}=await fixture(t);await fs.mkdir(path.join(media,'A','B','C'),{recursive:true})
 const s=await lib.create(media,{name:'All',mediaCategory:'album',depth:{mode:'through',level:1},scanAll:true}),p=s.projects[0].project!,rows=s.structure!
 assert.equal(rows.length,4);assert.deepEqual(p.cardView,{mode:'multi',level:'all'})
 const single={...p,cardView:{mode:'single' as const,level:2}}
 assert.deepEqual(browserRows(rows,single,media,'CARD','').map(r=>r.name),['A'])
 assert.deepEqual(browserRows(rows,single,media,'CARD',path.join(media,'A')).map(r=>r.name),['B'])
 assert.equal(browserRows(rows,single,media,'TREE','').length,4)
 assert.deepEqual(browserRows(rows,single,media,'TABLE','').map(r=>r.name),['A'])
 assert.equal(browserRows(rows,{...p,cardView:{mode:'multi',level:2}},media,'CARD','').length,2)
 const changed=saveCardPreset({...single,list:{itemsPerRow:3,pageSize:20}},{name:'Second',asNew:true},()=> 'second',p)
 assert.deepEqual(changed.cardView,single.cardView);assert.equal(changed.list.pageSize,20);validateProject(changed)
 const before=await fs.readFile(projectFile(media,p.projectId),'utf8');await lib.saveProject(changed)
 assert.equal(await fs.readFile(projectFile(media,p.projectId)+'.bak','utf8'),before)
 await assert.rejects(lib.saveProject(changed),/衝突/)
 assert.throws(()=>validateProject({...p,cardView:{mode:'single',level:'all'}}))
 assert.throws(()=>validateProject({...p,layoutPresets:[{id:'one',name:'A',cells:p.cells},{id:'two',name:'a',cells:p.cells}],activeLayoutId:'one'}))
})
test('navigation reads existing records beyond legacy depth without initializing missing or damaged records',async t=>{
 const{media,lib}=await fixture(t),a=path.join(media,'A'),b=path.join(a,'B');await fs.mkdir(b,{recursive:true})
 let s=await lib.create(media,{name:'Legacy',mediaCategory:'album',depth:{mode:'through',level:1}}),p=s.projects[0].project!
 assert.equal(await exists(path.join(a,DATA_DIR)),false)
 await lib.saveProject({...p,cardView:{mode:'multi',level:'all'}});assert.equal(await exists(path.join(a,DATA_DIR)),false)
 s=await lib.visit(s.rows[0].rowId);const child=s.structure!.find(r=>r.name==='A')!
 await assert.rejects(lib.visit(child.rowId),/尚未建立/);assert.equal(await exists(path.join(a,DATA_DIR)),false)
 await ensureFolder(a,false);s=await lib.visit(child.rowId);assert.ok(s.structure!.find(r=>r.name==='A')!.record);assert.equal(await exists(path.join(b,DATA_DIR)),false)
 await fs.writeFile(folderFile(a),'{ broken');await assert.rejects(lib.visit(child.rowId));assert.equal(await fs.readFile(folderFile(a),'utf8'),'{ broken')
})
test('game root opens but protected children never gain records through navigation',async t=>{
 const{media,lib}=await fixture(t),game=path.join(media,'Game'),internal=path.join(game,'Game_Data');await fs.mkdir(internal,{recursive:true});await fs.writeFile(path.join(game,'Game.exe'),'ORIGINAL');await fs.writeFile(path.join(game,'UnityPlayer.dll'),'ORIGINAL')
 let s=await lib.create(media,{name:'Games',mediaCategory:'game',depth:{mode:'through',level:1},scanAll:true});const root=s.structure!.find(r=>r.name==='Game')!;assert.ok(root.boundary)
 s=await lib.visit(root.rowId);const child=s.structure!.find(r=>r.path===internal)!
 await assert.rejects(lib.visit(child.rowId),/遊戲邊界保護/);assert.equal(await exists(path.join(internal,DATA_DIR)),false);assert.equal(await fs.readFile(path.join(game,'Game.exe'),'utf8'),'ORIGINAL')
})
test('fractional Windows resize values normalize; invalid updates preserve settings and reload',async t=>{
 const{root}=await fixture(t),store=new WorkspaceStore(path.join(root,'workspace'));await store.init();await store.read(['p'])
 const value={mode:'TREE' as const,location:'',widths:{name:220.25},panelWidth:420.5,panelVisible:false,detailId:'row',locations:{TABLE:'C:/media'},viewport:{x:.5,y:.25,zoom:.8}}
 const saved=await store.update({action:'browse',projectId:'p',value},['p']);assert.equal(saved.prefs.browse!.p.panelWidth,421);assert.equal(saved.prefs.browse!.p.widths.name,220)
 const before=await fs.readFile(store.file,'utf8');await assert.rejects(store.update({action:'browse',projectId:'p',value:{...value,panelWidth:-1}},['p']));assert.equal(await fs.readFile(store.file,'utf8'),before)
 const reload=new WorkspaceStore(path.dirname(store.file));await reload.init();assert.equal((await reload.read(['p'])).prefs.browse!.p.panelVisible,false)
})
test('Windows all-depth scans never enter case-renamed metadata directories', {skip:process.platform!=='win32'},async t=>{
 const{media,lib}=await fixture(t);let s=await lib.create(media,{name:'Case',mediaCategory:'other',depth:{mode:'through',level:1},scanAll:true})
 const source=path.resolve(media,DATA_DIR),target=path.resolve(media,DATA_DIR.toUpperCase());assert.ok(source.startsWith(media+path.sep)&&target.startsWith(media+path.sep))
 await fs.rename(source,target);s=await lib.scan();assert.equal(s.rows.length,1);assert.equal(await exists(path.join(target,DATA_DIR)),false)
 await lib.visit(s.rows[0].rowId);assert.equal(lib.snapshot().structure!.length,1)
})
