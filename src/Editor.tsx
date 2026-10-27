import { useLayoutEffect, useState } from 'react'
import { Button, Checkbox, ColorInput, Group, NumberInput, Select, Stack, TextInput } from '@mantine/core'
import GridLayout, { useContainerWidth, type Layout } from 'react-grid-layout'
import { type Cell, type CellKind, type FolderRow, type Project } from '../shared/model'
import { CellContent } from './Card'
import { cellType, isFieldKind } from '../shared/explorer'
import { cardPresets } from '../shared/layouts'

const labels: Record<CellKind, string> = { name: '資料夾名稱', path: '目前路徑', 'field-text': '自訂文字', 'field-tags':'標籤','field-number':'數字','field-date':'日期',image:'可攜圖片', 'open-folder': '開啟資料夾' }
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
  const availableFields = [...new Map(rows.flatMap(r => r.record?.attributes ?? []).filter(a => ['string','tags','number','datetime'].includes(a.type) && !draft.fieldBindings.some(f => f.attributeId === a.attributeId)).map(a => [a.attributeId, a])).values()]
  const change = (next: Project) => { if (JSON.stringify(next) === JSON.stringify(draft)) return; setPast([...past.slice(-49), structuredClone(draft)]); setFuture([]); setDraft(next) }
  const updateCell = (update: Partial<Cell>) => change({ ...draft, cells: draft.cells.map(c => c.cellId === selected ? { ...c, ...update } : c) })
  const layoutChange = (layout: Layout) => {
    change({ ...draft, cells: draft.cells.map(c => { const item = layout.find(l => l.i === c.cellId); return item ? { ...c, grid: { x: item.x, y: item.y, w: item.w, h: item.h } } : c }) })
  }
  const add = (kind: CellKind, grid?: Cell['grid'], layout?: Layout) => {
    if (draft.cells.length >= 50) { setError('POC 每張卡片最多 50 個組件'); return }
    const cells = draft.cells.map(c => { const moved = layout?.find(l => l.i === c.cellId); return moved ? { ...c, grid: { x: moved.x, y: moved.y, w: moved.w, h: moved.h } } : c })
    const y = Math.max(0, ...cells.map(c => c.grid.y + c.grid.h))
    let bindings=draft.fieldBindings; let attributeId=bindings.find(f=>f.type===cellType(kind))?.attributeId
    if(isFieldKind(kind)&&!attributeId){attributeId=crypto.randomUUID();let alias=cellType(kind),i=2;while(bindings.some(f=>f.alias.toLowerCase()===alias.toLowerCase()))alias=`${cellType(kind)}_${i++}`;bindings=[...bindings,{attributeId,alias,type:cellType(kind)}]}
    const cell: Cell = { cellId: crypto.randomUUID(), kind, ...(isFieldKind(kind) ? { attributeId } : {}), grid: grid ?? { x: 0, y, w: 12, h: kind==='image'?3:1 }, style: { textColor: '#e4e6e8', backgroundColor: 'transparent' } }
    if (cell.grid.y + cell.grid.h > 100) { setError('畫布沒有空間，請先移動或刪除組件'); return }
    change({ ...draft, fieldBindings:bindings,cells: [...cells, cell] }); setSelected(cell.cellId)
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
      <aside><h3>拖入組件</h3><Stack gap="xs">{(Object.keys(labels) as CellKind[]).map(kind => <div key={kind} className="palette-item" draggable onDragStart={e => { e.dataTransfer.setData('text/plain', kind); e.dataTransfer.effectAllowed = 'copy' }}><Button fullWidth variant="light" onClick={() => add(kind)}>{labels[kind]}</Button></div>)}</Stack><p className="muted">也可點擊加入，再拖移或輸入位置。</p>
        <TextInput label="新增欄位名稱" value={newField} onChange={e => setNewField(e.currentTarget.value)} /><Select label="欄位型別" value={newType} onChange={v=>setNewType(v??'string')} data={[{value:'string',label:'文字'},{value:'tags',label:'標籤'},{value:'number',label:'數字'},{value:'datetime',label:'日期時間'}]}/><Button mt="xs" variant="default" onClick={() => { const alias = newField.trim(); if (!alias || draft.fieldBindings.some(f => f.alias.toLowerCase() === alias.toLowerCase())) { setError('請輸入未使用的欄位名稱'); return }; change({ ...draft, fieldBindings: [...draft.fieldBindings, { alias, attributeId: crypto.randomUUID(), type: newType }] }); setNewField('') }}>新增欄位</Button>
        <Select mt="md" label="引用資料夾既有欄位" placeholder="選擇欄位（保留原身分）" value={null} searchable data={availableFields.map(a => ({ value: a.attributeId, label: `${a.key} · ${a.type} · ${a.attributeId.slice(0, 8)}` }))} onChange={id => {
          const attribute = availableFields.find(a => a.attributeId === id); if (!attribute) return
          let alias = attribute.key, suffix = 2
          while (draft.fieldBindings.some(f => f.alias.toLowerCase() === alias.toLowerCase())) alias = `${attribute.key}_${suffix++}`
          change({ ...draft, fieldBindings: [...draft.fieldBindings, { alias, attributeId: attribute.attributeId, type: attribute.type }] })
        }} />
      </aside>
      <main className="canvas-wrap"><Select label="使用真實資料預覽" placeholder="尚無資料夾" data={rows.map(r => ({ value: r.rowId, label: `${r.name} · ${r.path}` }))} searchable value={previewId ?? null} onChange={v => setPreviewId(v ?? undefined)} mb="md" />
        <div ref={containerRef as React.RefObject<HTMLDivElement>} className="canvas">{mounted && <GridLayout width={width} style={{ minHeight: 320 }} layout={draft.cells.map(c => ({ i: c.cellId, ...c.grid }))} gridConfig={{ cols: 12, rowHeight: 42, maxRows: 100, margin: [4, 4], containerPadding: [0, 0] }} dropConfig={{ enabled: true, defaultItem: { w: 6, h: 1 } }} onDrop={(layout, item, event) => { const kind = (event as DragEvent).dataTransfer?.getData('text/plain') as CellKind; if (item && kind in labels) add(kind, { x: item.x, y: item.y, w: item.w, h: item.h }, layout) }} onDragStop={layoutChange} onResizeStop={layoutChange}>
          {draft.cells.map(cell => <div key={cell.cellId} className={`editor-cell ${selected === cell.cellId ? 'selected' : ''}`} style={{ color: cell.style.textColor, background: cell.style.backgroundColor }} onClick={() => setSelected(cell.cellId)}><CellContent cell={cell} row={preview} preview /></div>)}
        </GridLayout>}</div>
      </main>
      <aside><h3>組件設定</h3>{selectedCell ? <Stack gap="sm"><strong>{labels[selectedCell.kind]}</strong>
        {isFieldKind(selectedCell.kind) && <Select label="綁定欄位" value={selectedCell.attributeId} data={draft.fieldBindings.filter(f => f.type === cellType(selectedCell.kind)).map(f => ({ value: f.attributeId, label: f.alias }))} onChange={v => v && updateCell({ attributeId: v })} />}
        <div className="coordinates">{(['x', 'y', 'w', 'h'] as const).map(key => <NumberInput key={key} label={key} min={key === 'w' || key === 'h' ? 1 : 0} max={key === 'x' || key === 'w' ? 12 : 100} value={selectedCell.grid[key]} onChange={v => typeof v === 'number' && updateCell({ grid: { ...selectedCell.grid, [key]: v } })} />)}</div>
        <ColorInput label="文字顏色" format="hex" value={selectedCell.style.textColor} onChange={v => /^#[0-9a-f]{6}$/i.test(v) && updateCell({ style: { ...selectedCell.style, textColor: v } })} />
        <Checkbox label="背景透明" checked={selectedCell.style.backgroundColor==='transparent'} onChange={e=>updateCell({style:{...selectedCell.style,backgroundColor:e.currentTarget.checked?'transparent':'#282a2e'}})}/><ColorInput label="背景顏色" format="hex" disabled={selectedCell.style.backgroundColor==='transparent'} value={selectedCell.style.backgroundColor==='transparent'?'#282a2e':selectedCell.style.backgroundColor} onChange={v => /^#[0-9a-f]{6}$/i.test(v) && updateCell({ style: { ...selectedCell.style, backgroundColor: v } })} />
        <Button color="red" variant="light" onClick={() => { change({ ...draft, cells: draft.cells.filter(c => c.cellId !== selected) }); setSelected('') }}>移除組件</Button>
      </Stack> : <p className="muted">選擇畫布上的組件</p>}</aside>
    </div>
  </section>
}

