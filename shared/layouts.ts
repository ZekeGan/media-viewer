import type { Cell, Project } from './model'
export const legacyDefault = (cells:Cell[]) => cells.length===4&&cells.every((c,i)=>c.kind===['name','path','field-text','open-folder'][i]&&c.grid.x===0&&c.grid.y===i&&c.grid.w===12&&c.grid.h===1&&c.style.textColor==='#243247'&&c.style.backgroundColor==='#ffffff')
export function visibleCells(project:Pick<Project,'cells'|'layoutPresets'>):Cell[]{
  return !project.layoutPresets&&legacyDefault(project.cells)?project.cells.map(c=>({...c,style:{textColor:'#e4e6e8',backgroundColor:'transparent'}})):project.cells
}
export function cardPresets(project:Project){return project.layoutPresets??[{id:'default',name:'預設版面',cells:visibleCells(project)}]}
export function saveCardPreset(project:Project,options:{name:string;asNew:boolean},makeId:()=>string,base:Project=project):Project{
  const presets=cardPresets(base),name=options.name.trim(),id=options.asNew?makeId():project.activeLayoutId??presets[0].id
  if(!name||name.length>100||presets.some(p=>p.id!==id&&p.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('方案名稱需為 1～100 字，且不可重複')
  const preset={id,name,cells:structuredClone(project.cells)}
  return {...project,layoutPresets:options.asNew?[...presets,preset]:presets.map(p=>p.id===id?preset:p),activeLayoutId:id}
}
