import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { Snapshot, FolderRow } from '../shared/model'
import { fieldValue } from '../shared/model'
import type { SearchResult } from '../shared/explorer'
import { parseQuery, describeQuery, normalizeValue } from '../shared/query'
export class SearchIndex {
  private db: DatabaseSync
  private versions = new Map<string,string>()
  private snapshot?: Snapshot
  private fields: SearchResult['fields'] = []
  constructor(readonly file: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    try { this.db = new DatabaseSync(file); this.db.exec('PRAGMA quick_check;') }
    catch { if (fs.existsSync(file)) fs.renameSync(file, file + '.damaged-' + Date.now()); this.db = new DatabaseSync(file) }
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS docs(id TEXT PRIMARY KEY,project TEXT,name TEXT,path TEXT);
      CREATE TABLE IF NOT EXISTS vals(doc TEXT REFERENCES docs(id) ON DELETE CASCADE,field TEXT,key TEXT,type TEXT,text TEXT);
      CREATE INDEX IF NOT EXISTS by_project ON docs(project); CREATE INDEX IF NOT EXISTS by_field ON vals(field,doc); CREATE INDEX IF NOT EXISTS by_doc ON vals(doc,field);
      CREATE TABLE IF NOT EXISTS grams(gram TEXT,doc TEXT REFERENCES docs(id) ON DELETE CASCADE,field TEXT,PRIMARY KEY(gram,doc,field));
      CREATE INDEX IF NOT EXISTS grams_doc ON grams(doc);
      DELETE FROM grams; DELETE FROM vals; DELETE FROM docs;`)
  }
  close() { this.db.close() }
  sync(snapshot: Snapshot, force = false) {
    this.snapshot = snapshot
    const keys = new Map<string,SearchResult['fields'][number]>()
    const rows = snapshot.rows, present = new Set(rows.map(r => r.rowId))
    const insertDoc = this.db.prepare('INSERT INTO docs VALUES(?,?,?,?)'), insertVal = this.db.prepare('INSERT INTO vals VALUES(?,?,?,?,?)'), insertGram = this.db.prepare('INSERT OR IGNORE INTO grams VALUES(?,?,?)'), remove = this.db.prepare('DELETE FROM docs WHERE id=?')
    const nextVersions = new Map(this.versions)
    this.db.exec('BEGIN')
    try {
      for (const id of this.versions.keys()) if (!present.has(id)) { remove.run(id); nextVersions.delete(id) }
      for (const row of rows) {
        const project = snapshot.projects.find(p => p.projectId === row.projectId)?.project
        const values = [{ field: '@name', key: 'folder_name', type: 'string', text: normalizeValue(row.name,'string') }, { field: '@path', key: 'path', type: 'string', text: normalizeValue(row.path,'string') }]
        const all = new Map([...row.record?.attributes ?? [], ...row.record?.projectOverrides[row.projectId] ?? []].map(a => [a.attributeId,a]))
        for (const a of all.values()) if (['string','tags','number','datetime'].includes(a.type)) {
          const alias = project?.fieldBindings.find(f => f.attributeId === a.attributeId)?.alias ?? a.key
          values.push({ field: a.attributeId, key: alias.toLocaleLowerCase(), type: a.type, text: normalizeValue(fieldValue(row,a.attributeId),a.type) })
          keys.set(`${row.projectId}/${a.attributeId}`, { key: alias, type: a.type, projectId: row.projectId, attributeId: a.attributeId })
        }
        for (const f of project?.fieldBindings ?? []) keys.set(`${row.projectId}/${f.attributeId}`, { key: f.alias, type: f.type, projectId: row.projectId, attributeId: f.attributeId })
        const signature = createHash('sha256').update(JSON.stringify([row.path,row.name,values])).digest('hex')
        if (!force && this.versions.get(row.rowId) === signature) continue
        remove.run(row.rowId); insertDoc.run(row.rowId,row.projectId,row.name,row.path)
        for (const v of values) {
          insertVal.run(row.rowId,v.field,v.key,v.type,v.text)
          const chars = [...v.text]; const grams = new Set<string>(); for (let i=0;i<chars.length-2;i++) grams.add(chars.slice(i,i+3).join(''))
          for (const gram of grams) insertGram.run(gram,row.rowId,v.field)
        }
        nextVersions.set(row.rowId,signature)
      }
      this.db.exec('COMMIT'); this.versions = nextVersions; this.fields = [...keys.values()]
    } catch (e) { this.db.exec('ROLLBACK'); throw e }
  }
  search(query: string, projectId?: string, offset = 0, limit = 100): SearchResult {
    if (!Number.isInteger(offset) || offset<0 || !Number.isInteger(limit) || limit<1 || limit>500) throw new Error('查詢分頁不合法')
    if (projectId && !this.snapshot?.projects.some(p => p.projectId === projectId)) throw new Error('搜尋專案未連結')
    const groups = parseQuery(query), params: (string|number)[] = [], available = this.fields.filter(f => !projectId || f.projectId === projectId)
    const conditions = groups.map(g => '('+(g.map(t => {
      let fields: string[] | undefined, type = 'string'
      if (t.key) {
        const marker=t.key.lastIndexOf('@'),hasExact=available.some(f=>f.key.toLocaleLowerCase()===t.key),key=marker<0||hasExact?t.key:t.key.slice(0,marker),explicit=marker<0||hasExact?undefined:t.key.slice(marker+1),found = available.filter(f => f.key.toLocaleLowerCase() === key && (!explicit || f.attributeId.toLocaleLowerCase() === explicit))
        fields = [...new Set(found.map(f=>f.attributeId))]; type = found[0]?.type ?? 'string'
        if (!fields.length && ['name','folder_name','path'].includes(key) && !explicit) fields = [key === 'path' ? '@path' : '@name']
        if (!fields.length) throw new Error(`找不到欄位「${t.key}」，可從欄位提示選擇`)
        if (fields.length > 1 || new Set(found.map(f=>f.type)).size > 1) throw new Error(`欄位「${key}」有多個身分；請使用提示中的 key@完整屬性ID`)
      }
      const value = normalizeValue(t.value,type), gram = [...value].slice(0,3).join('')
      let sql = 'v.doc=d.id'
      if (fields) { sql += ' AND v.field=?'; params.push(fields[0]) }
      if ([...value].length >= 3) { sql += ' AND EXISTS(SELECT 1 FROM grams g WHERE g.gram=? AND g.doc=v.doc AND g.field=v.field)'; params.push(gram) }
      sql += ' AND instr(v.text,?)>0'; params.push(value)
      return `${t.exclude ? 'NOT ' : ''}EXISTS(SELECT 1 FROM vals v WHERE ${sql})`
    }).join(' AND ') || '1')+')').join(' OR ')
    const where = (projectId ? 'd.project=? AND ' : '') + `(${conditions})`, args = projectId ? [projectId,...params] : params
    const total = Number(this.db.prepare(`SELECT count(*) n FROM docs d WHERE ${where}`).get(...args)!.n)
    const hits = this.db.prepare(`SELECT id rowId,project projectId,name,path FROM docs d WHERE ${where} ORDER BY name COLLATE NOCASE,id LIMIT ? OFFSET ?`).all(...args,limit,offset).map(v => ({ rowId:String(v.rowId),projectId:String(v.projectId),name:String(v.name),path:String(v.path),matched: this.db.prepare('SELECT key,text FROM vals WHERE doc=?').all(String(v.rowId)).filter(v=>groups.flat().some(t=>!t.exclude&&String(v.text).includes(t.value))).map(v=>String(v.key)) }))
    return { hits,total,fields:available,incomplete:this.snapshot?.projects.filter(p=>p.error&&(!projectId||p.projectId===projectId)).map(p=>p.root)??[],parsed:describeQuery(groups),index:'SQLite · 三字索引／短字範圍掃描' }
  }
}
