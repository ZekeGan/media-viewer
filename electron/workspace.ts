import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { atomicJson, missing, readJson, safePath } from './files'
import { defaultWorkspace, sectionIds, sectionProjects, type WorkspaceCommand, type WorkspacePrefs, type WorkspaceState } from '../shared/workspace'

const key = (v: unknown): v is string => typeof v === 'string' && /^[\w-]{1,100}$/.test(v) && !['__proto__', 'constructor', 'prototype'].includes(v)
const integer = (v: unknown, min: number, max = Number.MAX_SAFE_INTEGER) => Number.isInteger(v) && Number(v) >= min && Number(v) <= max
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v)
function groupName(v: unknown): string {
  if (typeof v !== 'string' || !v.trim() || v.trim().length > 60 || /[\x00-\x1f]/.test(v)) throw new Error('群組名稱需為 1～60 個字，不能含控制字元')
  return v.trim()
}
export function validateWorkspace(v: unknown): asserts v is WorkspacePrefs {
  if (!object(v) || v.schemaVersion !== 1 || !integer(v.revision, 0) || !integer(v.nextOrder, 1) || !integer(v.sidebarWidth, 200, 360) || typeof v.sidebarHidden !== 'boolean' || !object(v.collapsed) || typeof v.collapsed.favorites !== 'boolean' || typeof v.collapsed.recent !== 'boolean' || !Array.isArray(v.groups) || v.groups.length > 1000 || !v.groups.every(g => object(g) && key(g.id) && typeof g.name === 'string' && groupName(g.name) === g.name && typeof g.collapsed === 'boolean') || !object(v.projects) || Object.keys(v.projects).length > 50000) throw new Error('側欄設定格式不合法')
  const groups = new Set(v.groups.map(g => g.id)), names = new Set(v.groups.map(g => g.name.toLocaleLowerCase()))
  if (groups.size !== v.groups.length || names.size !== v.groups.length || !Object.entries(v.projects).every(([id, p]) => key(id) && object(p) && (p.groupId === null || groups.has(p.groupId)) && typeof p.favorite === 'boolean' && integer(p.addedOrder, 1) && p.addedOrder < v.nextOrder)) throw new Error('側欄群組或專案引用不合法')
  if (v.collapsed.unclassified !== undefined && typeof v.collapsed.unclassified !== 'boolean') throw new Error('未分類設定不合法')
  if (v.sections !== undefined && (!Array.isArray(v.sections) || new Set(v.sections).size !== v.sections.length || !v.sections.every(id => ['favorites', 'unclassified', ...groups].includes(id)))) throw new Error('群組順序不合法')
  if (v.projectOrder !== undefined && (!object(v.projectOrder) || !Object.entries(v.projectOrder).every(([id, list]) => key(id) && Array.isArray(list) && list.length <= 50000 && new Set(list).size === list.length && list.every(key)))) throw new Error('專案順序不合法')
  if (v.browse !== undefined && (!object(v.browse) || !Object.entries(v.browse).every(([id,b])=>key(id)&&object(b)&&['CARD','TABLE','TREE'].includes(b.mode)&&typeof b.location==='string'&&b.location.length<=10000&&integer(b.panelWidth,280,1000)&&object(b.widths)&&Object.entries(b.widths).every(([k,w])=>key(k)&&integer(w,80,1000))&&(b.scroll===undefined||typeof b.scroll==='number'&&b.scroll>=0&&b.scroll<1e9)&&(b.viewport===undefined||object(b.viewport)&&['x','y','zoom'].every(k=>typeof b.viewport[k]==='number'&&Number.isFinite(b.viewport[k]))&&b.viewport.zoom>=0.05&&b.viewport.zoom<=4)))) throw new Error('瀏覽設定不合法')
  if(v.browse&&Object.values(v.browse).some(b=>!object(b)||b.scrolls!==undefined&&(!object(b.scrolls)||!Object.entries(b.scrolls).every(([mode,value])=>['CARD','TREE','TABLE'].includes(mode)&&typeof value==='number'&&value>=0&&value<1e9))))throw new Error('捲動位置不合法')
  if(v.browse&&Object.values(v.browse).some(b=>!object(b)||b.panelVisible!==undefined&&typeof b.panelVisible!=='boolean'||b.detailId!==undefined&&!key(b.detailId)||b.locations!==undefined&&(!object(b.locations)||!Object.entries(b.locations).every(([k,p])=>['CARD','TREE','TABLE'].includes(k)&&typeof p==='string'&&p.length<=10000))))throw new Error('瀏覽位置或內容面板設定不合法')
  if(v.browse&&Object.values(v.browse).some(b=>!object(b)||b.treeCollapsed!==undefined&&(!Array.isArray(b.treeCollapsed)||b.treeCollapsed.length>50000||new Set(b.treeCollapsed).size!==b.treeCollapsed.length||!b.treeCollapsed.every(key))))throw new Error('樹狀收合設定不合法')
  if(v.browse&&Object.values(v.browse).some(b=>!object(b)||b.columnOrder!==undefined&&(!Array.isArray(b.columnOrder)||b.columnOrder.length>1003||new Set(b.columnOrder).size!==b.columnOrder.length||!b.columnOrder.every(key))))throw new Error('表格欄位順序不合法')
}
export class WorkspaceStore {
  readonly file: string
  private prefs = defaultWorkspace()
  private error?: string
  private onDisk = false
  private tail: Promise<unknown> = Promise.resolve()
  constructor(private root: string) { this.file = path.join(root, 'workspace-ui.json') }
  async init() {
    await fs.mkdir(this.root, { recursive: true })
    try { await safePath(this.root, this.file); const value = await readJson(this.file); validateWorkspace(value); this.prefs = value; this.onDisk = true }
    catch (error) { if (!missing(error)) this.error = `側欄設定無法讀取，原檔保留；暫用預設且停止保存。${String(error)}` }
  }
  private run<T>(fn: () => Promise<T>) { const next = this.tail.then(fn); this.tail = next.catch(() => {}); return next }
  private state(): WorkspaceState { return { prefs: structuredClone(this.prefs), ...(this.error ? { error: this.error } : {}) } }
  private sync(next: WorkspacePrefs, ids: string[]) {
    for (const id of ids) {
      if (!key(id)) throw new Error('專案身分不合法')
      if (!Object.hasOwn(next.projects, id)) next.projects[id] = { groupId: null, favorite: false, addedOrder: next.nextOrder++ }
    }
  }
  private async commit(next: WorkspacePrefs) {
    next.revision = this.prefs.revision + 1; validateWorkspace(next)
    await safePath(this.root, this.file)
    await atomicJson(this.file, next, this.onDisk ? this.prefs.revision : undefined)
    this.prefs = next; this.onDisk = true
  }
  read(ids: string[]): Promise<WorkspaceState> {
    return this.run(async () => {
      const next = structuredClone(this.prefs); this.sync(next, ids)
      if (this.error) { this.prefs = next; return this.state() }
      if (next.nextOrder !== this.prefs.nextOrder) await this.commit(next)
      return this.state()
    })
  }
  update(command: WorkspaceCommand, ids: string[]): Promise<WorkspaceState> {
    return this.run(async () => {
      if (this.error) throw new Error(this.error)
      if (!object(command)) throw new Error('無效的側欄操作')
      const next = structuredClone(this.prefs); this.sync(next, ids)
      const group = (id: string) => { const g = next.groups.find(g => g.id === id); if (!g) throw new Error('群組不存在'); return g }
      const project = (id: string) => { if (!ids.includes(id) || !Object.hasOwn(next.projects, id)) throw new Error('專案尚未連結'); return next.projects[id] }
      const bool = (v: unknown) => { if (typeof v !== 'boolean') throw new Error('設定值必須為布林'); return v }
      const name = (v: unknown, except?: string) => { const n = groupName(v); if (next.groups.some(g => g.id !== except && g.name.toLocaleLowerCase() === n.toLocaleLowerCase())) throw new Error('群組名稱已存在'); return n }
      const orderProject = (id: string, section: string, before?: string) => {
        project(id)
        const members = sectionProjects(ids, next, section)
        if (!members.includes(id) || (before !== undefined && (!members.includes(before) || before === id))) throw new Error('排序目標不合法')
        const list = members.filter(v => v !== id); list.splice(before ? list.indexOf(before) : list.length, 0, id)
        next.projectOrder ??= {}; next.projectOrder[section] = list
      }
      switch (command.action) {
        case 'browse': {
          project(command.projectId)
          const value=structuredClone(command.value)
          // Pointer coordinates can be fractional at Windows display scaling.
          if(object(value)){
            if(typeof value.panelWidth==='number'&&Number.isFinite(value.panelWidth)&&value.panelWidth>=280&&value.panelWidth<=1000)value.panelWidth=Math.round(value.panelWidth)
            if(object(value.widths))for(const [id,width]of Object.entries(value.widths))if(typeof width==='number'&&Number.isFinite(width)&&width>=80&&width<=1000)value.widths[id]=Math.round(width)
          }
          next.browse??={};next.browse[command.projectId]=value;break
        }
        case 'createGroup': { const ids=sectionIds(next),id = randomUUID(); next.groups.push({ id, name: name(command.name), collapsed: false }); ids.splice(ids.indexOf('unclassified'),0,id);next.sections=ids;break }
        case 'renameGroup': group(command.id).name = name(command.name, command.id); break
        case 'removeGroup': group(command.id); next.groups = next.groups.filter(g => g.id !== command.id); next.sections = sectionIds(next); if (next.projectOrder) delete next.projectOrder[command.id]; for (const p of Object.values(next.projects)) if (p.groupId === command.id) p.groupId = null; break
        case 'collapseGroup': group(command.id).collapsed = bool(command.value); break
        case 'moveProject': if (command.groupId !== null) group(command.groupId); project(command.projectId).groupId = command.groupId; orderProject(command.projectId, command.groupId ?? 'unclassified', command.beforeId); break
        case 'reorderSections': { const all = sectionIds(next); if (!Array.isArray(command.ids) || command.ids.length !== all.length || new Set(command.ids).size !== all.length || !command.ids.every(id => all.includes(id))) throw new Error('群組排序需包含全部群組且不可重複'); next.sections = command.ids; break }
        case 'reorderProject': if (!sectionIds(next).includes(command.sectionId)) throw new Error('群組不存在'); orderProject(command.projectId, command.sectionId, command.beforeId); break
        case 'favorite': project(command.projectId).favorite = bool(command.value); break
        case 'collapseSection': if (!['favorites', 'unclassified'].includes(command.section)) throw new Error('未知區塊'); next.collapsed[command.section] = bool(command.value); break
        case 'layout':
          if (command.sidebarWidth !== undefined) { if (!integer(command.sidebarWidth, 200, 360)) throw new Error('欄寬需為 200～360'); next.sidebarWidth = command.sidebarWidth }
          if (command.sidebarHidden !== undefined) next.sidebarHidden = bool(command.sidebarHidden)
          break
        default: throw new Error('不支援的側欄操作')
      }
      await this.commit(next); return this.state()
    })
  }
}
