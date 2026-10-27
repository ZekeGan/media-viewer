import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {Library} from '../electron/library'
import {Explorer,type DesktopOperations} from '../electron/explorer'
import {SearchIndex} from '../electron/search-index'
import {ehMetadata} from '../electron/metadata'
import {parseQuery} from '../shared/query'
import {parseSubtitles} from '../shared/subtitles'
import {DATA_DIR,validateProject,type Attribute} from '../shared/model'
import {exists,readFolder} from '../electron/files'
async function fixture(t:{after:(fn:()=>Promise<void>)=>void}){
 const base=path.resolve('.test-output');await fs.mkdir(base,{recursive:true});const root=await fs.mkdtemp(path.join(base,'explorer-')),media=path.join(root,'media'),local=path.join(root,'local');await fs.mkdir(media)
 const lib=new Library(local,undefined,false);await lib.init();let chosen:string|undefined;const executed:{file:string;args:string[]}[]=[]
 const desktop:DesktopOperations={choose:async()=>chosen,open:async file=>{executed.push({file,args:[]})},launch:async(file,args)=>{executed.push({file,args})},thumbnail:async()=>Buffer.from('thumbnail')}
 const explorer=new Explorer(lib,local,desktop)
 t.after(async()=>{explorer.index.close();const target=await fs.realpath(root);if(!target.startsWith(base+path.sep))throw new Error('Unsafe cleanup');await fs.rm(target,{recursive:true,force:true})})
 return{root,media,local,lib,explorer,executed,choose:(file:string)=>{chosen=file}}
}
test('game candidate boundaries protect Unity/RPGMaker/Unreal/Godot and readonly expansion',async t=>{
 const {media,lib,explorer}=await fixture(t)
 const markers:Record<string,string[]>={Unity:['Game.exe','UnityPlayer.dll','Game_Data/inner/file.bin'],Godot:['Game.exe','Game.pck','data/inner/file.bin'],RPG:['Game.exe','www/js/rmmz_core.js','www/data/file.bin'],Unreal:['Game.exe','Engine/base.bin','Binaries/Win64/Game.exe','Content/Paks/game.pak']}
 for(const [name,files]of Object.entries(markers))for(const rel of files){const file=path.join(media,name,rel);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,'ORIGINAL')}
 let snapshot=await lib.create(media,{name:'Games',mediaCategory:'game',depth:{mode:'through',level:5}})
 assert.equal(snapshot.rows.length,5)
 for(const name of Object.keys(markers)){const row=snapshot.rows.find(r=>r.name===name)!;assert.ok(row.boundary);for(const rel of markers[name]){assert.equal(await fs.readFile(path.join(media,name,rel),'utf8'),'ORIGINAL');assert.equal(await exists(path.join(path.dirname(path.join(media,name,rel)),DATA_DIR)),path.dirname(rel)==='.')}}
 const row=snapshot.rows.find(r=>r.name==='Unity')!
 await explorer.request({action:'boundary',rowId:row.rowId,revision:row.record!.revision,state:'root',traverse:true})
 snapshot=lib.snapshot();assert.ok(snapshot.rows.some(r=>r.name==='inner'&&r.readonly));assert.equal(await exists(path.join(media,'Unity','Game_Data',DATA_DIR)),false)
 const p=snapshot.projects[0].project!;snapshot=await lib.saveProject({...p,depth:{mode:'exact',level:5}})
 assert.equal(snapshot.rows.length,0);assert.ok(snapshot.structure?.some(r=>r.name==='Unity'&&r.structural));assert.ok(snapshot.problems.some(p=>p.includes('未達顯示深度')))
})
test('typed attributes, explicit private override, stale revision and partial batch failure preserve values',async t=>{
 const {media,lib,explorer}=await fixture(t);await fs.mkdir(path.join(media,'A'));await fs.mkdir(path.join(media,'B'))
 let s=await lib.create(media,{name:'Project',mediaCategory:'album',depth:{mode:'through',level:2}}),p=s.projects[0].project!
 s=await lib.saveProject({...p,fieldBindings:[...p.fieldBindings,{alias:'tag',attributeId:'tags',type:'tags'},{alias:'score',attributeId:'score',type:'number'},{alias:'date',attributeId:'date',type:'datetime'}]})
 let a=s.rows.find(r=>r.name==='A')!,b=s.rows.find(r=>r.name==='B')!
 const attrs:Attribute[]=[{attributeId:'tags',key:'tag',type:'tags',value:['中文','game'],source:'manual'},{attributeId:'score',key:'score',type:'number',value:4.5,source:'manual'},{attributeId:'date',key:'date',type:'datetime',value:'2025-10-12',source:'manual'}]
 await explorer.request({action:'attributes',rowId:a.rowId,revision:a.record!.revision,values:attrs,private:false});a=lib.snapshot().rows.find(r=>r.rowId===a.rowId)!
 await assert.rejects(explorer.request({action:'attributes',rowId:a.rowId,revision:a.record!.revision-1,values:attrs,private:false}),/版本衝突/)
 await explorer.request({action:'attributes',rowId:a.rowId,revision:a.record!.revision,values:[{...attrs[0],value:['private']}],private:true});a=lib.snapshot().rows.find(r=>r.rowId===a.rowId)!
 assert.deepEqual(a.record!.attributes.find(a=>a.attributeId==='tags')!.value,['中文','game']);assert.deepEqual(a.record!.projectOverrides[a.projectId][0].value,['private'])
 await assert.rejects(explorer.request({action:'attributes',rowId:a.rowId,revision:a.record!.revision,values:[{...attrs[1],value:'bad'}],private:false}),/型別/)
 const result=await explorer.request({action:'batch',rows:[{rowId:a.rowId,revision:a.record!.revision},{rowId:b.rowId,revision:0}],attributeId:'tags',value:['new'],mode:'add'})
 assert.match(result.message!,/批次保存 1 筆/);assert.match(result.message!,/失敗/);assert.deepEqual((await readFolder(a.path)).attributes.find(a=>a.attributeId==='tags')!.value,['中文','game','new']);assert.equal((await readFolder(b.path)).attributes.length,0)
})
test('SQLite supports Unicode substrings, comma AND, quotes, exclusion, OR, date normalization and ambiguity',async t=>{
 const {media,lib,explorer}=await fixture(t);await fs.mkdir(path.join(media,'中文 game 甲'));await fs.mkdir(path.join(media,'other'))
 let s=await lib.create(media,{name:'P',mediaCategory:'album',depth:{mode:'through',level:2}}),p=s.projects[0].project!
 s=await lib.saveProject({...p,fieldBindings:[...p.fieldBindings,{alias:'tag',attributeId:'tags',type:'tags'},{alias:'date',attributeId:'date',type:'datetime'}]});const row=s.rows.find(r=>r.name.includes('甲'))!
 await explorer.request({action:'attributes',rowId:row.rowId,revision:row.record!.revision,private:false,values:[{attributeId:'tags',key:'tag',type:'tags',value:['中文','game'],source:'manual'},{attributeId:'date',key:'date',type:'datetime',value:'2025-10-12',source:'manual'}]})
 for(const query of ['甲','中文','name:"中文 game" tag:中文,game','date:20251012','tag:missing ~ tag:game','tag:game -name:other'])assert.equal((await explorer.request({action:'search',query,projectId:p.projectId})).search!.total,1,query)
 assert.equal((await explorer.request({action:'search',query:'tag:game -中文'})).search!.total,0)
 assert.throws(()=>parseQuery('name:"unfinished'),/引號/);assert.throws(()=>parseQuery('a ~'),/缺少/)
 let p2=(await lib.create(media,{name:'P2',mediaCategory:'other',depth:{mode:'through',level:2}})).projects.at(-1)!.project!
 await lib.saveProject({...p2,fieldBindings:[...p2.fieldBindings,{alias:'tag',attributeId:'other-tags',type:'string'}]})
 await assert.rejects(explorer.request({action:'search',query:'tag:game'}),/多個身分/)
 assert.equal((await explorer.request({action:'search',query:'tag@tags:game'})).search!.total,2)
 const seen=new Set<string>();for(let offset=0;offset<6;offset+=2){const page=(await explorer.request({action:'search',query:'',offset,limit:2})).search!;for(const hit of page.hits){assert.ok(!seen.has(hit.rowId));seen.add(hit.rowId)}}assert.equal(seen.size,6)
 const rebuilt=new SearchIndex(path.join(path.dirname(explorer.index.file),'rebuilt.sqlite'));try{rebuilt.sync(lib.snapshot());assert.equal(rebuilt.search('tag@tags:game').total,2)}finally{rebuilt.close()}
})
test('range streaming, traversal rejection, subtitle import/cleanup and safe launch argument arrays',async t=>{
 const {root,media,lib,explorer,choose,executed}=await fixture(t);await fs.writeFile(path.join(media,'clip.mp4'),Buffer.from('0123456789'));await fs.writeFile(path.join(root,'external.srt'),'1\n00:00:00,000 --> 00:00:01,500\nhello\n')
 let s=await lib.create(media,{name:'P',mediaCategory:'video',depth:{mode:'through',level:1}}),row=s.rows[0]
 const contents=await explorer.content(row.rowId),video=contents.entries.find(e=>e.name==='clip.mp4')!
 let response=await explorer.stream(row.rowId,video.id,new Request(video.url,{headers:{Range:'bytes=2-5'}}));assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 2-5/10');assert.equal(await response.text(),'2345')
 response=await explorer.stream(row.rowId,video.id,new Request(video.url,{headers:{Range:'bytes=-3'}}));assert.equal(await response.text(),'789');assert.equal((await explorer.stream(row.rowId,video.id,new Request(video.url,{headers:{Range:'bytes=100-'}}))).status,416)
 assert.equal((await explorer.stream(row.rowId,'../external.srt',new Request(video.url))).status,404)
 const external=await explorer.droppedSubtitle(row.rowId,path.join(root,'external.srt'));const imported=await explorer.request({action:'subtitle',rowId:row.rowId,externalToken:external.subtitle!.token,import:true});assert.ok(imported.subtitle!.portable)
 row=lib.snapshot().rows[0];assert.equal(row.record!.details!.subtitles!.length,1)
 const p=lib.snapshot().projects[0].project!;await lib.saveProject({...p,actionTemplates:[{id:'launch',label:'Start',kind:'exe',color:'#123456'}]});await fs.writeFile(path.join(media,'test.exe'),'controlled fake, never executed');choose(path.join(media,'test.exe'));row=lib.snapshot().rows[0]
 await explorer.request({action:'bindTarget',rowId:row.rowId,revision:row.record!.revision,templateId:'launch',args:['with spaces','"quoted"','$(literal)']});assert.equal(executed.length,0)
 await explorer.request({action:'runTarget',rowId:row.rowId,templateId:'launch'});assert.deepEqual(executed[0].args,['with spaces','"quoted"','$(literal)']);assert.equal(executed[0].file,path.join(media,'test.exe'))
 const plan=await lib.previewCleanup(row.rowId,'folder');assert.ok(plan.paths.some(p=>p.endsWith('.srt')));await lib.cleanup(plan.token,false);assert.equal(await fs.readFile(path.join(root,'external.srt'),'utf8'),'1\n00:00:00,000 --> 00:00:01,500\nhello\n');assert.equal(await fs.readFile(path.join(media,'clip.mp4'),'utf8'),'0123456789')
})
test('E-Hentai public API validates host/identity, namespaces and portable preview import',async t=>{
 const {media,lib,explorer}=await fixture(t);await lib.create(media,{name:'P',mediaCategory:'manga',depth:{mode:'through',level:1}})
 const payload={gmetadata:[{gid:123,token:'abcdef0123',title:'Example &amp; sample',title_jpn:'例',tags:['language:chinese','other:test'],category:'Manga',uploader:'u',posted:'1700000000',filecount:'12',thumb:'https://ehgt.org/example.jpg'}]}
 const requests:string[]=[];const mock=(async(input:RequestInfo|URL,init?:RequestInit)=>{const url=String(input);requests.push(url);if(url.includes('api.php')){assert.equal(init?.method,'POST');assert.deepEqual(JSON.parse(String(init?.body)).gidlist,[[123,'abcdef0123']]);return new Response(JSON.stringify(payload))}return new Response(Buffer.from([255,216,255,0]))}) as typeof fetch
 await assert.rejects(ehMetadata('https://e-hentai.org.evil.test/g/123/abcdef0123/',mock),/只接受/);assert.equal(requests.length,0)
 const preview=await ehMetadata('https://e-hentai.org/g/123/abcdef0123/',mock);assert.equal(preview.preview.title,'Example & sample');assert.deepEqual(preview.preview.values.find(v=>v.key==='TAGS')!.value,['language:chinese','other:test']);assert.ok(preview.cover)
 const original=globalThis.fetch;globalThis.fetch=mock
 try{const candidate=await explorer.request({action:'metadataPreview',source:'https://e-hentai.org/g/123/abcdef0123/'}),row=lib.snapshot().rows[0];await explorer.request({action:'metadataApply',rowId:row.rowId,revision:row.record!.revision,token:candidate.preview!.token,keys:['TITLE','TAGS'],image:true});const record=await readFolder(media);assert.equal(record.attributes.find(a=>a.attributeId==='eh-title')!.value,'Example & sample');assert.equal(record.assets.length,1);assert.equal(record.attributes.some(a=>a.key==='GALLERY_CATEGORY'),false)}finally{globalThis.fetch=original}
})
test('subtitle parser is time based and malformed sources fail without inventing cues',()=>{
 assert.deepEqual(parseSubtitles('\uFEFFWEBVTT\n\n00:00.000 --> 00:01.200\n<b>safe</b>\n'),[{start:0,end:1.2,text:'safe'}]);assert.equal(parseSubtitles('1\n01:00:00,500 --> 01:00:01,500\nline\n')[0].start,3600.5);assert.throws(()=>parseSubtitles('invalid'),/找不到/);assert.throws(()=>parseSubtitles('00:02.000 --> 00:01.000\nbad'),/結束/)
 assert.deepEqual(parseQuery('"field:label":a\\,b "-literal"'),[[{key:'field:label',value:'a,b',exclude:false},{key:undefined,value:'-literal',exclude:false}]])
})

test('1000-row SQLite warm substring benchmark includes one-character Chinese queries',async t=>{
 const {lib,media,explorer}=await fixture(t);const s=await lib.create(media,{name:'P',mediaCategory:'other',depth:{mode:'through',level:1}}),base=s.rows[0]
 s.rows=Array.from({length:1000},(_,i)=>({...base,rowId:'row'+i,path:path.join(media,String(i)),name:`遊戲 ${String(i).padStart(4,'0')}`,record:{...base.record!,folderId:'folder'+i,attributes:[{attributeId:'tags',key:'tag',type:'tags',value:['中文','game'],source:'manual'}]}}))
 explorer.index.sync(s);const samples:number[]=[],queries=['遊','000','name:"遊戲"','tag:中文,game','-name:999','path:media']
 for(let i=0;i<30;i++){const start=performance.now();explorer.index.search(queries[i%queries.length],undefined,0,100);samples.push(performance.now()-start)}samples.sort((a,b)=>a-b);const p95=samples[Math.floor(samples.length*.95)];console.log(`SQLite 1,000-row warm p95 ${p95.toFixed(2)}ms (main query only, 30 samples)`);assert.ok(p95<200,`p95 ${p95}ms`)
})
