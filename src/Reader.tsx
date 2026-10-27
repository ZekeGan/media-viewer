import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Checkbox, FocusTrap, Group, Select, Tooltip } from '@mantine/core'
import type { MediaEntry, ReadingPrefs } from '../shared/explorer'
export function Reader({images,start,manga,prefs,close,save}:{images:MediaEntry[];start:number;manga:boolean;prefs?:ReadingPrefs;close:()=>void;save:(prefs:ReadingPrefs)=>void}) {
  const [page,setPage]=useState(start),[fit,setFit]=useState<'height'|'width'|'original'>(prefs?.fit??'height'),[spread,setSpread]=useState(prefs?.spread??false),[rtl,setRtl]=useState(prefs?.rtl??false),[first,setFirst]=useState(prefs?.firstSingle??false),[toolbar,setToolbar]=useState(true),[zoom,setZoom]=useState(1),[info,setInfo]=useState('')
  const select=useRef<HTMLInputElement>(null),viewport=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;left:number;top:number}>()
  const groups=useMemo(()=>{const out:number[][]=[];for(let i=0;i<images.length;){const pair=manga&&spread&&!(first&&i===0);out.push([i,...(pair&&i+1<images.length?[i+1]:[])]);i+=pair?2:1}return out},[images,manga,spread,first])
  const groupIndex=Math.max(0,groups.findIndex(g=>g.includes(page))), group=groups[groupIndex]??[0], current=images[page]
  const exit=()=>{save({page,fit,spread,rtl,firstSingle:first});close()}
  const previous=()=>{if(groupIndex>0)setPage(groups[groupIndex-1][0])},next=()=>{if(groupIndex<groups.length-1)setPage(groups[groupIndex+1][0])}
  useEffect(()=>{viewport.current?.scrollTo(0,0);setZoom(1)},[page,fit,spread])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.isComposing)return;const input=(e.target as HTMLElement)?.closest('input,textarea,[role="combobox"],[role="listbox"]');if(input){if(e.key==='Escape'){e.stopImmediatePropagation();e.preventDefault();(document.activeElement as HTMLElement)?.blur()}return}const actions:Record<string,()=>void>={ArrowLeft:previous,ArrowRight:next,w:()=>setFit('width'),h:()=>setFit('height'),d:()=>setSpread(v=>!v),g:()=>{setToolbar(true);setTimeout(()=>select.current?.focus(),0)},t:()=>setToolbar(v=>!v),Escape:exit,'+':()=>setZoom(v=>Math.min(10,v*1.25)),'-':()=>setZoom(v=>Math.max(.1,v/1.25))};const action=actions[e.key]??actions[e.key.toLowerCase()];if(action){e.preventDefault();e.stopImmediatePropagation();action()}};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true)})
  useEffect(()=>{const nextImage=images[groups[groupIndex+1]?.[0]];if(!nextImage)return;const img=new Image();img.src=nextImage.url;return()=>{img.src=''}},[groupIndex,groups,images])
  const tool=(label:string,key:string,action:()=>void,disabled=false)=><Tooltip zIndex={500} label={`${label} · ${key}`}><Button size="xs" variant="default" disabled={disabled} onClick={action}>{label}</Button></Tooltip>
  return createPortal(<FocusTrap><div className="reader" role="dialog" aria-modal="true" aria-label={manga?'漫畫閱讀器':'圖片檢視'}>
    <div className="reader-reveal" onMouseEnter={()=>setToolbar(true)}/>
    {toolbar&&<div className="reader-toolbar"><Group gap="xs">{tool('上一頁','←',previous,groupIndex===0)}{tool('下一頁','→',next,groupIndex===groups.length-1)}{tool('寬度適應','W',()=>setFit('width'))}{tool('高度適應','H',()=>setFit('height'))}{manga&&tool(spread?'雙頁':'單頁','D',()=>setSpread(v=>!v))}
      {!manga&&<>{tool('縮小','−',()=>setZoom(v=>Math.max(.1,v/1.25)))}{tool('放大','+',()=>setZoom(v=>Math.min(10,v*1.25)))}<Button size="xs" variant="default" onClick={()=>{setFit('original');setZoom(1)}}>100%／原尺寸</Button><span>{Math.round(zoom*100)}%</span></>}
      <Select ref={select} aria-label="頁碼" comboboxProps={{zIndex:500}} searchable limit={20} value={String(groupIndex)} data={groups.map((g,i)=>({value:String(i),label:g.map(n=>n+1).join('–')}))} onChange={v=>v!==null&&setPage(groups[Number(v)][0])} w={110}/>{tool('隱藏工具列','T',()=>setToolbar(false))}{tool('退出','ESC',exit)}</Group>
      {manga&&<Group gap="md" mt={6}><Checkbox size="xs" label="由右至左" checked={rtl} onChange={e=>setRtl(e.currentTarget.checked)}/><Checkbox size="xs" label="首張獨立顯示" checked={first} onChange={e=>setFirst(e.currentTarget.checked)}/></Group>}
      <small>{current?.name} · {info} · {current?.mime} · {((current?.size??0)/1024).toFixed(1)} KB</small>
    </div>}
    <div ref={viewport} className={`reader-viewport fit-${fit}`} onPointerDown={e=>{if(zoom<=1)return;const el=e.currentTarget;drag.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop};el.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current){e.currentTarget.scrollLeft=drag.current.left-(e.clientX-drag.current.x);e.currentTarget.scrollTop=drag.current.top-(e.clientY-drag.current.y)}}} onPointerUp={()=>{drag.current=undefined}}>
      <div className={`reader-pages ${rtl?'rtl':''}`} style={{zoom}}>{group.map(index=><img key={images[index].id} src={images[index].url} alt={images[index].name} draggable={false} style={fit==='height'?{maxWidth:`${100/group.length}%`}:fit==='original'?undefined:{width:`${100/group.length}%`}} onLoad={e=>{if(index===group[0])setInfo(`${e.currentTarget.naturalWidth} × ${e.currentTarget.naturalHeight}`)}}/>)}</div>
    </div>
  </div></FocusTrap>,document.body)
}
