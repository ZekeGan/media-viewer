import { useEffect, useRef, useState } from 'react'
import { Button, Group, SegmentedControl } from '@mantine/core'
import type { MediaEntry, ReadingPrefs } from '../shared/explorer'
import { Reader } from './Reader'
function Thumbnail({entry,animate,onClick}:{entry:MediaEntry;animate:boolean;onClick:()=>void}){
  const ref=useRef<HTMLButtonElement>(null),[visible,setVisible]=useState(false),[error,setError]=useState(false),[fallback,setFallback]=useState(false)
  useEffect(()=>{setError(false);setFallback(false)},[entry.url,entry.thumb])
  useEffect(()=>{const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting));if(ref.current)observer.observe(ref.current);return()=>observer.disconnect()},[])
  return <button className="media-thumbnail" ref={ref} onClick={onClick} title={entry.name}>{visible&&!error?<img loading="lazy" src={fallback||animate&&entry.mime==='image/gif'?entry.url:entry.thumb??entry.url} alt={entry.name} onError={()=>{if(!fallback&&entry.thumb)setFallback(true);else setError(true)}}/>:<span>{error?'圖片無法載入':'圖片'}</span>}<small>{entry.name}</small></button>
}
export function Gallery({entries,manga,prefs,save,onReader}:{entries:MediaEntry[];manga:boolean;prefs?:ReadingPrefs;save:(p:ReadingPrefs)=>void;onReader:(opened:boolean)=>void}){
  const [mode,setMode]=useState('masonry'),[page,setPage]=useState(0),[reader,setReader]=useState<number>(),[selected,setSelected]=useState<MediaEntry>()
  const images=entries.filter(e=>e.kind==='image')
  useEffect(()=>{onReader(reader!==undefined);return()=>onReader(false)},[reader,onReader])
  return <div className="gallery"><Group justify="space-between" mb="sm"><strong>{images.length} 張圖片</strong>{!manga&&<SegmentedControl size="xs" value={mode} onChange={setMode} data={[{value:'masonry',label:'瀑布流'},{value:'list',label:'列表'}]}/>}<Button size="compact-xs" variant="subtle" onClick={()=>document.querySelector('.folder-panel-body')?.scrollTo({top:0,behavior:'smooth'})}>TOP</Button></Group>
    {!images.length&&<p className="muted">此資料夾沒有直接圖片。</p>}
    <div className={mode==='list'&&!manga?'image-file-list':manga?'manga-gallery':'masonry-gallery'}>{images.slice(page*200,(page+1)*200).map((entry,index)=>mode==='list'&&!manga?<div key={entry.id} className={`image-file-row ${selected?.id===entry.id?'selected':''}`} onClick={()=>setSelected(entry)}><Thumbnail entry={entry} animate={reader===undefined} onClick={()=>setReader(page*200+index)}/><span>{entry.name}</span><small>{new Date(entry.modified).toLocaleDateString()}</small><small>{(entry.size/1024).toFixed(1)} KB</small></div>:<Thumbnail key={entry.id} entry={entry} animate={reader===undefined} onClick={()=>setReader(page*200+index)}/>)}</div>
    {images.length>200&&<Group justify="space-between"><Button variant="light" disabled={!page} onClick={()=>setPage(v=>v-1)}>上一組</Button><small>每組 200 張 · {page+1}／{Math.ceil(images.length/200)}</small><Button variant="light" disabled={(page+1)*200>=images.length} onClick={()=>setPage(v=>v+1)}>下一組</Button></Group>}
    {selected&&<p>{selected.name} · {selected.mime} · {(selected.size/1024).toFixed(1)} KB</p>}
    {reader!==undefined&&<Reader images={images} start={reader} manga={manga} prefs={prefs} save={save} close={()=>setReader(undefined)}/>}
  </div>
}
