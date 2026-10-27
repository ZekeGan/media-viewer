import type { FolderRow, Project } from './model'
import type { BrowseMode } from './explorer'
export const pathKey=(p:string)=>p.replace(/\\/g,'/').replace(/\/$/,'').toLocaleLowerCase()
export const parentPath=(p:string)=>p.replace(/[\\/][^\\/]+[\\/]?$/,'')
export const cardDisplay=(p:Project):NonNullable<Project['cardView']>=>p.cardView??{mode:p.depth.mode==='exact'?'single':'multi',level:p.scanAll?'all':p.depth.level}
export function browserRows(rows:FolderRow[],project:Project,root:string,mode:BrowseMode,location:string){
  const display=cardDisplay(project)
  const known=rows.filter(r=>!r.readonly&&(r.record||r.error||r.stopped))
  if(mode==='TREE')return known
  if(mode==='TABLE'||mode==='CARD'&&display.mode==='single'&&location)return rows.filter(r=>pathKey(parentPath(r.path))===pathKey(location||root))
  if(display.mode==='single')return known.filter(r=>r.depth===display.level)
  return known.filter(r=>display.level==='all'||r.depth<=display.level)
}
