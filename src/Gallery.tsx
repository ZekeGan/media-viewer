import {lazy,memo,Suspense,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react'
import {Button,Group,SegmentedControl} from '@mantine/core'
import type {MediaEntry,ReadingPrefs} from '../shared/explorer'
import {galleryLayout,galleryWindow,type GalleryMode,type GalleryTile} from '../shared/gallery'
const Reader=lazy(()=>import('./Reader').then(module=>({default:module.Reader})))
const PAGE_SIZE=200
const Tile=memo(function Tile({entry,tile,mode,playing,selected,open,select,ratio}:{entry:MediaEntry;tile:GalleryTile;mode:GalleryMode;playing:boolean;selected:boolean;open:(index:number)=>void;select:(index:number)=>void;ratio:(id:string,value:number)=>void}){
 const [error,setError]=useState(false),[fallback,setFallback]=useState(false),[visible,setVisible]=useState(false)
 const image=useRef<HTMLImageElement|null>(null)
 const bindImage=useCallback((node:HTMLImageElement|null)=>{const previous=image.current;image.current=node;if(previous&&previous!==node)previous.removeAttribute('src')},[])
 const animated=entry.mime==='image/gif',animate=animated&&playing&&visible,source=animated&&!animate&&(!entry.thumb||fallback)?undefined:animate||fallback?entry.url:entry.thumb??entry.url
 useEffect(()=>{if(!animated)return;const element=image.current?.closest('.gallery-tile');if(!element)return;const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting),{root:element.closest('.folder-panel-body')});observer.observe(element);return()=>observer.disconnect()},[animated])
 useEffect(()=>{const node=image.current;if(mode==='masonry'&&node?.complete&&node.naturalHeight)ratio(entry.id,node.naturalWidth/node.naturalHeight)},[mode,entry.id,ratio])
 const thumbnail=<button className="media-thumbnail" title={entry.name} onClick={()=>open(tile.index)}><span className="thumbnail-image">{!error?<img ref={bindImage} decoding="async" src={source} alt={entry.name} onLoad={event=>{const node=event.currentTarget;if(mode==='masonry'&&node.naturalHeight)ratio(entry.id,node.naturalWidth/node.naturalHeight)}} onError={()=>{if(!fallback&&entry.thumb)setFallback(true);else setError(true)}}/>:<span>圖片無法載入，點擊檢視</span>}</span><small>{entry.name}</small></button>
 const style={left:tile.x,top:tile.y,width:tile.width,height:tile.height}
 return mode==='list'?<div className={'gallery-tile image-file-row '+(selected?'selected':'')} style={style} data-index={tile.index} onClick={()=>select(tile.index)}>{thumbnail}<span title={entry.name}>{entry.name}</span><small>{new Date(entry.modified).toLocaleDateString()}</small><small>{(entry.size/1024).toFixed(1)} KB</small></div>:<div className="gallery-tile" style={style} data-index={tile.index}>{thumbnail}</div>
},(before,after)=>before.entry===after.entry&&before.mode===after.mode&&before.playing===after.playing&&before.selected===after.selected&&before.tile.index===after.tile.index&&before.tile.x===after.tile.x&&before.tile.y===after.tile.y&&before.tile.width===after.tile.width&&before.tile.height===after.tile.height)
export function Gallery({entries,manga,prefs,save,onReader,loading=false}:{entries:MediaEntry[];manga:boolean;prefs?:ReadingPrefs;save:(prefs:ReadingPrefs)=>void;onReader:(opened:boolean)=>void;loading?:boolean}){
 const [mode,setMode]=useState('masonry'),[page,setPage]=useState(0),[reader,setReader]=useState<number>(),[selected,setSelected]=useState<number>(),[focused,setFocused]=useState(-1),[version,setVersion]=useState(0)
 const [view,setView]=useState({top:0,height:700,width:0}),actualTop=useRef(0),grid=useRef<HTMLDivElement>(null),scroll=useRef<HTMLElement|null>(null),ratios=useRef(new Map<string,number>()),frame=useRef(0),ratioFrame=useRef(0),anchor=useRef<{index:number;y:number;scrollTop:number}>(),focusNext=useRef<number>(),modeAnchor=useRef<{index:number;origin:number}>()
 const images=useMemo(()=>entries.filter(entry=>entry.kind==='image'),[entries]),items=useMemo(()=>images.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE),[images,page]),kind:GalleryMode=manga?'manga':mode==='list'?'list':'masonry'
 const pageRatios=useMemo(()=>new Map(items.flatMap((entry,index)=>{const value=ratios.current.get(entry.id);return value?[[index,value] as const]:[]})),[items,page,version])
 const layout=useMemo(()=>galleryLayout(items.length,view.width||300,kind,pageRatios),[items.length,view.width,kind,pageRatios])
 const current=useRef({layout,view,page});current.current={layout,view,page}
 const measure=useCallback(()=>{const element=grid.current,root=scroll.current;if(!element||!root)return;const bounds=element.getBoundingClientRect(),port=root.getBoundingClientRect();actualTop.current=port.top+root.clientTop-bounds.top;const next={top:Math.floor(actualTop.current/120)*120,height:root.clientHeight,width:element.clientWidth};setView(previous=>previous.top===next.top&&previous.height===next.height&&previous.width===next.width?previous:next)},[])
 useLayoutEffect(()=>{
  const element=grid.current,root=element?.closest<HTMLElement>('.folder-panel-body');if(!element||!root)return
  scroll.current=root;const previous=root.style.overflowAnchor;root.style.overflowAnchor='none'
  const update=()=>{if(anchor.current&&Math.abs(root.scrollTop-anchor.current.scrollTop)>1)anchor.current=undefined;if(!frame.current)frame.current=requestAnimationFrame(()=>{frame.current=0;measure()})},observer=new ResizeObserver(update)
  root.addEventListener('scroll',update,{passive:true});observer.observe(root);observer.observe(element);measure()
  return()=>{root.removeEventListener('scroll',update);observer.disconnect();cancelAnimationFrame(frame.current);cancelAnimationFrame(ratioFrame.current);root.style.overflowAnchor=previous;scroll.current=null;frame.current=0;ratioFrame.current=0}
 },[measure])
 useLayoutEffect(()=>{
  const root=scroll.current;if(!root)return
  const saved=anchor.current;anchor.current=undefined
  if(saved){const tile=layout.tiles[saved.index];if(tile)root.scrollTop=saved.scrollTop+tile.y-saved.y}
  if(modeAnchor.current!==undefined){const tile=layout.tiles[modeAnchor.current.index],origin=modeAnchor.current.origin;modeAnchor.current=undefined;if(tile)root.scrollTop=origin+tile.y}
  measure()
 },[layout,measure])
 const reportRatio=useCallback((key:string,value:number)=>{
  const state=current.current;if(!Number.isFinite(value)||value<=0||ratios.current.has(key))return
  if(!anchor.current){const top=actualTop.current,visible=state.layout.tiles.filter(tile=>tile.y>=top&&tile.y<top+state.view.height).sort((a,b)=>a.y-b.y)[0];if(visible)anchor.current={index:visible.index,y:visible.y,scrollTop:scroll.current?.scrollTop??0}}
  ratios.current.set(key,value)
  if(!ratioFrame.current)ratioFrame.current=requestAnimationFrame(()=>{ratioFrame.current=0;setVersion(value=>value+1)})
 },[])
 useLayoutEffect(()=>{const index=focusNext.current;if(index===undefined)return;const button=grid.current?.querySelector<HTMLButtonElement>(`[data-index="${index}"] .media-thumbnail`);if(button){focusNext.current=undefined;button.focus({preventScroll:true})}},[view,focused,layout])
 useEffect(()=>{onReader(reader!==undefined);return()=>onReader(false)},[reader,onReader])
 const open=useCallback((index:number)=>setReader(current.current.page*PAGE_SIZE+index),[])
 const select=useCallback((index:number)=>setSelected(current.current.page*PAGE_SIZE+index),[])
 const tiles=galleryWindow(layout,view.top,view.height,240,focused)
 const changePage=(next:number)=>{anchor.current=undefined;modeAnchor.current=undefined;setPage(next);setFocused(-1);scroll.current?.scrollTo({top:0});measure()}
 const selection=selected===undefined?undefined:images[selected]
 return <div className="gallery"><Group justify="space-between" mb="sm"><strong>{images.length} 張圖片{loading&&<small className="gallery-loading" role="status"> · 讀取中…</small>}</strong>{!manga&&<><SegmentedControl size="xs" value={mode} onChange={value=>{const tile=layout.tiles.filter(tile=>tile.y+tile.height>actualTop.current).sort((a,b)=>a.y-b.y)[0];if(tile)modeAnchor.current={index:tile.index,origin:(scroll.current?.scrollTop??0)-actualTop.current};setMode(value)}} data={[{value:'masonry',label:'瀑布流'},{value:'list',label:'列表'}]}/><Button size="compact-xs" variant="subtle" onClick={()=>scroll.current?.scrollTo({top:0,behavior:'smooth'})}>TOP</Button></>}</Group>
  {!images.length&&!loading&&<p className="muted">此資料夾沒有直接圖片。</p>}
  <div ref={grid} className={'virtual-gallery '+(kind==='list'?'image-file-list':kind==='manga'?'manga-gallery':'masonry-gallery')} style={{height:layout.height}} onFocusCapture={event=>{const tile=(event.target as HTMLElement).closest<HTMLElement>('[data-index]');if(tile)setFocused(Number(tile.dataset.index))}} onKeyDown={event=>{
   if(event.altKey||event.ctrlKey||event.metaKey)return
   const tile=(event.target as HTMLElement).closest<HTMLElement>('[data-index]');if(!tile)return
   const index=Number(tile.dataset.index),delta=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:event.key==='ArrowUp'?-layout.columns:event.key==='ArrowDown'?layout.columns:0,next=event.key==='Home'?0:event.key==='End'?items.length-1:index+delta
   if(!delta&&!['Home','End'].includes(event.key)||next<0||next>=items.length)return
   event.preventDefault();focusNext.current=next;setFocused(next);const target=layout.tiles[next],root=scroll.current;if(root)root.scrollTop+=target.y-actualTop.current;measure()
  }}>
   {view.width>0&&tiles.map(tile=><Tile key={items[tile.index].id} entry={items[tile.index]} tile={tile} mode={kind} playing={reader===undefined&&items[tile.index].mime==='image/gif'} selected={selected===page*PAGE_SIZE+tile.index} open={open} select={select} ratio={reportRatio}/>)}
  </div>
  {images.length>PAGE_SIZE&&<Group justify="space-between"><Button variant="light" disabled={!page} onClick={()=>changePage(page-1)}>上一組</Button><small>每組 {PAGE_SIZE} 張 · {page+1}／{Math.ceil(images.length/PAGE_SIZE)}</small><Button variant="light" disabled={(page+1)*PAGE_SIZE>=images.length} onClick={()=>changePage(page+1)}>下一組</Button></Group>}
  {selection&&<p>{selection.name} · {selection.mime} · {(selection.size/1024).toFixed(1)} KB</p>}
  {reader!==undefined&&<Suspense fallback={<div className="reader-loading-overlay" role="status">開啟圖片…</div>}><Reader images={images} start={reader} manga={manga} prefs={prefs} save={save} close={()=>setReader(undefined)}/></Suspense>}
 </div>
}
