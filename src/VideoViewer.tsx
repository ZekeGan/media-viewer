import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, ColorInput, Group, Modal, NumberInput, Select, Stack } from '@mantine/core'
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import type { FolderRow } from '../shared/model'
import { defaultSubtitle, type ExplorerRequest, type ExplorerResponse, type MediaEntry, type SubtitlePrefs } from '../shared/explorer'
import { parseSubtitles, type Cue } from '../shared/subtitles'
export function VideoViewer({row,entries,run,autoplay,settingsOpened,closeSettings}:{row:FolderRow;entries:MediaEntry[];run:(req:ExplorerRequest)=>Promise<ExplorerResponse|undefined>;autoplay:boolean;settingsOpened:boolean;closeSettings:()=>void}){
  const videos=entries.filter(e=>e.kind==='video'),subtitles=entries.filter(e=>e.kind==='subtitle')
  const [fileId,setFileId]=useState(videos[0]?.id),[subtitle,setSubtitle]=useState<ExplorerResponse['subtitle']>(),[cues,setCues]=useState<Cue[]>([]),[settings,setSettings]=useState(defaultSubtitle),[error,setError]=useState(''),[time,setTime]=useState(0),[files,setFiles]=useState<File[]>([])
  const [options,setOptions]=useState(false)
  const video=useRef<HTMLVideoElement|null>(null),stage=useRef<HTMLDivElement>(null),latest=useRef(row),saving=useRef(false),strip=useRef<HTMLDivElement>(null),wantsPlayback=useRef(autoplay),pendingStart=useRef(false)
  const release=(node:HTMLVideoElement)=>{node.pause();node.removeAttribute('src');node.load()}
  const bindVideo=useCallback((node:HTMLVideoElement|null)=>{const previous=video.current;video.current=node;pendingStart.current=false;if(previous&&previous!==node)release(previous)},[])
  const [box,setBox]=useState({bottom:0,left:0,width:0,height:0})
  latest.current=row;const file=videos.find(v=>v.id===fileId)??videos[0]
  const save=async()=>{if(!file||!subtitle||row.readonly||!latest.current.record||saving.current)return;saving.current=true;try{await run({action:'playback',rowId:row.rowId,revision:latest.current.record.revision,fileId:file.id,time:0,subtitle:subtitle.token,settings})}finally{saving.current=false}}
  const apply=(value:ExplorerResponse['subtitle'])=>{if(!value)return;try{const parsed=parseSubtitles(value.text);setCues(parsed);setSubtitle(value);setSettings(latest.current.record?.details?.playback?.[file?.id??'']?.settings?.[value.token]??defaultSubtitle());setError('')}catch(e){setError(String(e))}}
  const load=async(entry?:MediaEntry,external?:File)=>{try{const result=external?await window.explorer.dropSubtitle(row.rowId,external):await window.explorer.request(entry?{action:'subtitle',rowId:row.rowId,fileId:entry.id,encoding:settings.encoding}:{action:'chooseSubtitle',rowId:row.rowId});apply(result.subtitle)}catch(e){setError(String(e))}}
  useEffect(()=>{setSubtitle(undefined);setCues([]);setError('');setTime(0)},[file?.id])
  useEffect(()=>{wantsPlayback.current=autoplay;if(!autoplay)pendingStart.current=false},[autoplay])
  useEffect(()=>{const visibility=()=>{const node=video.current;if(document.hidden)node?.pause();else if(node&&pendingStart.current)void playSelected(node)};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility)},[])
  useEffect(()=>{const update=()=>{const el=video.current,container=stage.current;if(!el||!container)return;const bounds=container.getBoundingClientRect(),ratio=(el.videoWidth||16)/(el.videoHeight||9),width=Math.min(bounds.width,bounds.height*ratio),height=width/ratio;setBox({left:(bounds.width-width)/2,bottom:(bounds.height-height)/2,width,height})};const observer=new ResizeObserver(update);if(stage.current)observer.observe(stage.current);video.current?.addEventListener('loadedmetadata',update);return()=>{observer.disconnect();video.current?.removeEventListener('loadedmetadata',update)}},[file?.id])
  const playSelected=async(node:HTMLVideoElement)=>{
    if(node!==video.current||!node.isConnected)return
    if(document.hidden){pendingStart.current=true;return}
    pendingStart.current=false
    try{await node.play();if(node!==video.current||!node.isConnected||document.hidden)node.pause();else setError('')}
    catch(reason){if(node===video.current&&node.isConnected&&(reason as Error).name!=='AbortError')setError('無法自動播放，請按播放器的播放按鈕。')}
  }
  const selectVideo=async(entry:MediaEntry)=>{
    if(entry.id===file?.id){if(video.current)void playSelected(video.current);return}
    wantsPlayback.current=true;video.current?.pause();setFileId(entry.id)
  }
  useEffect(()=>{
    const element=strip.current;if(!element)return
    const wheel=(event:WheelEvent)=>{
      if(event.ctrlKey||element.scrollWidth<=element.clientWidth)return
      const delta=(Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY)*(event.deltaMode===1?16:event.deltaMode===2?element.clientWidth:1),next=Math.max(0,Math.min(element.scrollWidth-element.clientWidth,element.scrollLeft+delta))
      if(next!==element.scrollLeft){event.preventDefault();element.scrollLeft=next}
    }
    element.addEventListener('wheel',wheel,{passive:false});return()=>element.removeEventListener('wheel',wheel)
  },[entries])
  const visible=cues.filter(c=>time>=c.start+settings.offset&&time<c.end+settings.offset).map(c=>c.text).join('\n')
  if(!file)return <div className="video-empty">此資料夾沒有直接影片</div>
  return <div className="video-viewer">
    <div className="video-stage" ref={stage} onDragOver={e=>{if(e.dataTransfer.types.includes('Files')||e.dataTransfer.types.includes('application/x-media-subtitle'))e.preventDefault()}} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('application/x-media-subtitle');if(id){const entry=subtitles.find(s=>s.id===id);if(entry)void load(entry)}else{const incoming=[...e.dataTransfer.files];setFiles(incoming);if(incoming.length>1)setOptions(true);if(incoming.length===1)void load(undefined,incoming[0])}}}>
      <VideoPlayer key={file.id}><VideoSkin style={{width:'100%',height:'100%',aspectRatio:'auto'}}><Video ref={bindVideo} src={file.url} playsInline autoPlay={false} preload="metadata" onPlay={event=>{if(event.currentTarget!==video.current||!event.currentTarget.isConnected)event.currentTarget.pause()}} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onLoadedMetadata={event=>{if(wantsPlayback.current)void playSelected(event.currentTarget)}} onError={()=>setError('此影片無法解碼或已失效；首輪驗證 MP4／WebM，MKV／HEVC 不保證支援。')}/>
        {visible&&<div className="subtitle-overlay" style={{left:box.left,width:box.width||'100%',bottom:box.bottom+box.height*settings.bottom/100,fontSize:settings.size,color:settings.color}}><span style={{background:settings.background+'c0'}}>{visible}</span></div>}
        {error&&<div className="video-error" role="alert">{error}</div>}
      </VideoSkin></VideoPlayer>
    </div>
    <div ref={strip} className="video-strip" aria-label="資料夾影片">{videos.map(entry=><button key={entry.id} className={'video-tile '+(entry.id===file.id?'active':'')} aria-label={'播放 '+entry.name} title={entry.name} onClick={()=>void selectVideo(entry)}>
      {entry.thumb?<img src={entry.thumb} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<span className="video-symbol">▶</span>}<span>{entry.name}</span>
    </button>)}</div>
    <Modal opened={options||settingsOpened} onClose={()=>{setOptions(false);closeSettings()}} title="字幕設定" size="lg" zIndex={450}><Stack>{error&&<Alert color="orange">{error}</Alert>}
    <Group gap="xs"><Button size="xs" variant="light" onClick={()=>void load()}>載入字幕／拖到播放器</Button><Button size="xs" variant="default" disabled={!subtitle} onClick={()=>{setSubtitle(undefined);setCues([])}}>關閉字幕</Button><Button size="xs" variant="light" disabled={!subtitle||row.readonly} onClick={()=>void save()}>保存字幕設定</Button>{subtitle&&!subtitle.portable&&<Button size="xs" disabled={row.readonly} onClick={async()=>{const result=await run({action:'subtitle',rowId:row.rowId,externalToken:subtitle.token,import:true,encoding:settings.encoding});apply(result?.subtitle)}}>匯入字幕可攜副本</Button>}</Group>
    {files.length>1&&<Select label="選擇拖入的字幕" data={files.map((f,i)=>({value:String(i),label:f.name}))} onChange={v=>v!==null&&void load(undefined,files[Number(v)])}/>}
    {subtitles.length>0&&<div className="subtitle-list">{subtitles.map(s=><Button key={s.id} size="xs" variant="subtle" draggable onDragStart={e=>e.dataTransfer.setData('application/x-media-subtitle',s.id)} onClick={()=>void load(s)}>{s.name}</Button>)}</div>}
    {subtitle&&<details open><summary>字幕設定：{subtitle.name}（{subtitle.portable?'資料夾內來源':'本次臨時來源'}）</summary><Group align="end"><NumberInput label="延後秒數（正值＝晚出現）" decimalScale={1} step={.1} min={-86400} max={86400} value={settings.offset} onChange={v=>typeof v==='number'&&setSettings(s=>({...s,offset:v}))}/><Button size="xs" onClick={()=>setSettings(s=>({...s,offset:Math.round((s.offset-.1)*10)/10}))}>提早 0.1 秒</Button><Button size="xs" onClick={()=>setSettings(s=>({...s,offset:Math.round((s.offset+.1)*10)/10}))}>延後 0.1 秒</Button><NumberInput label="字幕大小" min={10} max={80} value={settings.size} onChange={v=>typeof v==='number'&&setSettings(s=>({...s,size:v}))}/><NumberInput label="距畫面底部 %" min={0} max={80} value={settings.bottom} onChange={v=>typeof v==='number'&&setSettings(s=>({...s,bottom:v}))}/><ColorInput label="字幕顏色" value={settings.color} onChange={v=>/^#[0-9a-f]{6}$/i.test(v)&&setSettings(s=>({...s,color:v}))}/><ColorInput label="字幕背景" value={settings.background} onChange={v=>/^#[0-9a-f]{6}$/i.test(v)&&setSettings(s=>({...s,background:v}))}/><Select label="文字編碼" value={settings.encoding} data={['utf-8','big5','shift_jis']} onChange={async v=>{if(!v)return;try{const result=await window.explorer.request({action:'subtitle',rowId:row.rowId,...(subtitles.some(s=>s.id===subtitle.token)?{fileId:subtitle.token}:{externalToken:subtitle.token}),encoding:v});if(result.subtitle){const parsed=parseSubtitles(result.subtitle.text);setCues(parsed);setSubtitle(result.subtitle);setSettings(s=>({...s,encoding:v as SubtitlePrefs['encoding']}))}}catch(e){setError(String(e))}}}/><Button variant="default" size="xs" onClick={()=>setSettings(defaultSubtitle())}>重設</Button></Group><small className="muted">固定延遲無法修復逐漸累積的時間差；請改用對應版本字幕。設定按影片與字幕來源保存。</small></details>}
    </Stack></Modal>
  </div>
}
