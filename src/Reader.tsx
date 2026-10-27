import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {ActionIcon,Button,FocusTrap,Group,Menu,SegmentedControl,Select,Tooltip} from '@mantine/core'
import type {MediaEntry,ReadingPrefs} from '../shared/explorer'
import {readingGroups,readerArrowStep,spreadGeometry,type ImageSize} from '../shared/reader'
interface Frame{key:string;token:number;indices:number[];sizes:ImageSize[];loaded:Set<number>;committed?:boolean}
interface CachedImage{image:HTMLImageElement;promise:Promise<ImageSize>;animated:boolean}
export function Reader({images,start,manga,prefs,close,save}:{images:MediaEntry[];start:number;manga:boolean;prefs?:ReadingPrefs;close:()=>void;save:(prefs:ReadingPrefs)=>void}){
 const [page,setPage]=useState(Math.max(0,Math.min(start,images.length-1))),[fit,setFit]=useState<'height'|'width'|'original'|'contain'>(manga?'height':prefs?.fit??'height')
 const [spread,setSpread]=useState(prefs?.spread??false),[rtl,setRtl]=useState(prefs?.rtl??false),[first,setFirst]=useState(prefs?.firstSingle??false)
 const [toolbar,setToolbar]=useState(true),[readingMenu,setReadingMenu]=useState(false),[pageDropdown,setPageDropdown]=useState(false),[immersive,setImmersive]=useState(false),[zoom,setZoom]=useState(1),[box,setBox]=useState<ImageSize>({width:1,height:1})
 const [frames,setFrames]=useState<Frame[]>([]),[activeKey,setActiveKey]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0)
 useEffect(()=>{if(error)setToolbar(true)},[error])
 const select=useRef<HTMLInputElement>(null),viewport=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;left:number;top:number}>()
 const cache=useRef(new Map<string,CachedImage>()),sequence=useRef(0),activeRef=useRef(''),protectedUrls=useRef(new Set<string>()),returnFocus=useRef(document.activeElement as HTMLElement)
 const ownsFullscreen=useRef(false),mounted=useRef(false)
 useEffect(()=>{
  mounted.current=true
  const changed=()=>{if(ownsFullscreen.current&&!document.fullscreenElement){ownsFullscreen.current=false;setImmersive(false);setToolbar(true)}}
  document.addEventListener('fullscreenchange',changed)
  return()=>{mounted.current=false;document.removeEventListener('fullscreenchange',changed);if(ownsFullscreen.current&&document.fullscreenElement){ownsFullscreen.current=false;void document.exitFullscreen().catch(()=>{})}}
 },[])
 const focusStage=()=>requestAnimationFrame(()=>viewport.current?.focus({preventScroll:true}))
 const leaveImmersive=async()=>{
  if(ownsFullscreen.current&&document.fullscreenElement){try{await document.exitFullscreen()}catch(reason){if(mounted.current)setError('無法退出全螢幕：'+String(reason));return}}
  ownsFullscreen.current=false
  if(mounted.current){setImmersive(false);setToolbar(true);focusStage()}
 }
 const toggleImmersive=async()=>{
  if(immersive){await leaveImmersive();return}
  try{
   if(!document.fullscreenElement){await document.documentElement.requestFullscreen();if(!mounted.current){await document.exitFullscreen();return}ownsFullscreen.current=true}
   if(mounted.current){setPageDropdown(false);setReadingMenu(false);setImmersive(true);setToolbar(false);focusStage()}
  }catch(reason){if(mounted.current){setToolbar(true);setError('無法進入全螢幕：'+String(reason))}}
 }
 const groups=useMemo(()=>readingGroups(images.length,manga&&spread,first),[images.length,manga,spread,first])
 const groupIndex=Math.max(0,groups.findIndex(group=>group.includes(page))),group=groups[groupIndex]??[]
 const active=frames.find(frame=>frame.key===activeKey),geometry=spreadGeometry(active?.sizes??[],fit,box,zoom)
 const surface={width:Math.max(box.width,geometry.width),height:Math.max(box.height,geometry.height)}
 useLayoutEffect(()=>{if(viewport.current){viewport.current.scrollLeft=rtl?Math.max(0,surface.width-box.width):0;viewport.current.scrollTop=0}},[activeKey,rtl])
 const anchor=useRef<{x:number;y:number;ratioX:number;ratioY:number}>()
 const latest=useRef({zoom,geometry,surface,box,active});latest.current={zoom,geometry,surface,box,active};activeRef.current=activeKey
 protectedUrls.current=new Set([...group,...active?.indices??[]].flatMap(index=>images[index]?.url??[]))
 const trim=()=>{
  for(const[url,item]of cache.current){if(cache.current.size<=8)break;if(!protectedUrls.current.has(url)){cache.current.delete(url);item.image.src=''}}
 }
 const load=(entry:MediaEntry)=>{
  const existing=cache.current.get(entry.url)
  if(existing){cache.current.delete(entry.url);cache.current.set(entry.url,existing);return existing.promise}
  const image=new Image();image.decoding='async'
  const promise=new Promise<ImageSize>((resolve,reject)=>{
   image.onload=()=>{void image.decode().catch(()=>{}).then(()=>image.naturalWidth>0?resolve({width:image.naturalWidth,height:image.naturalHeight}):reject(new Error('無法解碼 '+entry.name)))}
   image.onerror=()=>reject(new Error('無法載入 '+entry.name))
  })
  cache.current.set(entry.url,{image,promise,animated:entry.mime==='image/gif'});image.src=entry.url;trim()
  return promise
 }
 const groupKey=group.map(index=>images[index]?.url).join('|')
 useEffect(()=>{
  const token=++sequence.current;let cancelled=false
  setLoading(true);setError('')
  if(!group.length){setLoading(false);return}
  void Promise.all(group.map(index=>load(images[index]))).then(sizes=>{
   if(cancelled||token!==sequence.current)return
   const frame:Frame={key:String(token),token,indices:[...group],sizes,loaded:new Set()}
   setFrames(previous=>[...previous.filter(item=>item.key===activeRef.current),frame])
  }).catch(reason=>{if(!cancelled&&token===sequence.current){setLoading(false);setError(String(reason))}})
  return()=>{cancelled=true}
 },[groupKey,retry])
 useEffect(()=>{
  if(!active)return
  const index=groups.findIndex(group=>group.includes(active.indices[0]))
  for(const next of [groups[index+1],groups[index-1]])for(const i of next??[])if(images[i]?.mime!=='image/gif')void load(images[i]).catch(()=>{})
  for(const[url,item]of cache.current)if(item.animated&&!protectedUrls.current.has(url)){cache.current.delete(url);item.image.src=''}
  trim()
 },[activeKey,groups,images])
 useLayoutEffect(()=>{
  const element=viewport.current;if(!element)return
  // Manga chrome participates in layout. No fixed gutters or scrollbar feedback.
  const measure=()=>{const bounds=element.getBoundingClientRect();setBox({width:Math.max(1,manga?bounds.width:element.clientWidth-24),height:Math.max(1,manga?bounds.height:element.clientHeight-24)})}
  const observer=new ResizeObserver(measure);observer.observe(element);measure();return()=>observer.disconnect()
 },[])
 useLayoutEffect(()=>{
  if(!anchor.current||!viewport.current)return
  const point=anchor.current;anchor.current=undefined
  viewport.current.scrollLeft=(surface.width-geometry.width)/2+point.ratioX*geometry.width-point.x
  viewport.current.scrollTop=(surface.height-geometry.height)/2+point.ratioY*geometry.height-point.y
 },[zoom])
 useEffect(()=>()=>{sequence.current++;for(const item of cache.current.values())item.image.src='';cache.current.clear();if(returnFocus.current?.isConnected)returnFocus.current.focus({preventScroll:true})},[])
 const changeZoom=(value:number,x?:number,y?:number)=>{
  const element=viewport.current,state=latest.current;if(!element||!state.active)return
  const next=Math.min(10,Math.max(manga?1:.1,value));if(next===state.zoom)return
  const padding=manga?0:12,pointX=(x??element.clientWidth/2)-padding,pointY=(y??element.clientHeight/2)-padding
  anchor.current={x:pointX,y:pointY,ratioX:(element.scrollLeft+pointX-(state.surface.width-state.geometry.width)/2)/state.geometry.width,ratioY:(element.scrollTop+pointY-(state.surface.height-state.geometry.height)/2)/state.geometry.height}
  latest.current={...state,zoom:next};setZoom(next)
 }
 useEffect(()=>{
  const element=viewport.current;if(!element)return
  const wheel=(event:WheelEvent)=>{
   if(!latest.current.active)return
   event.preventDefault()
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?element.clientHeight:1),bounds=element.getBoundingClientRect()
   changeZoom(latest.current.zoom*Math.exp(-delta*.0015),event.clientX-bounds.left,event.clientY-bounds.top)
  }
  element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel)
 },[])
 const setFitMode=(value:typeof fit)=>{anchor.current=undefined;setFit(value);setZoom(1);viewport.current?.scrollTo(0,0)}
 const exit=()=>{if(ownsFullscreen.current&&document.fullscreenElement){ownsFullscreen.current=false;void document.exitFullscreen().catch(()=>{})}save({page,...(!manga&&fit!=='contain'?{fit}:{}),spread,rtl,firstSingle:first});close()}
 const goToGroup=(index:number)=>{const target=groups[index];if(target){setPage(target[0]);setPageDropdown(false);focusStage()}}
 const step=(delta:number)=>goToGroup(groupIndex+delta)
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if(event.isComposing)return
   if(event.key==='F11'){event.preventDefault();event.stopImmediatePropagation();if(!event.repeat)void toggleImmersive();return}
   if(readingMenu){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setReadingMenu(false)}return}
   if((event.target as HTMLElement)?.closest('input:not([type="checkbox"]):not([type="radio"]),textarea,select,[role="combobox"],[role="listbox"],[contenteditable="true"]')){
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setPageDropdown(false);focusStage()}
    return
   }
   const direction=readerArrowStep(event.key,rtl)
   const actions:Record<string,()=>void>={...(!manga?{w:()=>setFitMode('width'),h:()=>setFitMode('height')}:{}),d:()=>manga&&setSpread(value=>!value),g:()=>{setToolbar(true);setPageDropdown(true);setTimeout(()=>select.current?.focus(),0)},t:()=>{if(!event.repeat)void toggleImmersive()},Escape:()=>{if(immersive||ownsFullscreen.current)void leaveImmersive();else exit()},'+':()=>changeZoom(zoom*1.25),'=':()=>changeZoom(zoom*1.25),'-':()=>changeZoom(zoom/1.25)}
   const action=direction?()=>step(direction):actions[event.key]??actions[event.key.toLowerCase()]
   if(action){event.preventDefault();event.stopImmediatePropagation();action()}
  }
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)
 })
 const frameReady=async(image:HTMLImageElement,frame:Frame,index:number)=>{
  if(frame.loaded.has(index)||frame.token!==sequence.current)return
  try{await image.decode()}catch{if(!image.naturalWidth)return}
  if(frame.loaded.has(index)||frame.token!==sequence.current)return
  frame.loaded.add(index)
  if(frame.loaded.size!==frame.indices.length||frame.committed)return
  frame.committed=true
  requestAnimationFrame(()=>{
   if(frame.token!==sequence.current)return
   setActiveKey(frame.key);setLoading(false);viewport.current?.scrollTo(0,0)
   requestAnimationFrame(()=>setFrames(previous=>previous.filter(item=>item.key===frame.key||item.token>frame.token)))
  })
 }
 const tool=(label:string,key:string,action:()=>void,disabled=false,pressed?:boolean)=><Tooltip zIndex={510} label={label+' · '+key}><Button size="xs" variant={pressed?'light':'default'} aria-pressed={pressed} disabled={disabled} onClick={action}>{label}</Button></Tooltip>
 const pageLabel=(indices:number[])=>indices.map(index=>index+1).join('–')
 const icon=(kind:'prev'|'next'|'minus'|'plus'|'reset'|'focus'|'settings')=><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={{prev:'m12 4-6 6 6 6',next:'m8 4 6 6-6 6',minus:'M4 10h12',plus:'M4 10h12M10 4v12',reset:'M4 7a7 7 0 1 1 0 7M4 3v5h5',focus:'M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4',settings:'M3 5h14M3 10h14M3 15h14M7 3v4M13 8v4M8 13v4'}[kind]}/></svg>
 const iconTool=(label:string,key:string,kind:Parameters<typeof icon>[0],action:()=>void,disabled=false)=><Tooltip zIndex={510} label={label+(key?' · '+key:'')}><ActionIcon aria-label={label} size="lg" variant="subtle" color="gray" disabled={disabled} onClick={action}>{icon(kind)}</ActionIcon></Tooltip>
 return createPortal(<FocusTrap><div className={'reader'+(manga?' manga-reader':'')+(toolbar?'':' reader-focused')} role="dialog" aria-modal="true" aria-label={manga?'漫畫閱讀器':'圖片檢視'}>
  {toolbar&&<Tooltip zIndex={510} label="退出 · ESC"><ActionIcon className="reader-close" variant="subtle" color="gray" size="lg" aria-label="退出閱讀器" onClick={exit}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></ActionIcon></Tooltip>}
  {toolbar&&<div className="reader-toolbar">
   <Group className="reader-tool-group" gap={3} wrap="nowrap">
    {iconTool('上一頁',rtl?'→':'←','prev',()=>step(-1),groupIndex===0)}
    <Tooltip zIndex={510} label="跳至頁碼 · G"><div className="reader-page-select" onMouseDownCapture={event=>{if(event.currentTarget.contains(event.target as Node))event.preventDefault()}} onClickCapture={event=>{if(!event.currentTarget.contains(event.target as Node))return;event.preventDefault();event.stopPropagation();const next=!pageDropdown;select.current?.focus();select.current?.select();setPageDropdown(next)}}><Select ref={select} size="xs" aria-label="頁碼" comboboxProps={{zIndex:510}} searchable limit={20} allowDeselect={false} dropdownOpened={pageDropdown} onDropdownOpen={()=>setPageDropdown(true)} onDropdownClose={()=>setPageDropdown(false)} rightSectionPointerEvents="none" value={String(groupIndex)} data={groups.map((indices,index)=>({value:String(index),label:pageLabel(indices)}))} onChange={value=>value!==null&&goToGroup(Number(value))} onOptionSubmit={()=>{setPageDropdown(false);focusStage()}} w={85}/></div></Tooltip><span className="reader-page-total">/ {images.length}</span>
    {iconTool('下一頁',rtl?'←':'→','next',()=>step(1),groupIndex===groups.length-1)}
   </Group>
   <Group className="reader-tool-group" gap="xs" wrap="nowrap">
    {manga?<><Tooltip zIndex={510} label="單／雙頁 · D"><SegmentedControl size="xs" aria-label="閱讀頁面模式" value={spread?'spread':'single'} data={[{value:'single',label:'單頁'},{value:'spread',label:'雙頁'}]} onChange={value=>setSpread(value==='spread')}/></Tooltip><Menu position="bottom" withinPortal zIndex={510} opened={readingMenu} onChange={setReadingMenu}><Menu.Target><Button size="xs" variant="subtle" color="gray" leftSection={icon('settings')}>閱讀設定</Button></Menu.Target><Menu.Dropdown><Menu.Label>套用目前漫畫</Menu.Label><Menu.Item aria-label={first?'取消首張獨立顯示':'首張獨立顯示'} disabled={!spread} leftSection={first?'✓':'　'} onClick={()=>setFirst(value=>!value)}>首張獨立顯示</Menu.Item><Menu.Item aria-label={rtl?'取消由右至左':'由右至左'} leftSection={rtl?'✓':'　'} onClick={()=>setRtl(value=>!value)}>由右至左</Menu.Item><Menu.Label>{rtl?'← 下一頁 · → 上一頁':'← 上一頁 · → 下一頁'}</Menu.Label></Menu.Dropdown></Menu></>:<>{tool('寬度適應','W',()=>setFitMode('width'),false,fit==='width')}{tool('高度適應','H',()=>setFitMode('height'),false,fit==='height')}<Button size="xs" variant="subtle" onClick={()=>setFitMode('original')}>100%／原尺寸</Button></>}
   </Group>
   <Group className="reader-tool-group reader-zoom-tools" gap={3} wrap="nowrap">{iconTool('縮小','−','minus',()=>changeZoom(zoom/1.25),zoom<=(manga?1:.1))}<span className="reader-zoom-value" title={manga?'100%＝貼合可視區高度；可繼續放大查看細節':undefined}>{Math.round(zoom*100)}%</span>{iconTool('放大','+','plus',()=>changeZoom(zoom*1.25),zoom>=10)}{iconTool('重設縮放','','reset',()=>setFitMode(fit))}{iconTool(immersive?'退出沉浸閱讀':'沉浸閱讀','F11 / T','focus',()=>void toggleImmersive())}</Group>
  </div>}
  <div ref={viewport} className={'reader-viewport reader-stage'+(geometry.width>box.width||geometry.height>box.height?' can-pan':'')} tabIndex={0}
   onPointerDown={event=>{if(event.button!==0||geometry.width<=box.width&&geometry.height<=box.height)return;event.preventDefault();const element=event.currentTarget;drag.current={x:event.clientX,y:event.clientY,left:element.scrollLeft,top:element.scrollTop};element.setPointerCapture(event.pointerId)}}
   onPointerMove={event=>{if(drag.current){event.currentTarget.scrollLeft=drag.current.left-(event.clientX-drag.current.x);event.currentTarget.scrollTop=drag.current.top-(event.clientY-drag.current.y)}}}
   onPointerUp={()=>{drag.current=undefined}} onPointerCancel={()=>{drag.current=undefined}}>
   <div className="reader-surface" style={{width:surface.width,height:surface.height}}>
    {frames.map(frame=>{const size=spreadGeometry(frame.sizes,fit,box,zoom),isActive=frame.key===activeKey,isPrevious=!!active&&frame.token<active.token
     return <div key={frame.key} className={'reader-frame-layer '+(isActive?'is-active':isPrevious?'is-previous':'is-pending')} aria-hidden={!isActive} data-pages={pageLabel(frame.indices)} style={{zIndex:isActive?2:isPrevious?1:3}}>
      <div className={'reader-spread'+(rtl?' rtl':'')} style={{left:Math.max(0,(surface.width-size.width)/2),top:Math.max(0,(surface.height-size.height)/2),width:size.width,height:size.height}}>
       {frame.indices.map((index,position)=><img key={images[index].id} ref={image=>{if(image?.complete&&image.naturalWidth)void frameReady(image,frame,index)}} src={images[index].url} alt={images[index].name} draggable={false} style={{width:size.widths[position],height:size.height}} onLoad={event=>void frameReady(event.currentTarget,frame,index)} onError={()=>{if(frame.token===sequence.current){setLoading(false);setError('無法載入 '+images[index].name)}}}/>)}
      </div>
     </div>
    })}
    {!frames.length&&<div className="reader-loading">{images.length?'載入圖片…':'沒有圖片'}</div>}
   </div>
  </div>
  {toolbar&&<div className="reader-info" aria-live="polite"><strong>{active?'第 '+pageLabel(active.indices)+' / '+images.length+' 頁':''}</strong><span className="reader-image-info" title={active?.indices.map((index,position)=>images[index].name+' · '+active.sizes[position].width+' × '+active.sizes[position].height+' · '+images[index].mime).join(' ｜ ')}>{error?<span role="alert">{error}<Button size="compact-xs" variant="subtle" onClick={()=>{for(const index of group){const item=cache.current.get(images[index].url);if(item){cache.current.delete(images[index].url);item.image.src=''}}setRetry(value=>value+1)}}>重試</Button></span>:loading?'載入第 '+pageLabel(group)+' 頁…':active?.indices.map((index,position)=>images[index].name+' · '+active.sizes[position].width+' × '+active.sizes[position].height+' · '+images[index].mime+' · '+(images[index].size/1024).toFixed(1)+' KB').join(' ｜ ')}</span><span>滾輪縮放 · F11 沉浸閱讀 · ESC 返回</span></div>}
 </div></FocusTrap>,document.body)
}
