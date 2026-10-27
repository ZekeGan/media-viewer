import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import type { Library } from './library'
import { atomicJson, exists, folderFile, readFolder, relPath, safePath, saveFolder, within } from './files'
import { DATA_DIR, validateDetails, type Attribute, type FolderRecord } from '../shared/model'
import { newDetails, type ContentResult, type ExplorerRequest, type ExplorerResponse, type MediaEntry, type MetadataPreview } from '../shared/explorer'
import { SearchIndex } from './search-index'
import { ehMetadata } from './metadata'
import { parseSubtitles } from '../shared/subtitles'
import { imageTypes } from '../shared/images'

const types: Record<string,[MediaEntry['kind'],string]> = { '.png':['image','image/png'],'.jpg':['image','image/jpeg'],'.jpeg':['image','image/jpeg'],'.gif':['image','image/gif'],'.webp':['image','image/webp'],'.mp4':['video','video/mp4'],'.webm':['video','video/webm'],'.mkv':['video','video/x-matroska'],'.avi':['video','video/x-msvideo'],'.mov':['video','video/quicktime'],'.srt':['subtitle','text/plain'],'.vtt':['subtitle','text/vtt'] }
const key = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v)
export interface DesktopOperations {
  choose(kind: 'exe'|'folder'|'subtitle'): Promise<string|undefined>
  open(file: string): Promise<void>; launch(file: string,args: string[]): Promise<void>
  thumbnail(file: string, mime?:string): Promise<Buffer>
}
export class Explorer {
  readonly index: SearchIndex
  private files = new Map<string,{rowId:string;name:string;file:string;mime:string;portable?:boolean}>()
  private externals = new Map<string,{rowId:string;file:string}>()
  private previews = new Map<string,{preview:MetadataPreview;cover?:{bytes:Buffer;mime:string;ext:string};expires:number}>()
  private thumbnailReads=0
  private thumbnailJobs=new Map<string,Promise<Buffer>>()
  private thumbnailTail:Promise<unknown>=Promise.resolve()
  constructor(private library: Library, private root: string, private desktop: DesktopOperations) { this.index = new SearchIndex(path.join(root,'search.sqlite')); this.index.sync(library.snapshot()) }
  private async record(rowId: string, revision: number) {
    const row = await this.library.checkedRow(rowId,true), record = await readFolder(row.path)
    if (record.revision !== revision) throw new Error('版本衝突；草稿保留，重新載入後比較')
    return { row,record }
  }
  private async details(rowId: string, revision: number, mutate: (details: NonNullable<FolderRecord['details']>, record: FolderRecord) => void) {
    const {row,record} = await this.record(rowId,revision); record.details ??= newDetails(); mutate(record.details,record); validateDetails(record.details)
    await saveFolder(row.path,record,revision); return this.library.refreshRecord(rowId)
  }
  async content(rowId: string): Promise<ContentResult> {
    const row = await this.library.checkedRow(rowId), notices: string[] = [], entries: MediaEntry[] = [], names = await fs.readdir(row.path,{withFileTypes:true})
    for (let offset=0;offset<names.length;offset+=16) await Promise.all(names.slice(offset,offset+16).map(async entry=>{
      if (entry.name.toLowerCase() === DATA_DIR || entry.isSymbolicLink()) return
      const file = path.join(row.path,entry.name)
      try {
        await safePath(row.path,file); const stat = await fs.stat(file); if (!stat.isFile()&&!stat.isDirectory()) return
        const imageMime=imageTypes[path.extname(file).slice(1).toLowerCase()]
        const [kind,mime] = stat.isDirectory() ? ['folder','application/octet-stream'] as const : imageMime?['image',imageMime] as const:types[path.extname(file).toLowerCase()] ?? ['other','application/octet-stream']
        const id = createHash('sha256').update(entry.name).digest('hex'), url = `media://file/${rowId}/${id}`
        this.files.set(`${rowId}/${id}`,{rowId,name:entry.name,file,mime})
        entries.push({ id,name:entry.name,kind,mime,size:stat.size,modified:stat.mtimeMs,url, ...(['image','video'].includes(kind)?{thumb:`media://thumb/${rowId}/${id}?v=${stat.size}-${stat.mtimeMs}`}:{}) })
      } catch(e) { notices.push(`${entry.name}: ${String(e)}`) }
    }))
    entries.sort((a,b)=>a.name.localeCompare(b.name,'zh-Hant',{numeric:true})||a.id.localeCompare(b.id))
    for (const sub of row.record?.details?.subtitles ?? []) {
      const file = path.join(row.path,DATA_DIR,sub.relativePath); this.files.set(`${rowId}/${sub.id}`,{rowId,name:sub.name,file,mime:'text/vtt',portable:true})
      entries.push({id:sub.id,name:sub.name,kind:'subtitle',mime:'text/vtt',size:0,modified:0,url:`media://file/${rowId}/${sub.id}`})
    }
    return { entries,notices }
  }
  private async file(rowId: string,id: string) {
    const row = await this.library.checkedRow(rowId), entry = this.files.get(`${rowId}/${id}`)
    if (!entry || entry.rowId!==rowId) throw new Error('媒體不存在或需重新載入')
    await safePath(row.path,entry.file)
    if (!entry.portable && path.dirname(entry.file)!==row.path) throw new Error('媒體超出直接內容範圍')
    if (entry.portable && !row.record?.details?.subtitles?.some(s=>path.join(row.path,DATA_DIR,s.relativePath)===entry.file)) throw new Error('字幕不屬於此記錄')
    const stat=await fs.stat(entry.file); if(!stat.isFile()) throw new Error('不是檔案')
    return {...entry,stat,row}
  }
  async stream(rowId: string,id: string,request: globalThis.Request, thumbnail=false): Promise<globalThis.Response> {
    try {
      const entry=await this.file(rowId,id)
      if (thumbnail) {
        if(!/^(image|video)\//.test(entry.mime)) return new globalThis.Response(null,{status:415})
        const cache=path.join(this.root,'thumbnails'); await fs.mkdir(cache,{recursive:true})
        const file=path.join(cache,createHash('sha256').update(`${entry.file}/${entry.stat.size}/${entry.stat.mtimeMs}`).digest('hex')+'.jpg')
        await safePath(this.root,file)
        await this.thumbnail(file,entry.file,entry.mime,entry.stat.size)
        if(++this.thumbnailReads%32===1)void this.trimThumbnails().catch(()=>{})
        return new globalThis.Response(await fs.readFile(file),{headers:{'Content-Type':'image/jpeg','Cache-Control':'no-cache'}})
      }
      if(!/^(image|video)\//.test(entry.mime)) return new globalThis.Response(null,{status:415})
      const size=entry.stat.size, headers:Record<string,string>={'Content-Type':entry.mime,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
      const range=request.headers.get('range'); let start=0,end=size-1,status=200
      if(range) {
        const m=/^bytes=(\d*)-(\d*)$/.exec(range)
        if(!m||(!m[1]&&!m[2])) return new globalThis.Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}})
        if(!m[1]) start=Math.max(0,size-Number(m[2])); else start=Number(m[1])
        if(m[2]&&m[1]) end=Math.min(end,Number(m[2]))
        if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size) return new globalThis.Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}})
        status=206; headers['Content-Range']=`bytes ${start}-${end}/${size}`
      }
      headers['Content-Length']=String(Math.max(0,end-start+1))
      if(request.method==='HEAD'||!size) return new globalThis.Response(null,{status,headers})
      const stream=createReadStream(entry.file,{start,end}); request.signal.addEventListener('abort',()=>stream.destroy(),{once:true})
      return new globalThis.Response(Readable.toWeb(stream) as ReadableStream,{status,headers})
    } catch { return new globalThis.Response(null,{status:404}) }
  }
  private async thumbnail(cache:string,source:string,mime:string,size:number){
    const jpeg=(b:Buffer)=>b.length>4&&b[0]===255&&b[1]===216&&b.at(-2)===255&&b.at(-1)===217
    const pending=this.thumbnailJobs.get(cache);if(pending)return pending
    const job=this.thumbnailTail.then(async()=>{
      try{const cached=await fs.readFile(cache);if(jpeg(cached))return cached}catch{}
      if(mime.startsWith('image/')&&size>100*1024*1024)throw new Error('圖片過大，請直接檢視原圖')
      const bytes=await this.desktop.thumbnail(source,mime);if(!jpeg(bytes))throw new Error('縮圖解碼失敗')
      const temp=cache+'.'+randomUUID()+'.tmp'
      try{await fs.writeFile(temp,bytes,{flag:'wx'});await fs.rename(temp,cache)}finally{await fs.unlink(temp).catch(()=>{})}
      return bytes
    })
    this.thumbnailTail=job.catch(()=>{});this.thumbnailJobs.set(cache,job)
    try{return await job}finally{this.thumbnailJobs.delete(cache)}
  }
  private async trimThumbnails(){
    const cache=path.join(this.root,'thumbnails');await safePath(this.root,cache);if(!await exists(cache))return
    const files:{file:string;size:number;time:number}[]=[]
    for(const entry of await fs.readdir(cache,{withFileTypes:true}))if(entry.isFile()&&!entry.isSymbolicLink()&&/^[0-9a-f]{64}\.jpg$/.test(entry.name)){const file=path.join(cache,entry.name),stat=await fs.stat(file);files.push({file,size:stat.size,time:stat.mtimeMs})}
    let size=files.reduce((sum,f)=>sum+f.size,0),count=files.length
    for(const f of files.sort((a,b)=>a.time-b.time)){if(count<=3000&&size<=512*1024*1024)break;await safePath(cache,f.file);await fs.unlink(f.file);size-=f.size;count--}
  }
  private checkValue(a:Attribute,record:FolderRecord) {
    if(!key(a.attributeId)||typeof a.key!=='string'||a.key.length>100) throw new Error('欄位身分不合法')
    const valid = a.type==='string' ? typeof a.value==='string'&&a.value.length<=10000 : a.type==='tags' ? Array.isArray(a.value)&&a.value.length<=200&&a.value.every(v=>typeof v==='string'&&v.length>0&&v.length<=100) : a.type==='number' ? typeof a.value==='number'&&Number.isFinite(a.value) : a.type==='datetime' ? typeof a.value==='string'&&/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/.test(a.value)&&!Number.isNaN(Date.parse(a.value)) : false
    if(!valid) throw new Error(`欄位 ${a.key} 的值與型別 ${a.type} 不符`)
    const old=record.attributes.find(v=>v.attributeId===a.attributeId); if(old&&old.type!==a.type) throw new Error('不能改變既有欄位型別')
  }
  async attributes(rowId:string,revision:number,values:Attribute[],privateValues:boolean) {
    if(!Array.isArray(values)||values.length>200||typeof privateValues!=='boolean'||new Set(values.map(v=>v.attributeId)).size!==values.length) throw new Error('欄位更新不合法')
    const {row,record}=await this.record(rowId,revision), project=this.library.snapshot().projects.find(p=>p.projectId===row.projectId)!.project!
    const allowed=new Map([...project.fieldBindings.map(f=>[f.attributeId,{key:f.alias,type:f.type}] as const),...record.attributes.map(a=>[a.attributeId,a] as const)])
    const target=privateValues?(record.projectOverrides[row.projectId]??[]):record.attributes
    for(const value of values) { this.checkValue(value,record); const binding=allowed.get(value.attributeId); if(!binding||binding.type!==value.type) throw new Error('欄位未配置或型別不符'); const old=target.find(a=>a.attributeId===value.attributeId); if(old&&old.type!==value.type) throw new Error('覆寫型別不符'); const a={...value,key:binding.key??('alias' in binding?binding.alias:''),source:'manual'}; const i=target.findIndex(a=>a.attributeId===value.attributeId); if(i<0)target.push(a);else target[i]=a }
    if(privateValues)record.projectOverrides[row.projectId]=target;else record.attributes=target
    await saveFolder(row.path,record,revision)
  }
  async droppedSubtitle(rowId:string,filePath:string) { return this.chooseSubtitle(rowId,filePath) }
  private async chooseSubtitle(rowId:string,filePath?:string):Promise<ExplorerResponse> {
    await this.library.checkedRow(rowId);const file=filePath??await this.desktop.choose('subtitle');if(!file)return {cancelled:true}
    if(!path.isAbsolute(file)||!['.srt','.vtt'].includes(path.extname(file).toLowerCase()))throw new Error('僅支援 SRT／VTT');const real=await fs.realpath(file),stat=await fs.stat(real);if(!stat.isFile()||stat.size>5*1024*1024)throw new Error('字幕需為 5MB 以內的文字檔')
    const bytes=await fs.readFile(real),token='ext-'+createHash('sha256').update(bytes).digest('hex');this.externals.set(`${rowId}/${token}`,{rowId,file:real});return {subtitle:{token,name:path.basename(real),text:new TextDecoder('utf-8').decode(bytes),portable:false}}
  }
  async request(req:ExplorerRequest):Promise<ExplorerResponse> {
    if(req.action==='visit')return this.after(await this.library.visit(req.rowId))
    if(!req||typeof req.action!=='string')throw new Error('無效的操作')
    switch(req.action) {
      case 'search': this.index.sync(this.library.snapshot()); return {search:this.index.search(req.query,req.projectId,req.offset,req.limit)}
      case 'rebuildIndex': this.index.sync(this.library.snapshot(),true);return {message:'索引已由可攜資料重建'}
      case 'content': return {content:await this.content(req.rowId)}
      case 'attributes': await this.attributes(req.rowId,req.revision,req.values,req.private);return this.after(await this.library.refreshRecord(req.rowId))
      case 'batch': {
        if(!Array.isArray(req.rows)||!req.rows.length||req.rows.length>1000||!['replace','add','remove'].includes(req.mode)||new Set(req.rows.map(r=>r.rowId)).size!==req.rows.length)throw new Error('批次範圍不合法')
        const failed:string[]=[];let saved=0
        for(const item of req.rows)try { const {row,record}=await this.record(item.rowId,item.revision),p=this.library.snapshot().projects.find(p=>p.projectId===row.projectId)!.project!,field=p.fieldBindings.find(f=>f.attributeId===req.attributeId);if(!field)throw new Error('專案未配置欄位');let value=req.value; if(field.type==='tags'&&req.mode!=='replace') { if(!Array.isArray(req.value))throw new Error('標籤應為清單'); const old=record.attributes.find(a=>a.attributeId===field.attributeId)?.value??[]; if(!Array.isArray(old))throw new Error('型別衝突'); value=req.mode==='add'?[...new Set([...old,...req.value])]:old.filter(v=>!(req.value as unknown[]).includes(v)) } else if(req.mode!=='replace')throw new Error('只有標籤支援新增／移除'); await this.attributes(item.rowId,item.revision,[{attributeId:field.attributeId,key:field.alias,type:field.type,value,source:'manual'}],false);saved++ }catch(e){failed.push(`${item.rowId}: ${String(e)}`)}
        for(const item of req.rows)await this.library.refreshRecord(item.rowId).catch(()=>{});const snapshot=this.library.snapshot();this.index.sync(snapshot);return {snapshot,message:`批次保存 ${saved} 筆${failed.length?'\n失敗（已成功項目保留）：\n'+failed.join('\n'):''}`}
      }
      case 'reading': return this.after(await this.details(req.rowId,req.revision,d=>{d.reading=req.prefs}))
      case 'playback': { const f=await this.file(req.rowId,req.fileId);if(!f.mime.startsWith('video/'))throw new Error('不是影片');return this.after(await this.details(req.rowId,req.revision,d=>{d.playback??={};const p=d.playback[req.fileId]??{time:0};p.time=req.time;if(req.subtitle!==undefined)p.subtitle=req.subtitle;if(req.settings){p.settings??={};if(!req.subtitle)throw new Error('字幕來源未指定');p.settings[req.subtitle]=req.settings}d.playback[req.fileId]=p})) }
      case 'boundary': { if(!['root','candidate','not-game'].includes(req.state)||req.traverse!==undefined&&typeof req.traverse!=='boolean')throw new Error('邊界設定不合法'); await this.details(req.rowId,req.revision,(d)=>{d.boundary={state:req.state,engines:d.boundary?.engines??[],evidence:d.boundary?.evidence??['使用者指定']}});const row=await this.library.checkedRow(req.rowId),p=this.library.snapshot().projects.find(p=>p.projectId===row.projectId)!.project!;if(req.traverse!==undefined)await this.library.saveProject({...p,traversal:{...p.traversal,[row.record!.folderId]:req.traverse}});break }
      case 'banner': return this.after(await this.details(req.rowId,req.revision,(d,r)=>{if(!r.assets.some(a=>a.assetId===req.assetId))throw new Error('圖片不屬於此資料夾');d.bannerAssetId=req.assetId}))
      case 'bindTarget': {
        const {row,record}=await this.record(req.rowId,req.revision),template=this.library.snapshot().projects.find(p=>p.projectId===row.projectId)?.project?.actionTemplates?.find(t=>t.id===req.templateId)
        if(!template)throw new Error('任務版型不存在');const file=await this.desktop.choose(template.kind);if(!file)return {cancelled:true}
        const target=await fs.realpath(file),stat=await fs.stat(target);if(template.kind==='exe'?(!stat.isFile()||path.extname(target).toLowerCase()!=='.exe'):!stat.isDirectory())throw new Error('目標類型不符')
        record.details??=newDetails();record.details.targets??={};record.details.targets[template.id]={kind:template.kind,path:within(row.path,target)?relPath(row.path,target):target,relative:within(row.path,target),args:req.args};validateDetails(record.details);await saveFolder(row.path,record,req.revision);break
      }
      case 'runTarget': {
        const row=await this.library.checkedRow(req.rowId),record=await readFolder(row.path),p=this.library.snapshot().projects.find(p=>p.projectId===row.projectId)!.project!,template=p.actionTemplates?.find(t=>t.id===req.templateId),target=record.details?.targets?.[req.templateId]
        if(!template||!target||template.kind!==target.kind)throw new Error('任務尚未綁定；請重新指定')
        const file=target.relative?path.join(row.path,target.path):target.path;if(target.relative)await safePath(row.path,file);else if(!path.isAbsolute(file))throw new Error('外部路徑不合法')
        const stat=await fs.stat(file)
        if(target.kind==='exe'){if(!stat.isFile()||path.extname(file).toLowerCase()!=='.exe')throw new Error('EXE 已失效');await this.desktop.launch(file,target.args)}else{if(!stat.isDirectory())throw new Error('資料夾已失效');await this.desktop.open(file)}
        return {message:'已開啟指定目標'}
      }
      case 'chooseSubtitle': {
        return this.chooseSubtitle(req.rowId)
      }
      case 'subtitle': {
        let file:string,portable=false,token=req.fileId??req.externalToken??''
        if(req.fileId){const f=await this.file(req.rowId,req.fileId);if(!['.srt','.vtt'].includes(path.extname(f.file).toLowerCase()))throw new Error('字幕格式未支援');file=f.file;portable=true}
        else{const external=this.externals.get(`${req.rowId}/${token}`);if(!external||external.rowId!==req.rowId)throw new Error('外部字幕未授權');file=external.file}
        if((await fs.stat(file)).size>5*1024*1024)throw new Error('字幕過大');const bytes=await fs.readFile(file),text=new TextDecoder(req.encoding??'utf-8',{fatal:true}).decode(bytes);parseSubtitles(text)
        if(req.import&&!portable){const row=await this.library.checkedRow(req.rowId,true),r=await readFolder(row.path),id=randomUUID(),relativePath=`subtitles/${id}${path.extname(file).toLowerCase()}`,target=path.join(row.path,DATA_DIR,relativePath);await safePath(row.path,target);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes,{flag:'wx'});r.details??=newDetails();r.details.subtitles??=[];r.details.subtitles.push({id,name:path.basename(file),relativePath});try{await saveFolder(row.path,r,r.revision)}catch(e){await fs.unlink(target);throw e}portable=true;token=id;await this.library.scan();await this.content(req.rowId)}
        return {subtitle:{token,name:path.basename(file),text,portable},snapshot:this.library.snapshot()}
      }
      case 'metadataPreview': return {preview:await this.metadataPreview(req.source)}
      case 'metadataApply': await this.applyMetadata(req);break
      default: throw new Error('不支援的操作')
    }
    return this.after(await this.library.scan())
  }
  private after(snapshot:ReturnType<Library['snapshot']>):ExplorerResponse{this.index.sync(snapshot);return {snapshot}}
  private async metadataPreview(source:string):Promise<MetadataPreview> {
    const item=await ehMetadata(source),preview:MetadataPreview={...item.preview,token:randomUUID()}
    for(const [id,p] of this.previews)if(p.expires<Date.now())this.previews.delete(id)
    if(this.previews.size>=10)this.previews.delete(this.previews.keys().next().value!)
    this.previews.set(preview.token,{preview,cover:item.cover,expires:Date.now()+15*60*1000});return preview
  }
  private async applyMetadata(req:Extract<ExplorerRequest,{action:'metadataApply'}>) {
    const item=this.previews.get(req.token);if(!item||item.expires<Date.now())throw new Error('候選已過期，請重新取得');if(!Array.isArray(req.keys)||!req.keys.every(k=>item.preview.values.some(v=>v.key===k)))throw new Error('匯入欄位不合法')
    const {row,record}=await this.record(req.rowId,req.revision)
    for(const v of item.preview.values.filter(v=>req.keys.includes(v.key))) { const attributeId='eh-'+v.key.toLowerCase(),old=record.attributes.find(a=>a.attributeId===attributeId);if(old&&!old.source.startsWith('https://e-hentai.org/g/'))throw new Error('既有欄位來源衝突');record.attributes=record.attributes.filter(a=>a.attributeId!==attributeId);record.attributes.push({...v,attributeId,source:item.preview.source}) }
    let added:string|undefined
    if(req.image&&item.cover){const {bytes,ext,mime}=item.cover,assetId=randomUUID(),relativePath=`assets/${assetId}.${ext}`;added=path.join(row.path,DATA_DIR,relativePath);await safePath(row.path,added);await fs.mkdir(path.dirname(added),{recursive:true});await fs.writeFile(added,bytes,{flag:'wx'});record.assets.push({assetId,relativePath,originalName:'eh-cover.'+ext,mediaType:mime})}
    try{await saveFolder(row.path,record,req.revision)}catch(e){if(added)await fs.unlink(added);throw e}
  }
}
