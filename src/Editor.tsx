import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Accordion, Badge, Button, Checkbox, ColorInput, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import GridLayout, { useContainerWidth, type Layout } from 'react-grid-layout'
import { type Cell, type CellKind, type FolderRow, type Project } from '../shared/model'
import { CellContent } from './Card'
import { cellType, isFieldKind } from '../shared/explorer'
import { cardPresets, editorFields } from '../shared/layouts'

const labels: Record<CellKind, string> = { name: '資料夾名稱', path: '目前路徑', 'field-text': '自訂文字', 'field-tags':'標籤','field-number':'數字','field-date':'日期',image:'圖片',divider:'分隔線', 'open-folder': '開啟資料夾' }
const typeLabels:Record<string,string>={string:'文字',tags:'標籤',number:'數字',datetime:'日期時間'}
const typeKinds:Record<string,CellKind>={string:'field-text',tags:'field-tags',number:'field-number',datetime:'field-date'}
export function Editor({ project, rows, busy, save, close, onDirty, targetLabel='卡片',presets=false }: { project: Project; rows: FolderRow[]; busy: boolean; save: (p: Project,preset?:{name:string;asNew:boolean}) => Promise<boolean>; close: () => void; onDirty: (dirty: boolean) => void; targetLabel?:string;presets?:boolean }) {
  const [draft, setDraft] = useState(() => structuredClone(project))
  const [past, setPast] = useState<Project[]>([]), [future, setFuture] = useState<Project[]>([])
  const [selected, setSelected] = useState(''), [previewId, setPreviewId] = useState<string | undefined>(rows[0]?.rowId)
  const [newField, setNewField] = useState(''), [error, setError] = useState('')
  const [newType,setNewType]=useState('string')
  const originalName=cardPresets(project).find(p=>p.id===project.activeLayoutId)?.name??cardPresets(project)[0].name
  const [layoutName,setLayoutName]=useState(originalName),[asNew,setAsNew]=useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(project)||presets&&(layoutName!==originalName||asNew)
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
    if(source&&source.type!==cellType(kind)){setError('欄位與組件型別不符');return}
    if (draft.cells.length >= 50) { setError('POC 每張卡片最多 50 個組件'); return }
    const cells = draft.cells.map(c => { const moved = layout?.find(l => l.i === c.cellId); return moved ? { ...c, grid: { x: moved.x, y: moved.y, w: moved.w, h: moved.h } } : c })
    const y = Math.max(0, ...cells.map(c => c.grid.y + c.grid.h))
    let bindings=draft.fieldBindings,attributeId=source?.attributeId
    if(source&&!bindings.some(f=>f.attributeId===source.attributeId)){
      let alias=source.alias||'欄位',i=2
      while(bindings.some(f=>f.alias.toLocaleLowerCase()===alias.toLocaleLowerCase()))alias=(source.alias||'欄位')+'_'+i++
      bindings=[...bindings,{...source,alias}]
    }
    attributeId??=bindings.find(f=>f.type===cellType(kind))?.attributeId
    if(isFieldKind(kind)&&!attributeId){attributeId=crypto.randomUUID();let alias=cellType(kind),i=2;while(bindings.some(f=>f.alias.toLowerCase()===alias.toLowerCase()))alias=`${cellType(kind)}_${i++}`;bindings=[...bindings,{attributeId,alias,type:cellType(kind)}]}
    if(kind==='image')attributeId=crypto.randomUUID()
    const cell: Cell = { cellId: crypto.randomUUID(), kind, ...(isFieldKind(kind)||kind==='image' ? { attributeId } : {}), grid: grid ?? { x: 0, y, w: 12, h: kind==='image'?3:1 }, style: { textColor: '#e4e6e8', backgroundColor: 'transparent' } }
    if (cell.grid.y + cell.grid.h > 100) { setError('畫布沒有空間，請先移動或刪除組件'); return }
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
      <Button fullWidth variant="default" disabled={source?.conflict} title={source?.conflict?'同一欄位的型別不一致，請先處理資料衝突':binding.alias} onClick={()=>add(kind,undefined,undefined,binding)}><span className="palette-field-name">{binding.alias||'未命名欄位'}</span><span className="palette-field-meta"><span>{typeLabels[binding.type]}</span><Badge size="xs" color={source?.shared===false&&source.private?'orange':'gray'}>{source?.shared===false&&source.private?'專案私有':'共用'}</Badge>{source?.shared&&source.private&&<Badge size="xs" color="orange">有專案覆寫</Badge>}</span></Button>
    </div>
  }
  const leave = () => { if (!dirty || window.confirm('放棄尚未保存的版面變更？')) close() }
  return <section className="editor-page">
    <Group justify="space-between" mb="md"><div><h2>CELL 積木編輯器</h2><p>編輯「{project.name}」所有{targetLabel}共用的模板</p></div><Group>
      <Button variant="default" disabled={!past.length} onClick={() => { setFuture([draft, ...future]); setDraft(past.at(-1)!); setPast(past.slice(0, -1)) }}>復原</Button>
      <Button variant="default" disabled={!future.length} onClick={() => { setPast([...past, draft]); setDraft(future[0]); setFuture(future.slice(1)) }}>重做</Button>
      <Button variant="default" onClick={leave}>取消</Button><Button loading={busy} onClick={async () => { if (presets&&!layoutName.trim()){setError('請填方案名稱');return}if (await save(draft,presets?{name:layoutName,asNew}:undefined)) close() }}>保存模板</Button>
    </Group></Group>
    {presets&&<Group mb="md"><TextInput label="方案名稱" value={layoutName} maxLength={100} onChange={e=>setLayoutName(e.currentTarget.value)}/><Checkbox label="另存為新方案（保留原方案）" checked={asNew} onChange={e=>setAsNew(e.currentTarget.checked)}/></Group>}
    {error && <p role="alert" className="error">{error}</p>}
    <div className="editor">
      <aside className="editor-palette" aria-label="拖入組件"><h3>拖入組件</h3><Text size="xs" c="dimmed" mb="sm">點擊或拖入畫布，再到右側調整。</Text>
        <section className="palette-section"><h4>基礎組件</h4><Text size="xs" c="dimmed" mb="xs">系統資訊、選用圖片與版面操作，不建立自訂欄位。</Text><div className="basic-palette">{(['name','path','image','divider','open-folder'] as CellKind[]).map(kind=><div key={kind} className="palette-item" draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',kind);e.dataTransfer.effectAllowed='copy'}}><Button fullWidth size="xs" variant="default" onClick={()=>add(kind)}>{labels[kind]}</Button></div>)}</div></section>
        <section className="project-field-palette"><h4>已配置欄位</h4><Text size="xs" c="dimmed" mb="xs">依此專案可見記錄分類；拖入只綁定欄位，不複製或建立資料。</Text>{[true,false].map(hasData=>{const bindings=draft.fieldBindings.filter(binding=>!!sources.find(source=>source.attributeId===binding.attributeId)?.hasData===hasData);return <div key={String(hasData)} className="palette-data-group" data-has-data={hasData}><Group justify="space-between" mb="xs"><Text size="xs" fw={600}>{hasData?'已有資料':'尚無資料'}</Text><Badge size="xs" color="gray">{bindings.length}</Badge></Group><Stack gap="xs">{bindings.map(binding=>paletteField(binding))}</Stack>{!bindings.length&&<Text size="xs" c="dimmed">{hasData?'尚無填入資料的欄位。':'沒有空白欄位。'}</Text>}</div>})}</section>
        <Accordion variant="separated" className="existing-fields"><Accordion.Item value="existing"><Accordion.Control>引用資料夾既有欄位 <Badge size="xs" color="gray">{availableFields.length}</Badge></Accordion.Control><Accordion.Panel>
          <Text size="xs" c="dimmed" mb="sm">拖入即引用原欄位，不複製資料；其他專案的私有值不會列出。</Text>
          {availableFields.some(f=>f.shared)&&<><Text size="sm" fw={600} mb="xs">共用欄位</Text><Stack gap="xs" mb="sm">{availableFields.filter(f=>f.shared).map(f=>paletteField({attributeId:f.attributeId,alias:f.key,type:f.type}))}</Stack></>}
          {availableFields.some(f=>!f.shared&&f.private)&&<><Text size="sm" fw={600} mb="xs">本專案私有欄位</Text><Stack gap="xs">{availableFields.filter(f=>!f.shared&&f.private).map(f=>paletteField({attributeId:f.attributeId,alias:f.key,type:f.type}))}</Stack></>}
          {!availableFields.length&&<Text size="xs" c="dimmed">沒有尚未引用的既有欄位。</Text>}
        </Accordion.Panel></Accordion.Item></Accordion>
        <form className="new-field-form" aria-label="新增欄位" onSubmit={e=>{e.preventDefault();const alias=newField.trim();if(!alias||draft.fieldBindings.some(f=>f.alias.toLocaleLowerCase()===alias.toLocaleLowerCase())){setError('請輸入未使用的欄位名稱');return}change({...draft,fieldBindings:[...draft.fieldBindings,{alias,attributeId:crypto.randomUUID(),type:newType}]});setNewField('');setError('')}}>
          <h4>新增欄位</h4><Text size="xs" c="dimmed">設定名稱與型別後，欄位會出現在上方組件區。</Text>
          <TextInput label="欄位名稱" placeholder="例如：作者、評分" value={newField} maxLength={100} required onChange={e=>setNewField(e.currentTarget.value)}/>
          <Select label="欄位型別" allowDeselect={false} value={newType} onChange={v=>v&&setNewType(v)} data={Object.entries(typeLabels).map(([value,label])=>({value,label}))}/>
          <Button type="submit" fullWidth variant="default" disabled={!newField.trim()}>新增欄位</Button>
        </form>
      </aside>
      <main className="canvas-wrap"><Select label="使用真實資料預覽" placeholder="尚無資料夾" data={rows.map(r => ({ value: r.rowId, label: `${r.name} · ${r.path}` }))} searchable value={previewId ?? null} onChange={v => setPreviewId(v ?? undefined)} mb="md" />
        <div ref={containerRef as React.RefObject<HTMLDivElement>} className="canvas">{mounted && <GridLayout width={width} style={{ minHeight: 320 }} layout={draft.cells.map(c => ({ i: c.cellId, ...c.grid }))} gridConfig={{ cols: 12, rowHeight: 42, maxRows: 100, margin: [4, 4], containerPadding: [0, 0] }} dropConfig={{ enabled: true, defaultItem: { w: 6, h: 1 } }} onDrop={(layout, item, event) => { const transfer=(event as DragEvent).dataTransfer,kind=transfer?.getData('text/plain') as CellKind,id=transfer?.getData('application/x-media-viewer-field'),source=id?draft.fieldBindings.find(f=>f.attributeId===id)??availableFields.filter(f=>!f.conflict).map(f=>({attributeId:f.attributeId,alias:f.key,type:f.type})).find(f=>f.attributeId===id):undefined;if(id&&!source){setError('欄位已變更或型別衝突，請重新選擇');return}if(item&&kind in labels)add(kind,{x:item.x,y:item.y,w:item.w,h:item.h},layout,source) }} onDragStop={layoutChange} onResizeStop={layoutChange}>
          {draft.cells.map(cell => <div key={cell.cellId} className={`editor-cell ${selected === cell.cellId ? 'selected' : ''}`} style={{ color: cell.style.textColor, background: cell.style.backgroundColor }} tabIndex={0} onFocus={()=>setSelected(cell.cellId)} onClick={() => setSelected(cell.cellId)}><CellContent cell={cell} row={preview} preview /></div>)}
        </GridLayout>}</div>
      </main>
      <aside className="editor-inspector" aria-label="組件設定"><h3>組件設定</h3>{selectedCell ? <Stack gap="sm"><strong>{labels[selectedCell.kind]}</strong><Text size="xs" c="dimmed">調整這個組件的呈現，不會改動資料夾原值。</Text>
        {selectedCell.kind==='image'&&<Text size="sm" c="dimmed">這是選用圖片組件。可新增多張；保存版面後，在資料夾設定的「圖片」頁分別選圖，沒有圖片可留空。</Text>}
        {isFieldKind(selectedCell.kind) && <Select label="綁定欄位" value={selectedCell.attributeId} data={draft.fieldBindings.filter(f => f.type === cellType(selectedCell.kind)).map(f => ({ value: f.attributeId, label: f.alias }))} onChange={v => v && updateCell({ attributeId: v })} />}
        <div className="coordinates">{(['x', 'y', 'w', 'h'] as const).map(key => <NumberInput key={key} label={{x:'水平位置 X',y:'垂直位置 Y',w:'寬度',h:'高度'}[key]} min={key === 'w' || key === 'h' ? 1 : 0} max={key === 'x' || key === 'w' ? 12 : 100} value={selectedCell.grid[key]} onChange={v => typeof v === 'number' && updateCell({ grid: { ...selectedCell.grid, [key]: v } })} />)}</div>
        <ColorInput label="文字顏色" format="hex" value={selectedCell.style.textColor} onChange={v => /^#[0-9a-f]{6}$/i.test(v) && updateCell({ style: { ...selectedCell.style, textColor: v } })} />
        <Checkbox label="背景透明" checked={selectedCell.style.backgroundColor==='transparent'} onChange={e=>updateCell({style:{...selectedCell.style,backgroundColor:e.currentTarget.checked?'transparent':'#282a2e'}})}/><ColorInput label="背景顏色" format="hex" disabled={selectedCell.style.backgroundColor==='transparent'} value={selectedCell.style.backgroundColor==='transparent'?'#282a2e':selectedCell.style.backgroundColor} onChange={v => /^#[0-9a-f]{6}$/i.test(v) && updateCell({ style: { ...selectedCell.style, backgroundColor: v } })} />
        <Button color="red" variant="light" onClick={removeSelected}>移除組件</Button>
      </Stack> : <p className="muted">選擇畫布上的組件</p>}</aside>
    </div>
  </section>
}

