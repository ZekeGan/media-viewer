import type { Cell, FolderRow, Project } from './model'
export function projectImageCells(project:Project):Cell[]{
  return [...new Map([...project.cells,...project.layoutPresets?.flatMap(p=>p.cells)??[],...Object.values(project.contentCells??{}).flat()].filter(c=>c.kind==='image').map(c=>[c.cellId,c])).values()]
}
export interface EditorField { attributeId:string; key:string; type:string; shared:boolean; private:boolean; conflict:boolean; hasData:boolean }
export function editorFields(rows:FolderRow[],projectId:string):EditorField[]{
  const fields=new Map<string,EditorField>()
  for(const row of rows.filter(r=>r.projectId===projectId)){
    for(const [scope,attributes] of [['shared',row.record?.attributes??[]],['private',row.record?.projectOverrides[projectId]??[]]] as const){
      for(const attribute of attributes){
        if(!['string','tags','number','datetime'].includes(attribute.type))continue
        const previous=fields.get(attribute.attributeId)
        const hasData=attribute.value!=null&&(typeof attribute.value==='string'?attribute.value.trim().length>0:Array.isArray(attribute.value)?attribute.value.length>0:true)
        if(previous){previous[scope]=true;previous.conflict||=previous.type!==attribute.type;previous.hasData||=hasData}
        else fields.set(attribute.attributeId,{attributeId:attribute.attributeId,key:attribute.key,type:attribute.type,shared:scope==='shared',private:scope==='private',conflict:false,hasData})
      }
    }
  }
  return [...fields.values()]
}
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
