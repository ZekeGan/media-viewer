import {Icon} from './icons'
import {t as tr, useLocale} from './i18n'
import { cellColors } from './themes/cellStyle'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Accordion, ActionIcon, Badge, Button, Checkbox, ColorInput, Group, Menu, Modal, NumberInput, Select, Stack, TagsInput, Text, Textarea, TextInput, Tooltip } from '@mantine/core'
import GridLayout, { useContainerWidth, type Layout } from 'react-grid-layout'
import { type Cell, type CellKind, type FolderRow, type Project } from '../shared/model'
import { CellContent } from './Card'
import { cellType, isFieldKind } from '../shared/explorer'
import { cardPresets, editorFields, presetDraft, syncPresetDraft, selectPreset, addPreset, renamePreset, removePreset } from '../shared/layouts'

const typeKinds:Record<string,CellKind>={string:'field-text',tags:'field-tags',number:'field-number',datetime:'field-date',boolean:'field-boolean',enum:'field-enum',url:'field-url',date:'field-date-only'}
export function Editor({ project, rows, busy, save, close, onDirty, targetLabel=tr("卡片"),presets=false }: { project: Project; rows: FolderRow[]; busy: boolean; save: (p: Project,preset?:{name:string;asNew:boolean}) => Promise<boolean>; close: () => void; onDirty: (dirty: boolean) => void; targetLabel?:string;presets?:boolean }) {
const labels: Record<CellKind, string> = { name: tr("資料夾名稱"), path: tr("目前路徑"), 'field-text': tr("自訂文字"), 'field-tags':tr("標籤"),'field-number':tr("數字"),'field-date':tr("日期時間"),'field-boolean':tr('是／否'),'field-enum':tr('單選'),'field-url':tr('網址'),'field-date-only':tr('日期'),'static-text':tr('固定文字'),spacer:tr('空白間距'),'system-info':tr('系統資訊'),image:tr("圖片"),divider:tr("分隔線"), 'open-folder': tr("開啟資料夾") }
const typeLabels:Record<string,string>={string:tr("文字"),tags:tr("標籤"),number:tr("數字"),datetime:tr("日期時間"),boolean:tr('是／否'),enum:tr('單選'),url:tr('網址'),date:tr('日期')}

 useLocale()

  const [initial,setInitial] = useState(() => presets?presetDraft(project):structuredClone(project))
  const [draft, setDraft] = useState(() => structuredClone(initial))
  const [past, setPast] = useState<Project[]>([]), [future, setFuture] = useState<Project[]>([])
  const [selected, setSelected] = useState(''), [previewId, setPreviewId] = useState<string | undefined>(rows[0]?.rowId)
  const [newField, setNewField] = useState(''), [error, setError] = useState('')
  const [newType,setNewType]=useState('string')
  const [newOptions,setNewOptions]=useState('')
  const [schemeAction,setSchemeAction]=useState<'new'|'copy'|'rename'>(),[schemeName,setSchemeName]=useState('')
  const [pendingPreset,setPendingPreset]=useState<string>()
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  useLayoutEffect(() => { onDirty(dirty); return () => onDirty(false) }, [dirty, onDirty])
  const { width, containerRef, mounted } = useContainerWidth()
  const selectedCell = draft.cells.find(c => c.cellId === selected), preview = rows.find(r => r.rowId === previewId)
  const sources=useMemo(()=>editorFields(rows,project.projectId),[rows,project.projectId])
  const availableFields=sources.filter(a=>!draft.fieldBindings.some(f=>f.attributeId===a.attributeId))
  const change = (next: Project) => { if (JSON.stringify(next) === JSON.stringify(draft)) return; setPast([...past.slice(-49), structuredClone(draft)]); setFuture([]); setDraft(next) }
  const updateCell = (update: Partial<Cell>) => change({ ...draft, cells: draft.cells.map(c => c.cellId === selected ? { ...c, ...update } : c) })
  const layoutChange = (layout: Layout) => {
    change({ ...draft, cells: draft.cells.map(c => { const item = layout.find(l => l.i === c.cellId); return item ? { ...c, grid: { x: item.x, y: item.y, w: item.w, h: item.h } } : c }) })
  }
  const add = (kind: CellKind, grid?: Cell['grid'], layout?: Layout, source?:Project['fieldBindings'][number]) => {
    if(source&&source.type!==cellType(kind)){setError(tr("欄位與組件型別不符"));return}
    if (draft.cells.length >= 50) { setError(tr("POC 每張卡片最多 50 個組件")); return }
    const cells = draft.cells.map(c => { const moved = layout?.find(l => l.i === c.cellId); return moved ? { ...c, grid: { x: moved.x, y: moved.y, w: moved.w, h: moved.h } } : c })
    const y = Math.max(0, ...cells.map(c => c.grid.y + c.grid.h))
    let bindings=draft.fieldBindings,attributeId=source?.attributeId
    if(source&&!bindings.some(f=>f.attributeId===source.attributeId)){
      let alias=source.alias||tr("欄位"),i=2
      while(bindings.some(f=>f.alias.toLocaleLowerCase()===alias.toLocaleLowerCase()))alias=(source.alias||tr("欄位"))+'_'+i++
      bindings=[...bindings,{...source,alias,...(source.type==='enum'&&!source.options?{options:[...new Set(rows.map(row=>row.record?.projectOverrides[project.projectId]?.find(attribute=>attribute.attributeId===source.attributeId)?.value??row.record?.attributes.find(attribute=>attribute.attributeId===source.attributeId)?.value).filter((value):value is string=>typeof value==='string'&&value.length>0&&value.length<=100))]}:{})}]
    }
    attributeId??=bindings.find(f=>f.type===cellType(kind))?.attributeId
    if(isFieldKind(kind)&&!attributeId){attributeId=crypto.randomUUID();let alias=cellType(kind),i=2;while(bindings.some(f=>f.alias.toLowerCase()===alias.toLowerCase()))alias=`${cellType(kind)}_${i++}`;bindings=[...bindings,{attributeId,alias,type:cellType(kind)}]}
    if(kind==='image')attributeId=crypto.randomUUID()
    const cell: Cell = { cellId: crypto.randomUUID(), kind, ...(isFieldKind(kind)||kind==='image' ? { attributeId } : {}), grid: grid ?? { x: 0, y, w: 12, h: kind==='image'?3:1 }, style: { textColor: '#e4e6e8', backgroundColor: 'transparent' } }
    if (cell.grid.y + cell.grid.h > 100) { setError(tr("畫布沒有空間，請先移動或刪除組件")); return }
    change({ ...draft, fieldBindings:bindings,cells: [...cells, cell] }); setSelected(cell.cellId);setError('')
  }
  const removeSelected=()=>{if(!selected||busy)return;change({...draft,cells:draft.cells.filter(c=>c.cellId!==selected)});setSelected('')}
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.key!=='Delete'||event.isComposing||event.defaultPrevented||!selected||busy)return
      if((event.target as HTMLElement)?.closest('input,textarea,select,[role="combobox"],[contenteditable="true"],.mantine-Modal-content'))return
      event.preventDefault();removeSelected()
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)
  },[draft,selected,past,busy])
  type Binding=Project['fieldBindings'][number]
  const paletteField=(binding:Binding)=>{
    const source=sources.find(f=>f.attributeId===binding.attributeId),kind=typeKinds[binding.type]
    if(!kind)return null
    return <div key={binding.attributeId} className="palette-item palette-field" data-attribute-id={binding.attributeId} draggable={!source?.conflict} onDragStart={e=>{e.dataTransfer.setData('text/plain',kind);e.dataTransfer.setData('application/x-media-viewer-field',binding.attributeId);e.dataTransfer.effectAllowed='copy'}}>
      <Button fullWidth variant="default" disabled={source?.conflict} title={source?.conflict?tr("同一欄位的型別不一致，請先處理資料衝突"):binding.alias} onClick={()=>add(kind,undefined,undefined,binding)}><span className="palette-field-name">{binding.alias||tr("未命名欄位")}</span><span className="palette-field-meta"><span>{typeLabels[binding.type]}</span><span>{tr('使用 {0} 次',draft.cells.filter(cell=>cell.attributeId===binding.attributeId).length)}</span><Badge size="xs" color={source?.shared===false&&source.private?'orange':'gray'}>{source?.shared===false&&source.private?tr("專案私有"):tr("共用")}</Badge>{source?.shared&&source.private&&<Badge size="xs" color="orange">{tr("有專案覆寫")}</Badge>}</span></Button>
    </div>
  }
  const switchTo=(id:string)=>{const current=draft.layoutPresets?.find(preset=>preset.id===draft.activeLayoutId);if(current&&JSON.stringify(current.cells)!==JSON.stringify(draft.cells)){setPendingPreset(id);return}change(selectPreset(draft,id))}
  const applyScheme=()=>{try{change(schemeAction==='rename'?renamePreset(draft,schemeName):addPreset(draft,schemeName,crypto.randomUUID(),schemeAction==='copy'));setSchemeAction(undefined);setError('')}catch(reason){setError(String(reason))}}
  const leave = () => { if (!dirty || window.confirm(tr("放棄尚未保存的版面變更？"))) close() }
  return <section className="editor-page">
    <Group justify="space-between" mb="md"><div><h2>{tr("CELL 積木編輯器")}</h2><p>{tr("編輯「")}{project.name}{tr("」所有")}{targetLabel}{tr("共用的模板")}</p></div><Group>
      <Button variant="default" onClick={leave}>{tr('取消')}</Button><Button loading={busy} onClick={async()=>{if(await save(presets?syncPresetDraft(draft):draft))close()}}>{tr('儲存變更')}</Button>
    </Group></Group>
    {presets&&<Group mb="md"><Select label={tr('版面方案')} allowDeselect={false} value={draft.activeLayoutId} data={draft.layoutPresets!.map(preset=>({value:preset.id,label:preset.id==='default'&&preset.name==='預設版面'?tr('預設版面'):preset.name}))} onChange={id=>id&&switchTo(id)}/><Button variant="light" onClick={()=>{setSchemeName('');setSchemeAction('new')}}>{tr('新增方案')}</Button><Menu><Menu.Target><ActionIcon aria-label={tr('方案操作')} variant="default"><Icon name="more"/></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item onClick={()=>{setSchemeName('');setSchemeAction('copy')}}>{tr('複製方案')}</Menu.Item><Menu.Item onClick={()=>{setSchemeName(draft.layoutPresets!.find(p=>p.id===draft.activeLayoutId)!.name);setSchemeAction('rename')}}>{tr('重新命名')}</Menu.Item><Menu.Item color="red" disabled={draft.layoutPresets!.length<2} onClick={()=>change(removePreset(draft))}>{tr('刪除方案')}</Menu.Item></Menu.Dropdown></Menu></Group>}
    <Group mb="sm" gap="xs"><Tooltip label={tr('復原')}><ActionIcon aria-label={tr('復原')} variant="subtle" disabled={!past.length} onClick={()=>{setFuture([draft,...future]);setDraft(past.at(-1)!);setPast(past.slice(0,-1))}}><Icon name="undo"/></ActionIcon></Tooltip><Tooltip label={tr('重做')}><ActionIcon aria-label={tr('重做')} variant="subtle" disabled={!future.length} onClick={()=>{setPast([...past,draft]);setDraft(future[0]);setFuture(future.slice(1))}}><Icon name="redo"/></ActionIcon></Tooltip></Group>
    <Modal opened={!!schemeAction} onClose={()=>setSchemeAction(undefined)} title={schemeAction==='new'?tr('新增方案'):schemeAction==='copy'?tr('複製方案'):tr('重新命名')}><Stack>{error&&<p role="alert" className="error">{error}</p>}<TextInput label={tr('方案名稱')} value={schemeName} maxLength={100} onChange={event=>setSchemeName(event.currentTarget.value)}/><Button disabled={!schemeName.trim()} onClick={applyScheme}>{tr('確認')}</Button></Stack></Modal>
    <Modal opened={!!pendingPreset} onClose={()=>setPendingPreset(undefined)} title={tr('目前方案有未保存的調整')}><Stack><Button disabled={busy} onClick={async()=>{if(await save(syncPresetDraft(draft))){setInitial(syncPresetDraft(draft));const next=selectPreset(draft,pendingPreset!);setDraft(next);setPast([]);setFuture([]);setPendingPreset(undefined)}}}>{tr('保存後切換')}</Button><Button variant="default" onClick={()=>{const current=draft.layoutPresets!.find(p=>p.id===draft.activeLayoutId)!;change(selectPreset({...draft,cells:structuredClone(current.cells)},pendingPreset!));setPendingPreset(undefined)}}>{tr('捨棄')}</Button><Button variant="subtle" onClick={()=>setPendingPreset(undefined)}>{tr('繼續編輯')}</Button></Stack></Modal>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="editor">
      <aside className="editor-palette" aria-label={tr("拖入組件")}><h3>{tr("組件")}</h3>
        <section className="palette-section"><h4>{tr("基礎組件")}</h4><div className="basic-palette">{(['name','path','static-text','spacer','system-info','image','divider','open-folder'] as CellKind[]).map(kind=><div key={kind} className="palette-item" draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',kind);e.dataTransfer.effectAllowed='copy'}}><Button fullWidth size="xs" variant="default" onClick={()=>add(kind)}>{labels[kind]}</Button></div>)}</div></section>
        <section className="project-field-palette"><h4>{tr('專案欄位')}</h4><Stack gap="xs">{draft.fieldBindings.map(binding=>paletteField(binding))}</Stack></section>
        <Accordion variant="separated" className="existing-fields"><Accordion.Item value="existing"><Accordion.Control>{tr("引用資料夾既有欄位")}<Badge size="xs" color="gray">{availableFields.length}</Badge></Accordion.Control><Accordion.Panel>

          {availableFields.some(f=>f.shared)&&<><Text size="sm" fw={600} mb="xs">{tr("共用欄位")}</Text><Stack gap="xs" mb="sm">{availableFields.filter(f=>f.shared).map(f=>paletteField({attributeId:f.attributeId,alias:f.key,type:f.type}))}</Stack></>}
          {availableFields.some(f=>!f.shared&&f.private)&&<><Text size="sm" fw={600} mb="xs">{tr("本專案私有欄位")}</Text><Stack gap="xs">{availableFields.filter(f=>!f.shared&&f.private).map(f=>paletteField({attributeId:f.attributeId,alias:f.key,type:f.type}))}</Stack></>}
          {!availableFields.length&&<Text size="xs" c="dimmed">{tr("沒有尚未引用的既有欄位。")}</Text>}
        </Accordion.Panel></Accordion.Item></Accordion>
        <form className="new-field-form" aria-label={tr("新增欄位")} onSubmit={e=>{e.preventDefault();const alias=newField.trim();if(!alias||draft.fieldBindings.some(f=>f.alias.toLocaleLowerCase()===alias.toLocaleLowerCase())){setError(tr("請輸入未使用的欄位名稱"));return}change({...draft,fieldBindings:[...draft.fieldBindings,{alias,attributeId:crypto.randomUUID(),type:newType,...(newType==='enum'?{options:[...new Set(newOptions.split(/[,，\n]/).map(option=>option.trim()).filter(Boolean))]}:{})}]});setNewField('');setNewOptions('');setError('')}}>
          <h4>{tr("新增欄位")}</h4>
          <TextInput label={tr("欄位名稱")} placeholder={tr("例如：作者、評分")} value={newField} maxLength={100} required onChange={e=>setNewField(e.currentTarget.value)}/>
          <Select label={tr("欄位型別")} allowDeselect={false} value={newType} onChange={v=>v&&setNewType(v)} data={Object.entries(typeLabels).map(([value,label])=>({value,label}))}/>
          {newType==='enum'&&<Textarea label={tr('選項（逗號或換行分隔）')} value={newOptions} onChange={event=>setNewOptions(event.currentTarget.value)}/>}
          <Button type="submit" fullWidth variant="default" disabled={!newField.trim()||newType==='enum'&&!newOptions.trim()}>{tr("新增欄位")}</Button>
        </form>
      </aside>
      <main className="canvas-wrap"><Select label={tr("使用真實資料預覽")} placeholder={tr("尚無資料夾")} data={rows.map(r => ({ value: r.rowId, label: `${r.name} · ${r.path}` }))} searchable value={previewId ?? null} onChange={v => setPreviewId(v ?? undefined)} mb="md" />
        <div ref={containerRef as React.RefObject<HTMLDivElement>} className="canvas">{!draft.cells.length&&<Button variant="light" onClick={()=>add('static-text')}>{tr('加入第一個組件')}</Button>}{mounted && <GridLayout width={width} style={{ minHeight: 320 }} layout={draft.cells.map(c => ({ i: c.cellId, ...c.grid,...(c.kind==='spacer'?{static:true,isDraggable:true,isResizable:true}:{}) }))} gridConfig={{ cols: 12, rowHeight: 42, maxRows: 100, margin: [4, 4], containerPadding: [0, 0] }} dropConfig={{ enabled: true, defaultItem: { w: 6, h: 1 } }} onDrop={(layout, item, event) => { const transfer=(event as DragEvent).dataTransfer,kind=transfer?.getData('text/plain') as CellKind,id=transfer?.getData('application/x-media-viewer-field'),source=id?draft.fieldBindings.find(f=>f.attributeId===id)??availableFields.filter(f=>!f.conflict).map(f=>({attributeId:f.attributeId,alias:f.key,type:f.type})).find(f=>f.attributeId===id):undefined;if(id&&!source){setError(tr("欄位已變更或型別衝突，請重新選擇"));return}if(item&&kind in labels)add(kind,{x:item.x,y:item.y,w:item.w,h:item.h},layout,source) }} onDragStop={layoutChange} onResizeStop={layoutChange}>
          {draft.cells.map(cell => <div key={cell.cellId} className={`editor-cell ${selected === cell.cellId ? 'selected' : ''}`} style={{ ...cellColors(cell) }} tabIndex={0} onFocus={()=>setSelected(cell.cellId)} onClick={() => setSelected(cell.cellId)}><CellContent cell={cell} row={preview} project={draft} preview /></div>)}
        </GridLayout>}</div>
      </main>
      <aside className="editor-inspector" aria-label={tr("組件設定")}><h3>{tr("組件設定")}</h3>{selectedCell ? <Stack gap="sm"><strong>{labels[selectedCell.kind]}</strong><Text size="xs" c="dimmed">{tr("調整這個組件的呈現，不會改動資料夾原值。")}</Text>
        {(selectedCell.kind==='static-text'||selectedCell.kind==='field-url')&&<Textarea label={selectedCell.kind==='static-text'?tr('固定文字'):tr('連結顯示文字')} value={selectedCell.text??''} maxLength={10000} onChange={event=>updateCell({text:event.currentTarget.value})}/>}
        {selectedCell.kind==='system-info'&&<Select label={tr('系統資訊')} allowDeselect={false} value={selectedCell.systemInfo??'category'} data={[{value:'category',label:tr('分類')},{value:'files',label:tr('檔案數')},{value:'size',label:tr('容量')}]} onChange={value=>updateCell({systemInfo:value as Cell['systemInfo']})}/>}
        {selectedCell.kind==='field-enum'&&<TagsInput label={tr('選項')} value={draft.fieldBindings.find(field=>field.attributeId===selectedCell.attributeId)?.options??[]} onChange={options=>change({...draft,fieldBindings:draft.fieldBindings.map(field=>field.attributeId===selectedCell.attributeId?{...field,options}:field)})}/>}

        {selectedCell.kind==='image'&&<Text size="sm" c="dimmed">{tr("這是選用圖片組件。可新增多張；保存版面後，在資料夾設定的「圖片」頁分別選圖，沒有圖片可留空。")}</Text>}
        {isFieldKind(selectedCell.kind) && <Select label={tr("綁定欄位")} value={selectedCell.attributeId} data={draft.fieldBindings.filter(f => f.type === cellType(selectedCell.kind)).map(f => ({ value: f.attributeId, label: f.alias }))} onChange={v => v && updateCell({ attributeId: v })} />}
        <div className="coordinates">{(['x', 'y', 'w', 'h'] as const).map(key => <NumberInput key={key} label={{x:tr("水平位置 X"),y:tr("垂直位置 Y"),w:tr("寬度"),h:tr("高度")}[key]} min={key === 'w' || key === 'h' ? 1 : 0} max={key === 'x' || key === 'w' ? 12 : 100} value={selectedCell.grid[key]} onChange={v => typeof v === 'number' && updateCell({ grid: { ...selectedCell.grid, [key]: v } })} />)}</div>
        <ColorInput label={tr("文字顏色")} format="hex" value={selectedCell.style.textColor} onChange={v => /^#[0-9a-f]{6}$/i.test(v) && updateCell({ style: { ...selectedCell.style, textColor: v } })} />
        <Checkbox label={tr("背景透明")} checked={selectedCell.style.backgroundColor==='transparent'} onChange={e=>updateCell({style:{...selectedCell.style,backgroundColor:e.currentTarget.checked?'transparent':'#282a2e'}})}/><ColorInput label={tr("背景顏色")} format="hex" disabled={selectedCell.style.backgroundColor==='transparent'} value={selectedCell.style.backgroundColor==='transparent'?'#282a2e':selectedCell.style.backgroundColor} onChange={v => /^#[0-9a-f]{6}$/i.test(v) && updateCell({ style: { ...selectedCell.style, backgroundColor: v } })} />
        <Button color="red" variant="light" onClick={removeSelected}>{tr("移除組件")}</Button>
      </Stack> : <p className="muted">{tr("選擇畫布上的組件")}</p>}</aside>
    </div>
  </section>
}

