import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState,useCallback,useMemo,type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {ActionIcon,Button,Checkbox,Slider,Tabs,FocusTrap} from '@mantine/core'
import type {FolderRow,Project} from '../shared/model'
import type {MediaEntry} from '../shared/explorer'
import {AudioViewer} from './AudioViewer'
import {VideoViewer} from './VideoViewer'
import {Icon} from './icons'
import {t as tr,useLocale} from './i18n'
import './media-workspace.css'

type Source={row:FolderRow;project:Project;entries:MediaEntry[]}
type Item=Source&{id:string;file:MediaEntry}
type PlaybackApi={open:(source:Source,file:MediaEntry)=>Promise<void>;add:(source:Source,file:MediaEntry)=>void;source:(source:Source)=>void;reconcile:(ids:string[])=>void}
const Context=createContext<PlaybackApi|null>(null)
export const usePlayback=()=>useContext(Context)
const clock=(value:number)=>Number.isFinite(value)?`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`:'0:00'
export function PlaybackProvider({children}:{children:ReactNode}){
  useLocale()
  const [items,setItems]=useState<Item[]>([]),[current,setCurrent]=useState<Item>(),[folder,setFolder]=useState<Source>(),[mini,setMini]=useState(false),[tab,setTab]=useState<string|null>('queue'),[auto,setAuto]=useState(false),[showQueue,setShowQueue]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false)
  const [state,setState]=useState({time:0,duration:0,paused:true}),[position,setPosition]=useState<{x:number;y:number}>()
  const queuePanel=useRef<HTMLElement>(null)
  useLayoutEffect(()=>{if(queuePanel.current)queuePanel.current.inert=!showQueue},[showQueue,mini,current])
  const focus=useRef<HTMLElement|null>(null)
  const body=useRef<HTMLDivElement>(null),sequence=useRef(0),drag=useRef<{x:number;y:number;left:number;top:number}>(),dragged=useRef<string>()
  useEffect(()=>{const resize=()=>setPosition(value=>value?constrain(value.x,value.y):value);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[])
  const media=()=>body.current?.querySelector<HTMLMediaElement>('audio,video')
  const stop=()=>{sequence.current++;media()?.pause();setCurrent(undefined);setError('');setPending(false);if(focus.current?.isConnected)focus.current.focus()}
  const source=useCallback((value:Source)=>setFolder(value),[])
  const make=(value:Source,file:MediaEntry):Item=>({...value,file,id:crypto.randomUUID()})
  const add=useCallback((value:Source,file:MediaEntry)=>{if(['audio','video'].includes(file.kind))setItems(list=>[...list,make(value,file)])},[])
  const select=async(item:Item)=>{
    const token=++sequence.current;setPending(true);setError('')
    try{
      const visited=await window.explorer.request({action:'visit',rowId:item.row.rowId})
      const row=(visited.snapshot?.structure??visited.snapshot?.rows)?.find(row=>row.rowId===item.row.rowId)
      if(!row?.record||row.error||row.readonly||row.stopped)throw Error(tr('媒體不存在或需重新載入'))
      const result=await window.explorer.request({action:'content',rowId:row.rowId}),file=result.content?.entries.find(file=>file.id===item.file.id)
      if(!file||!['audio','video'].includes(file.kind))throw Error(tr('媒體不存在或需重新載入'))
      if(token===sequence.current){media()?.pause();setCurrent({...item,row,file,entries:result.content!.entries});setState({time:0,duration:0,paused:true})}
    }catch(reason){if(token===sequence.current)setError(String(reason))}finally{if(token===sequence.current)setPending(false)}
  }
  const open=useCallback(async(value:Source,file:MediaEntry)=>{focus.current=document.activeElement as HTMLElement;const item=make(value,file);setItems(list=>[...list,item]);setFolder(value);setMini(false);setShowQueue(false);await select(item)},[])
  const cover=current?.row.record?.assets.find(asset=>asset.assetId===current.row.record?.details?.bannerAssetId)
  const index=items.findIndex(item=>item.id===current?.id)
  const step=(delta:number)=>{const item=items[index+delta];if(item)void select(item)}
  const sync=()=>{const node=media();if(node)setState({time:node.currentTime,duration:Number.isFinite(node.duration)?node.duration:0,paused:node.paused})}
  const constrain=(x:number,y:number)=>({x:Math.max(0,Math.min(x,window.innerWidth-Math.min(380,window.innerWidth))),y:Math.max(0,Math.min(y,window.innerHeight-300))})
  const snap=(x:number,y:number)=>{
    const point=constrain(x,y),right=Math.max(0,window.innerWidth-380),bottom=Math.max(0,window.innerHeight-300)
    const edges=[point.x,right-point.x,point.y,bottom-point.y],edge=edges.indexOf(Math.min(...edges))
    return constrain(edge===0?8:edge===1?right-8:point.x,edge===2?8:edge===3?bottom-8:point.y)
  }
  const reconcile=useCallback((ids:string[])=>{const removed=items.some(item=>!ids.includes(item.project.projectId));if(current&&!ids.includes(current.project.projectId))stop();if(removed){sequence.current++;setPending(false);setError(tr('媒體不存在或需重新載入'));}setItems(list=>list.filter(item=>ids.includes(item.project.projectId)))},[items,current])
  // Time updates stay inside the player; they must not rerender the folder workspace.
  const api=useMemo(()=>({open,add,source,reconcile}),[open,add,source,reconcile])
  return <Context.Provider value={api}>{children}{!current&&error&&<p className="playback-launcher" role="alert">{error}</p>}{!current&&items.length>0&&<Button className="playback-launcher" onClick={()=>{setMini(false);setShowQueue(true);void select(items[0])}}>{tr('播放佇列')} · {items.length}</Button>}{current&&createPortal(<FocusTrap active={!mini}><div className={'global-playback '+(mini?'playback-mini':'playback-full media-viewer-shell')} role={mini?'region':'dialog'} aria-modal={mini?undefined:true} aria-label={tr('播放佇列')} style={mini&&position?{left:position.x,top:position.y,right:'auto',bottom:'auto'}:undefined} onKeyDown={event=>{if(event.key==='Escape'&&!mini){event.stopPropagation();setMini(true)}}}>
    <header onPointerDown={event=>{if(!mini||(event.target as HTMLElement).closest('button'))return;const rect=event.currentTarget.parentElement!.getBoundingClientRect();drag.current={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};event.currentTarget.setPointerCapture(event.pointerId)}} onPointerMove={event=>{const start=drag.current;if(start)setPosition(constrain(start.left+event.clientX-start.x,start.top+event.clientY-start.y))}} onPointerUp={event=>{const start=drag.current;if(start){setPosition(snap(start.left+event.clientX-start.x,start.top+event.clientY-start.y));drag.current=undefined}}}>
      <strong title={current.file.name}>{current.file.name}</strong><small className="media-viewer-source" title={current.row.path}>{current.project.name} · {current.row.name}</small><ActionIcon variant="subtle" aria-label={tr(mini?'返回播放佇列':'縮小播放')} onClick={()=>{if(mini)setShowQueue(true);setMini(!mini)}}><Icon name="layout"/></ActionIcon>{!mini&&<ActionIcon variant="subtle" aria-label={tr('切換媒體佇列')} aria-pressed={showQueue} onClick={()=>setShowQueue(!showQueue)}><Icon name="list"/></ActionIcon>}<ActionIcon variant="subtle" aria-label={tr('關閉媒體檢視器')} onClick={stop}><Icon name="close"/></ActionIcon>
    </header>
    <div className="playback-layout"><div ref={body} className="playback-media" onTimeUpdateCapture={sync} onDurationChangeCapture={sync} onPlayCapture={sync} onPauseCapture={sync} onEndedCapture={()=>{sync();if(auto)step(1)}}>
      {current.file.kind==='audio'?<AudioViewer key={current.id} background file={current.file} cover={cover?`media://asset/${current.row.rowId}/${cover.assetId}`:undefined} covers={current.entries.filter(file=>file.kind==='image')} autoNext={false} changeAutoNext={setAuto} previous={index>0?()=>step(-1):undefined} next={index<items.length-1?()=>step(1):undefined}/>:<VideoViewer key={current.id} background row={current.row} entries={[current.file,...current.entries.filter(file=>file.kind==='subtitle')]} run={request=>window.explorer.request(request)} busy={false} autoplay autoNext={false} changeAutoNext={async()=>false} changeAutoplay={async()=>false} initialFileId={current.file.id} hideStrip/>}
    </div>{!mini&&<aside ref={queuePanel} className={showQueue?'playback-queue-open':''} aria-hidden={!showQueue}><Tabs value={tab} onChange={setTab}><Tabs.List><Tabs.Tab value="queue">{tr('播放佇列')}</Tabs.Tab><Tabs.Tab value="folder">{tr('目前資料夾')} · {folder?.row.name}</Tabs.Tab></Tabs.List><Tabs.Panel value="queue"><div className="playback-items">{items.map(item=><div key={item.id} draggable onDragEnd={()=>dragged.current=undefined} onDragStart={()=>dragged.current=item.id} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const id=dragged.current;if(!id||id===item.id)return;setItems(list=>{const copy=list.filter(value=>value.id!==id),moving=list.find(value=>value.id===id);if(moving)copy.splice(copy.findIndex(value=>value.id===item.id),0,moving);return copy})}}><Button variant={item.id===current.id?'light':'subtle'} disabled={pending} onClick={()=>void select(item)} title={item.row.path}>{item.file.name}</Button><ActionIcon variant="subtle" disabled={pending} aria-label={tr('移除')+' '+item.file.name} onClick={()=>{if(current.id===item.id)stop();setItems(list=>list.filter(value=>value.id!==item.id))}}><Icon name="close"/></ActionIcon></div>)}</div></Tabs.Panel><Tabs.Panel value="folder"><div className="playback-items">{folder?.entries.filter(file=>['audio','video'].includes(file.kind)).map(file=><div key={file.id}><span>{file.name}</span><ActionIcon variant="subtle" aria-label={tr('加入佇列')+' '+file.name} onClick={()=>add(folder,file)}><Icon name="plus"/></ActionIcon></div>)}</div></Tabs.Panel></Tabs><Checkbox label={tr('自動接續')} checked={auto} onChange={event=>setAuto(event.currentTarget.checked)}/></aside>}</div>
    {mini&&<footer><Slider aria-label={tr('播放進度')} thumbLabel={tr('播放進度')} min={0} max={state.duration||1} value={state.time} disabled={!state.duration} onChange={value=>{const node=media();if(node)node.currentTime=value;sync()}}/><small>{clock(state.time)} / {clock(state.duration)}</small><div><ActionIcon variant="subtle" disabled={index<=0||pending} aria-label={tr('上一個媒體')} onClick={()=>step(-1)}><Icon name="chevron-left"/></ActionIcon><ActionIcon variant="subtle" aria-label={tr(state.paused?'播放':'暫停')} onClick={()=>{const node=media();const control=body.current?.querySelector<HTMLButtonElement>(`button[aria-label="${tr(node?.paused?'播放':'暫停')}"]`);control?.click()}}><Icon name={state.paused?'play':'pause'}/></ActionIcon><ActionIcon variant="subtle" disabled={index>=items.length-1||pending} aria-label={tr('下一個媒體')} onClick={()=>step(1)}><Icon name="chevron-right"/></ActionIcon></div></footer>}{error&&<p role="alert">{error}</p>}
  </div></FocusTrap>,document.body)}</Context.Provider>
}
