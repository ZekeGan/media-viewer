import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
import { DATA_DIR, defaultCells, validateFolder, validateProject, type Project, type ProjectInput, type FolderRecord, type FolderRow, type Snapshot, type ScanProgress, type CleanupPreview, type CleanupResult, type LinkedProject, type LegacyPreview } from '../shared/model'
import { atomicJson, ensureFolder, exists, fingerprint, folderFile, keyPath, message, missing, projectFile, readFolder, readJson, relPath, restoreJson, safePath, saveFolder, within } from './files'
import { hideDirectories } from './hidden'
import { detectGame } from './game-detection'
import { identifyImage } from '../shared/images'

interface PlanEntry { dir: string; record: FolderRecord; files: { path: string; hash: string }[] }
interface Plan { preview: CleanupPreview; entries: PlanEntry[]; rowId?: string; projectId?: string }
export class Library {
  private refs: { projectId: string; root: string }[] = []
  private plans = new Map<string, Plan>()
  private cancelled = false
  private hiddenKnown = new Set<string>()
  private legacyPlan?: { token: string; hash: string; views: any[] }
  private tail: Promise<unknown> = Promise.resolve()
  private state: Snapshot = { projects: [], rows: [], problems: [], progress: { visited: 0, created: 0, errors: 0, active: false, cancelled: false }, legacyAvailable: false }
  constructor(readonly userData: string, private progress: (p: ScanProgress) => void = () => {}, private hide = true) {}
  // A single queue owns every mutation. cancelScan intentionally bypasses it.
  run<T>(operation: () => Promise<T>): Promise<T> { const next = this.tail.then(operation); this.tail = next.catch(() => {}); return next }
  snapshot() { return structuredClone(this.state) }
  cancelScan() { this.cancelled = true }
  private get registry() { return path.join(this.userData, 'poc-projects.json') }
  async init() {
    await fs.mkdir(this.userData, { recursive: true })
    if (await exists(this.registry)) {
      const refs = await readJson(this.registry)
      if (!Array.isArray(refs) || !refs.every(r => typeof r.projectId === 'string' && /^[\w-]+$/.test(r.projectId) && typeof r.root === 'string' && path.isAbsolute(r.root))) throw new Error('本機專案清單損壞；原檔保留，可從專案根重新連結')
      this.refs = refs
    }
    this.state.legacyAvailable = await exists(path.join(this.userData, 'app-data', 'view.json'))
    return this.scan()
  }
  private async persistRefs() { await atomicJson(this.registry, this.refs) }
  private linked(projectId: string): LinkedProject {
    const linked = this.state.projects.find(p => p.projectId === projectId)
    if (!linked?.project || linked.error) throw new Error('專案不可用，請重新連結或重新掃描')
    return linked
  }
  private async currentProject(linked: LinkedProject) {
    const file = projectFile(linked.root, linked.projectId)
    await safePath(linked.root, file)
    const p = await readJson(file); validateProject(p)
    if (p.projectId !== linked.projectId) throw new Error('專案 ID 不符')
    return p
  }
  async create(root: string, input: ProjectInput) {
    root = await fs.realpath(root)
    const attributeId = randomUUID()
    const p: Project = { kind: 'media-viewer.project', schemaVersion: 1, projectId: randomUUID(), rootFolderId: 'pending', revision: 1, name: input.name, mediaCategory: input.mediaCategory, depth: input.depth, fieldBindings: [{ alias: 'title', attributeId, type: 'string' }], cells: defaultCells(randomUUID, attributeId), list: { itemsPerRow: 2, pageSize: 100 }, excludedRelativePaths: [] }
    validateProject(p)
    if(input.scanAll){p.scanAll=true;p.cardView={mode:'multi',level:'all'}}
    p.rootFolderId = (await ensureFolder(root, this.hide)).record.folderId
    const file = projectFile(root, p.projectId)
    await safePath(root, file); await fs.mkdir(path.dirname(file), { recursive: true }); await atomicJson(file, p)
    this.refs.push({ root, projectId: p.projectId }); await this.persistRefs(); return this.scan()
  }
  async link(root: string) {
    root = await fs.realpath(root)
    let record: FolderRecord
    try { record = await readFolder(root) }
    catch { await safePath(root, `${folderFile(root)}.bak`); const backup = await readJson(`${folderFile(root)}.bak`); validateFolder(backup); record = backup }
    const dir = path.join(root, DATA_DIR, 'projects')
    await safePath(root, dir)
    const names = await fs.readdir(dir), found: Project[] = []
    for (const name of new Set(names.filter(n => /^[\w-]+\.json(\.bak)?$/.test(n)).map(n => n.replace(/\.bak$/, '')))) {
      await safePath(root, path.join(dir, name))
      let p: Project
      try { const current = await readJson(path.join(dir, name)); validateProject(current); p = current }
      catch { await safePath(root, path.join(dir, `${name}.bak`)); const backup = await readJson(path.join(dir, `${name}.bak`)); validateProject(backup); p = backup }
      if (p.rootFolderId !== record.folderId || name !== `${p.projectId}.json`) throw new Error('專案與根資料夾身分不符')
      const old = this.refs.find(r => r.projectId === p.projectId)
      if (old && keyPath(old.root) !== keyPath(root) && await exists(old.root)) throw new Error('同一專案的原根仍存在；若是搬移，先取消舊連結後再連結新位置')
      found.push(p)
    }
    if (!found.length) throw new Error('此根沒有可攜專案設定；可新增專案讀取子資料夾原值')
    for (const p of found) this.refs = [...this.refs.filter(r => r.projectId !== p.projectId), { root, projectId: p.projectId }]
    await this.persistRefs(); return this.scan()
  }
  async unlink(projectId: string) { this.refs = this.refs.filter(p => p.projectId !== projectId); await this.persistRefs(); return this.scan() }
  async saveProject(next: Project) {
    validateProject(next)
    const linked = this.linked(next.projectId), current = await this.currentProject(linked)
    if (next.rootFolderId !== current.rootFolderId || JSON.stringify(next.excludedRelativePaths) !== JSON.stringify(current.excludedRelativePaths)) throw new Error('根身分與清理排除須由受控操作修改')
    await atomicJson(projectFile(linked.root, next.projectId), { ...next, revision: next.revision + 1 }, next.revision)
    if(JSON.stringify([next.scanAll,next.depth,next.mediaCategory,next.traversal])!==JSON.stringify([current.scanAll,current.depth,current.mediaCategory,current.traversal]))return this.scan()
    linked.project={...structuredClone(next),revision:next.revision+1}
    return this.snapshot()
  }
  async scan() {
    this.cancelled = false
    const progress: ScanProgress = { visited: 0, created: 0, errors: 0, active: true, cancelled: false }
    const rows: FolderRow[] = [], structure: FolderRow[] = [], projects: LinkedProject[] = [], problems: string[] = []
    const cache = new Map<string, { record?: FolderRecord; error?: string }>()
    this.progress({ ...progress })
    for (const ref of this.refs) {
      const linked: LinkedProject = { ...ref }; projects.push(linked)
      try {
        linked.project = await this.currentProject(linked)
        const rootRecord = await readFolder(ref.root)
        if (rootRecord.folderId !== linked.project.rootFolderId) throw new Error('根資料夾身分已改變，請重新連結')
      } catch (e) { linked.error = message(e); problems.push(`${ref.root}: ${message(e)}`) }
    }
    const exclusions = new Set<string>()
    for (const linked of projects) if (linked.project && !linked.error) {
      const p = linked.project, keep: string[] = []
      for (const rel of p.excludedRelativePaths) {
        const target = path.join(linked.root, rel)
        try { if (await exists(target)) { keep.push(rel); exclusions.add(keyPath(target)) } }
        catch { keep.push(rel); exclusions.add(keyPath(target)) }
      }
      if (keep.length !== p.excludedRelativePaths.length) {
        try { await atomicJson(projectFile(linked.root, p.projectId), { ...p, revision: p.revision + 1, excludedRelativePaths: keep }, p.revision); p.revision++; p.excludedRelativePaths = keep }
        catch (e) { problems.push(message(e)) }
      }
    }
    for (const linked of projects) {
      const p = linked.project
      if (!p || linked.error || this.cancelled) continue
      type ScanEntry = { dir: string; depth: number; readonly?: boolean }
      const walk = async ({ dir, depth, readonly = false }: ScanEntry): Promise<ScanEntry[]> => {
        if (this.cancelled) return []
        const stopped = exclusions.has(keyPath(dir)), cacheKey = keyPath(dir)
        let boundary: FolderRow['boundary'], probeError = ''
        try {
          await safePath(linked.root, dir)
          const existing = await readFolder(dir).catch(e => { if (missing(e)) return undefined; throw e })
          if (existing?.details?.boundary?.state !== 'not-game') { const detected = existing?.details?.boundary ?? await detectGame(dir); if (detected) boundary = { ...detected, state: existing?.details?.boundary?.state ?? 'candidate' } }
        } catch (e) { probeError=message(e); problems.push(`${dir}: 無法確認邊界，停止此分支：${probeError}`); progress.errors++; progress.visited++ }
        let result = probeError ? {error:probeError} : readonly ? undefined : cache.get(cacheKey)
        if (!result) {
          try {
            await safePath(linked.root, dir)
            if (stopped || readonly) result = { record: await readFolder(dir).catch(e => { if (missing(e)) return undefined; throw e }) }
            else {
              const found = await ensureFolder(dir, false); result = { record: found.record }
              if (found.created) { progress.created++; this.hiddenKnown.delete(cacheKey) }
            }
          } catch (e) { result = { error: message(e) }; progress.errors++; problems.push(`${dir}: ${message(e)}`) }
          if (!readonly) cache.set(cacheKey, result)
          progress.visited++
          if (progress.visited % 20 === 0) this.progress({ ...progress })
        }
        const row: FolderRow = { rowId: createHash('sha256').update(`${p.projectId}\0${cacheKey}`).digest('hex'), projectId: p.projectId, path: dir, name: path.basename(dir) || dir, depth, ...result, stopped, duplicate: false, readonly, boundary, structural: p.depth.mode === 'exact' && depth !== p.depth.level }
        structure.push(row); if (!row.structural) rows.push(row)
        if(probeError)return []
        if (boundary) { problems.push(`${dir}: ${boundary.engines.join('/')} ${boundary.state === 'root' ? '遊戲根' : '疑似遊戲'}，內部不寫入${row.structural ? '；未達顯示深度' : ''}`); if (!result?.record || !p.traversal?.[result.record.folderId]) return [] }
        if ((!p.scanAll&&depth >= p.depth.level) || this.cancelled) return []
        const children: ScanEntry[] = []
        try {
          for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
            if (entry.name.toLowerCase() === DATA_DIR) continue
            if (entry.isSymbolicLink()) { problems.push(`${path.join(dir, entry.name)}: 略過連結`); continue }
            if (entry.isDirectory()) children.push({ dir: path.join(dir, entry.name), depth: depth + 1, readonly: readonly || !!boundary })
          }
        } catch (e) { problems.push(`${dir}: ${message(e)}`); progress.errors++ }
        return children
      }
      const pending: ScanEntry[] = [{ dir: linked.root, depth: 1 }]
      // Eight independent directories at most; complete in-flight writes on cancellation.
      while (pending.length && !this.cancelled) pending.push(...(await Promise.all(pending.splice(0, 8).map(walk))).flat())
    }
    if (this.hide) {
      const dirs = [...cache].filter(([dir, value]) => value.record && !this.hiddenKnown.has(dir)).map(([dir]) => dir)
      const failures = await hideDirectories(dirs), failed = new Set(failures.map(f => keyPath(f.dir)))
      for (const dir of dirs) if (!failed.has(keyPath(dir))) this.hiddenKnown.add(dir)
      for (const failure of failures) { problems.push(`${failure.dir}: 設定隱藏屬性失敗，下次掃描重試：${failure.error}`); progress.errors++ }
    }
    const ids = new Map<string, Set<string>>()
    for (const [dir, value] of cache) if (value.record) ids.set(value.record.folderId, new Set([...(ids.get(value.record.folderId) ?? []), dir]))
    for (const row of structure) if (row.record && (ids.get(row.record.folderId)?.size ?? 0) > 1) { row.duplicate = true; row.error = '重複 ID：暫停寫入，確認搬移或將副本分配新 ID' }
    progress.active = false; progress.cancelled = this.cancelled; this.progress({ ...progress })
    this.state = { projects, rows, structure, problems, progress, legacyAvailable: this.state.legacyAvailable }
    return this.snapshot()
  }
  private row(rowId: string, writable = false) {
    const row = (this.state.structure ?? this.state.rows).find(r => r.rowId === rowId)
    if (!row) throw new Error('資料已更新，請重新選取')
    if (writable && (row.error || row.duplicate || row.stopped || row.readonly || !row.record)) throw new Error('此項目前不可寫入，請先處理問題或重新啟用')
    return row
  }
  async checkedRow(rowId: string, writable = false) {
    const row = this.row(rowId, writable), root = this.linked(row.projectId).root
    await safePath(root, row.path)
    if (row.record) { const current = await readFolder(row.path); if (current.folderId !== row.record.folderId) throw new Error('目前位置已是另一資料夾，請重新掃描') }
    return row
  }
  async refreshRecord(rowId:string) {
    const row=await this.checkedRow(rowId),record=await readFolder(row.path)
    for(const item of new Set([...(this.state.structure??[]),...this.state.rows]))if(keyPath(item.path)===keyPath(row.path))item.record=structuredClone(record)
    return this.snapshot()
  }
  // Navigation is read-only: missing records are reported, never initialized here.
  async visit(rowId:string) {
    const row=this.row(rowId),root=this.linked(row.projectId).root
    await safePath(root,row.path)
    if(row.readonly||(this.state.structure??[]).some(r=>r.projectId===row.projectId&&r.path!==row.path&&r.boundary&&within(r.path,row.path)))throw new Error('此資料夾受遊戲邊界保護，無法建立資料')
    if(row.stopped)throw new Error('此資料夾尚未建立資料或已停止記錄')
    let record:FolderRecord
    try{record=await readFolder(row.path)}catch(e){if(missing(e))throw new Error('此資料夾尚未建立資料，請先明確重新掃描或建立記錄');throw e}
    if(row.record&&record.folderId!==row.record.folderId)throw new Error('目前位置已是另一資料夾，請重新掃描')
    if(row.error||row.duplicate)throw new Error(row.error??'記錄需要復原')
    row.record=record
    if(record.details?.boundary?.state!=='not-game'){
      const boundary=record.details?.boundary??await detectGame(row.path)
      if(boundary)row.boundary={...boundary,state:record.details?.boundary?.state??'candidate'}
    }
    const structure=this.state.structure??this.state.rows
    for(const entry of await fs.readdir(row.path,{withFileTypes:true})){
      if(entry.name.toLowerCase()===DATA_DIR||entry.isSymbolicLink()||!entry.isDirectory())continue
      const dir=path.join(row.path,entry.name)
      if(structure.some(r=>r.projectId===row.projectId&&keyPath(r.path)===keyPath(dir)))continue
      await safePath(root,dir)
      let childRecord:FolderRecord|undefined,error:string|undefined
      if(!row.boundary)try{childRecord=await readFolder(dir)}catch(e){if(!missing(e))error=message(e)}
      const duplicate=!!childRecord&&structure.some(r=>r.record?.folderId===childRecord!.folderId&&keyPath(r.path)!==keyPath(dir))
      structure.push({rowId:createHash('sha256').update(`${row.projectId}\0${keyPath(dir)}`).digest('hex'),projectId:row.projectId,path:dir,name:entry.name,depth:row.depth+1,record:childRecord,error:duplicate?'重複 ID：請先處理副本':error,duplicate,stopped:false,readonly:!!row.boundary})
    }
    this.state.structure=structure
    return this.snapshot()
  }
  async saveValues(rowId: string, revision: number, values: Record<string, string>) {
    const row = await this.checkedRow(rowId, true), p = this.linked(row.projectId).project!
    const record = await readFolder(row.path)
    const allowed = new Map([...p.fieldBindings.map(f => [f.attributeId, f.alias] as const), ...record.attributes.filter(a => a.type === 'string').map(a => [a.attributeId, a.key] as const)])
    for (const [attributeId, value] of Object.entries(values)) {
      if (!allowed.has(attributeId) || typeof value !== 'string' || value.length > 10000) throw new Error('文字欄位不合法或超過 10,000 字')
      const old = record.attributes.find(a => a.attributeId === attributeId)
      if (old && old.type !== 'string') throw new Error('欄位型別不符，不自動轉換')
      if (!old && !value) continue
      record.attributes = [...record.attributes.filter(a => a.attributeId !== attributeId), { attributeId, key: allowed.get(attributeId)!, type: 'string', value, source: 'manual' }]
    }
    await saveFolder(row.path, record, revision); return this.scan()
  }
  async addImage(rowId: string, revision: number, source: string) {
    const row = await this.checkedRow(rowId, true), record = await readFolder(row.path), bytes = await fs.readFile(source)
    const identified=identifyImage(bytes),media=identified?[identified.ext,identified.mime]:undefined
    if (!media) throw new Error('圖片格式未支援，請使用 PNG、JPEG、GIF、WebP、BMP、AVIF 或 ICO')
    if (record.revision !== revision) throw new Error('版本衝突，請重新載入後再選圖')
    const assetId = randomUUID(), relativePath = `assets/${assetId}.${media[0]}`, target = path.join(row.path, DATA_DIR, relativePath)
    await safePath(row.path, target); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, bytes, { flag: 'wx' })
    record.assets.push({ assetId, relativePath, originalName: path.basename(source), mediaType: media[1] })
    try { await saveFolder(row.path, record, revision) } catch (e) { await fs.unlink(target); throw e }
    return this.scan()
  }
  async asset(rowId: string, assetId: string) {
    const row = await this.checkedRow(rowId), record = await readFolder(row.path), asset = record.assets.find(a => a.assetId === assetId)
    if (!asset) throw new Error('圖片不存在')
    const file = path.join(row.path, DATA_DIR, asset.relativePath); await safePath(row.path, file)
    return { file, mediaType: asset.mediaType }
  }
  async resume(rowId: string) {
    const row = this.row(rowId)
    for (const linked of this.state.projects) if (linked.project && !linked.error && within(linked.root, row.path)) {
      const p = await this.currentProject(linked), rel = relPath(linked.root, row.path)
      await atomicJson(projectFile(linked.root, p.projectId), { ...p, revision: p.revision + 1, excludedRelativePaths: p.excludedRelativePaths.filter(r => r !== rel) }, p.revision)
    }
    return this.scan()
  }
  async copyIdentity(rowId: string) {
    const row = await this.checkedRow(rowId), record = await readFolder(row.path)
    if (!row.duplicate) throw new Error('此項不是重複 ID')
    if (this.refs.some(r => keyPath(r.root) === keyPath(row.path))) throw new Error('副本本身是專案根；先取消此根專案連結，再於父專案處理副本')
    record.folderId = randomUUID(); record.revision++
    await atomicJson(folderFile(row.path), record, record.revision - 1); return this.scan()
  }
  async restore(rowId: string) {
    const row = this.row(rowId), file = folderFile(row.path)
    await restoreJson(this.linked(row.projectId).root, file, validateFolder, backup => !row.record || backup.folderId === row.record.folderId)
    return this.scan()
  }
  async restoreProject(projectId: string) {
    const ref = this.refs.find(r => r.projectId === projectId)
    if (!ref) throw new Error('此專案未連結')
    const file = projectFile(ref.root, projectId)
    let project: Project, repairProject = false, repairRoot = false
    try { project = await this.currentProject(ref) }
    catch {
      await safePath(ref.root, `${file}.bak`)
      const backup = await readJson(`${file}.bak`); validateProject(backup)
      if (backup.projectId !== projectId) throw new Error('專案備份 ID 不符')
      project = backup; repairProject = true
    }
    let rootRecord: FolderRecord
    try { rootRecord = await readFolder(ref.root) }
    catch {
      await safePath(ref.root, `${folderFile(ref.root)}.bak`)
      const backup = await readJson(`${folderFile(ref.root)}.bak`); validateFolder(backup)
      rootRecord = backup; repairRoot = true
    }
    if (rootRecord.folderId !== project.rootFolderId) throw new Error('根資料夾與專案備份身分不符，未復原')
    // Validate both candidates before repairing either file. Retry is safe after a partial failure.
    if (repairRoot) await restoreJson(ref.root, folderFile(ref.root), validateFolder, value => value.folderId === project.rootFolderId)
    if (repairProject) await restoreJson(ref.root, file, validateProject, value => value.projectId === projectId && value.rootFolderId === rootRecord.folderId)
    return this.scan()
  }
  async previewCleanup(rowId?: string, scope: 'folder' | 'private' | 'all' = 'folder'): Promise<CleanupPreview> {
    const dirs = new Set<string>(), skipped: string[] = []
    const row = rowId ? this.row(rowId) : undefined
    if (row) dirs.add(row.path)
    else {
      const walk = async (dir: string, root: string): Promise<void> => {
        try {
          await safePath(root, dir)
          if (await exists(path.join(dir, DATA_DIR))) dirs.add(dir)
          for (const child of await fs.readdir(dir, { withFileTypes: true })) if (child.isDirectory() && !child.isSymbolicLink() && child.name !== DATA_DIR) await walk(path.join(dir, child.name), root)
        } catch (e) { skipped.push(`${dir}: ${message(e)}`) }
      }
      for (const root of new Set(this.refs.map(r => r.root))) await walk(root, root)
    }
    const entries: PlanEntry[] = []
    for (const dir of dirs) {
      try {
        const record = await readFolder(dir), files = [folderFile(dir)], records = [record], meta = path.join(dir, DATA_DIR)
        if (await exists(`${folderFile(dir)}.bak`)) { await safePath(dir, `${folderFile(dir)}.bak`); const b = await readJson(`${folderFile(dir)}.bak`); validateFolder(b); files.push(`${folderFile(dir)}.bak`); records.push(b) }
        if (scope !== 'private') {
          for (const asset of records.flatMap(r => [...r.assets, ...(r.details?.subtitles ?? [])])) if (await exists(path.join(meta, asset.relativePath))) files.push(path.join(meta, asset.relativePath))
          const projectDir = path.join(meta, 'projects')
          if (await exists(projectDir)) {
            await safePath(dir, projectDir)
            for (const name of await fs.readdir(projectDir)) {
              if (!/^[\w-]+\.json(\.bak)?$/.test(name)) continue
              const file = path.join(projectDir, name); await safePath(dir, file)
              const p = await readJson(file); validateProject(p)
              if (p.rootFolderId === record.folderId && name.startsWith(`${p.projectId}.json`)) files.push(file)
            }
          }
        }
        const owned = []
        for (const file of new Set(files)) { await safePath(dir, file); owned.push({ path: file, hash: await fingerprint(file) }) }
        entries.push({ dir, record, files: owned })
        // Unknown files are intentionally not included in the deletion plan.
        const known = new Set(owned.map(f => keyPath(f.path)))
        const inspect = async (folder: string): Promise<void> => {
          for (const e of await fs.readdir(folder, { withFileTypes: true })) {
            const file = path.join(folder, e.name)
            if (e.isDirectory() && !e.isSymbolicLink()) await inspect(file)
            else if (!known.has(keyPath(file)) && scope !== 'private') skipped.push(`${file}: 未驗證歸屬，保留`)
          }
        }
        await inspect(meta)
      } catch (e) { skipped.push(`${dir}: ${message(e)}`) }
    }
    if (scope === 'all' && this.state.legacyAvailable) skipped.push(`${path.join(this.userData, 'app-data')}: 舊版資料與匯入備份保留，未列入可攜 POC 清理`)
    const preview: CleanupPreview = { token: randomUUID(), paths: entries.flatMap(e => e.files.map(f => f.path)), skipped, count: entries.length, scope }
    if (scope === 'private' && (!row || !entries[0]?.record.projectOverrides[row.projectId]?.length)) throw new Error('沒有此專案私有覆寫可清理')
    this.plans.clear(); this.plans.set(preview.token, { preview, entries, rowId, projectId: row?.projectId }); return preview
  }
  async cleanup(token: string, restart: boolean): Promise<CleanupResult> {
    const plan = this.plans.get(token); if (!plan) throw new Error('清理預覽已失效，請重新預覽')
    this.plans.delete(token)
    for (const e of plan.entries) for (const f of e.files) { await safePath(e.dir, f.path); if (await fingerprint(f.path) !== f.hash) throw new Error('預覽後資料已變更，清理未執行，請重新預覽') }
    const result: CleanupResult = { removed: 0, failed: [], skipped: plan.preview.skipped }
    if (plan.preview.scope === 'private') {
      const e = plan.entries[0], record = await readFolder(e.dir); delete record.projectOverrides[plan.projectId!]
      await saveFolder(e.dir, record, record.revision); result.removed = 1; await this.scan(); return result
    }
    const roots = new Set(plan.entries.map(e => keyPath(e.dir)))
    const retained = this.state.projects.filter(l => !roots.has(keyPath(l.root)))
    if (plan.preview.scope !== 'all' && !restart) for (const linked of retained) {
      const targets = plan.entries.filter(e => within(linked.root, e.dir)).map(e => relPath(linked.root, e.dir))
      if (!targets.length) continue
      const p = await this.currentProject(linked)
      await atomicJson(projectFile(linked.root, p.projectId), { ...p, revision: p.revision + 1, excludedRelativePaths: [...new Set([...p.excludedRelativePaths, ...targets])] }, p.revision)
    }
    // Stop all affected roots before deleting their project definitions.
    this.refs = plan.preview.scope === 'all' ? [] : this.refs.filter(r => !roots.has(keyPath(r.root)))
    await this.persistRefs()
    for (const entry of plan.entries) {
      try {
        const ordered = [...entry.files.filter(f => f.path !== folderFile(entry.dir)), ...entry.files.filter(f => f.path === folderFile(entry.dir))]
        for (const f of ordered) {
          await safePath(entry.dir, f.path)
          if (await fingerprint(f.path) !== f.hash) throw new Error('清理期間檔案已變更，停止此筆清理')
          await fs.unlink(f.path)
        }
        for (const child of ['assets', 'projects', '']) await fs.rmdir(path.join(entry.dir, DATA_DIR, child)).catch(() => {})
        result.removed++
      } catch (e) { result.failed.push(`${entry.dir}: ${message(e)}`) }
    }
    if (plan.preview.scope === 'all') for (const file of [this.registry, `${this.registry}.bak`]) await fs.unlink(file).catch(e => { if (!missing(e)) result.failed.push(`${file}: ${message(e)}`) })
    await this.scan(); return result
  }
  async previewLegacy(): Promise<LegacyPreview> {
    const base = path.join(this.userData, 'app-data'), file = path.join(base, 'view.json')
    const views = await readJson(file)
    if (!Array.isArray(views)) throw new Error('舊 view.json 格式無法辨識')
    const token = randomUUID(), projects: LegacyPreview['projects'] = [], warnings: string[] = []
    for (const view of views) {
      if (!view || !/^[\w-]+$/.test(view.id) || typeof view.targetFolderPath !== 'string' || !path.isAbsolute(view.targetFolderPath)) { warnings.push('略過無法辨識的舊專案'); continue }
      let count = 0
      try {
        const ids = await readJson(path.join(base, 'viewFolder', `${view.id}.json`))
        if (Array.isArray(ids)) count = ids.length
      } catch (e) { warnings.push(`${view.name}: ${message(e)}`) }
      projects.push({ id: view.id, name: String(view.name), root: view.targetFolderPath, values: count })
    }
    warnings.push('只匯入可確認的 STRING 共用值；舊版面及其他型別保留在備份，不視為完整轉換。根路徑失效時先不要匯入。')
    this.legacyPlan = { token, hash: await fingerprint(file), views }
    return { token, projects, warnings }
  }
  async importLegacy(token: string, ids: string[], depth: Project['depth']) {
    const plan = this.legacyPlan, base = path.join(this.userData, 'app-data')
    if (!plan || plan.token !== token || plan.hash !== await fingerprint(path.join(base, 'view.json'))) throw new Error('匯入預覽已失效')
    const backup = path.join(this.userData, 'legacy-backups', randomUUID())
    await fs.cp(base, backup, { recursive: true, dereference: false, errorOnExist: true, force: false })
    const imported: string[] = [], warnings: string[] = []
    for (const view of plan.views.filter(v => ids.includes(v.id))) {
      try {
        if (!/^[\w-]+$/.test(view.id) || typeof view.targetFolderPath !== 'string') throw new Error('舊專案格式不符')
        const root = await fs.realpath(view.targetFolderPath)
        let linked = this.state.projects.find(r => keyPath(r.root) === keyPath(root) && r.project?.legacySourceId === view.id)
        if (!linked) {
          if (this.refs.some(r => keyPath(r.root) === keyPath(root))) throw new Error('此根已連結至另一專案，現有資料保留；請先取消連結再匯入')
          await this.create(root, { name: `${view.name}（匯入）`, mediaCategory: 'other', depth })
          linked = this.state.projects.at(-1)!
        }
        const project = linked.project!; project.legacySourceId = view.id
        const map = new Map<string, { id: string; key: string }>()
        const keys = await readJson(path.join(base, 'viewColumn', `${view.id}.json`))
        for (const key of Array.isArray(keys) ? keys : []) {
          if (typeof key !== 'string' || !/^[\w-]+$/.test(key)) { warnings.push('略過無法辨識的舊欄位 key'); continue }
          const col = await readJson(path.join(base, 'column', `${key}.json`)) as any
          if (col?.dataSource !== 'USER' || col.dataType !== 'STRING' || typeof col.id !== 'string') continue
          const attributeId = createHash('sha256').update(`legacy:${col.id}`).digest('hex')
          map.set(key, { id: attributeId, key })
        }
        if (map.size) { project.fieldBindings = [...map.values()].map(f => ({ alias: f.key, attributeId: f.id, type: 'string' })); project.cells = project.cells.map(c => c.kind === 'field-text' ? { ...c, attributeId: project.fieldBindings[0].attributeId } : c) }
        await this.saveProject(project)
        const folders = await readJson(path.join(base, 'viewFolder', `${view.id}.json`))
        for (const folderId of Array.isArray(folders) ? folders : []) {
          try {
            if (typeof folderId !== 'string' || !/^[\w-]+$/.test(folderId)) throw new Error('舊資料夾 ID 不符')
            const old = await readJson(path.join(base, 'folder', `${folderId}.json`)) as any
            if (typeof old?.lastReadPath !== 'string' || !within(root, old.lastReadPath)) throw new Error('舊路徑不在已確認根內')
            await safePath(root, old.lastReadPath)
            const row = this.state.rows.find(r => r.projectId === project.projectId && keyPath(r.path) === keyPath(old.lastReadPath))
            if (!row?.record || row.error) throw new Error('資料夾不在本次成功掃描結果內')
            const values: Record<string, string> = {}
            for (const cell of Array.isArray(old.cells) ? old.cells : []) {
              const binding = map.get(cell.key)
              if (binding && typeof cell.value === 'string' && !row.record.attributes.some(a => a.attributeId === binding.id)) values[binding.id] = cell.value
            }
            if (Object.keys(values).length) {
              const record = await readFolder(row.path)
              for (const [attributeId, value] of Object.entries(values)) record.attributes.push({ attributeId, key: [...map.values()].find(v => v.id === attributeId)!.key, type: 'string', source: 'legacy-import', value })
              await saveFolder(row.path, record, record.revision)
            }
          } catch (e) { warnings.push(`${folderId}: ${message(e)}`) }
        }
        imported.push(project.name)
      } catch (e) { warnings.push(`${view.name}: ${message(e)}`) }
    }
    await this.scan()
    return `已建立：${imported.join('、') || '無'}\n舊檔備份：${backup}\n${warnings.join('\n')}`
  }
}
