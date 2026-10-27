import { useEffect, useState } from 'react'
import { ActionIcon, Alert, Badge, Button, Group, Loader, Modal, Pagination, Select, Stack, Text, TextInput } from '@mantine/core'
import type { LinkedProject, Snapshot } from '../shared/model'
import type { SearchHit, SearchResult } from '../shared/explorer'
export function SearchDialog({opened,close,selected,projects,onSelect,onSnapshot,dirty}:{opened:boolean;close:()=>void;selected:string;projects:LinkedProject[];onSelect:(projectId:string,rowId?:string)=>boolean;onSnapshot:(s:Snapshot)=>void;dirty:boolean}) {
  const [scope,setScope]=useState('all'),[query,setQuery]=useState(''),[page,setPage]=useState(1),[result,setResult]=useState<SearchResult>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saveName,setSaveName]=useState(''),[hit,setHit]=useState<SearchHit>(),[refresh,setRefresh]=useState(0)
  const project=projects.find(p=>p.projectId===selected)?.project
  useEffect(()=>{setScope(selected?'current':'all')},[selected])
  useEffect(()=>{setPage(1)},[query,scope])
  useEffect(()=>{
    if(!opened)return
    let alive=true;setBusy(true);setError('');setHit(undefined)
    const timer=setTimeout(()=>{window.explorer.request({action:'search',query,projectId:scope==='current'?selected:undefined,offset:(page-1)*100,limit:100}).then(r=>{if(alive){setResult(r.search);setHit(r.search?.hits[0])}}).catch(e=>{if(alive){setResult(undefined);setError(String(e))}}).finally(()=>{if(alive)setBusy(false)})},150)
    return()=>{alive=false;clearTimeout(timer)}
  },[opened,query,scope,selected,page,projects,refresh])
  const open=(target=hit)=>{if(target&&!busy&&onSelect(target.projectId,target.rowId))close()}
  const save=async()=>{if(!project||!query.trim())return;const name=saveName.trim()||query.trim().slice(0,60);setBusy(true);try{const response=await window.media.request({action:'saveProject',project:{...project,savedSearches:[...(project.savedSearches??[]),{id:crypto.randomUUID(),name,query}]}});onSnapshot(response.snapshot);setSaveName('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  return <Modal opened={opened} onClose={close} title="搜尋資料夾" size="xl" classNames={{body:'folder-search-dialog'}}><Stack gap="md">
    <div className="folder-search-inputs"><TextInput className="search-query" label="資料夾名稱、路徑或欄位值" placeholder="輸入關鍵字搜尋…" data-autofocus value={query} maxLength={2000} onChange={e=>setQuery(e.currentTarget.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();open()}}} leftSection={<svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5"/><path d="m12 12 5 5"/></svg>} rightSection={query?<ActionIcon variant="subtle" color="gray" aria-label="清除搜尋" onClick={()=>setQuery('')}>×</ActionIcon>:null}/><Select label="搜尋範圍" data={[{value:'current',label:project?'目前專案 · '+project.name:'目前專案',disabled:!selected},{value:'all',label:'全部已連結專案'}]} value={scope} allowDeselect={false} onChange={v=>setScope(v??'all')}/></div>
    {error&&<Alert color="red" title="搜尋未完成">{error}</Alert>}
    {!!result?.incomplete.length&&<Alert color="orange" title="部分結果無法取得">以下專案離線或不完整：{result.incomplete.join('、')}</Alert>}
    <Group justify="space-between" gap="xs"><Text size="sm" c="dimmed">{query.trim()?'搜尋結果':'可搜尋的資料夾'}</Text><Group gap="xs">{busy&&<Loader size="xs"/>}<Badge color="gray" variant="light">{busy?'搜尋中…':`${result?.total??0} 個資料夾`}</Badge></Group></Group>
    <div className="search-results" aria-label="搜尋結果" aria-busy={busy}>{!error&&result?.hits.map(r=><button key={r.rowId} className={hit?.rowId===r.rowId?'selected':''} aria-pressed={hit?.rowId===r.rowId} disabled={busy} onClick={()=>setHit(r)} onDoubleClick={()=>open(r)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();open(r)}}}><strong>{r.name}</strong><span>{projects.find(p=>p.projectId===r.projectId)?.project?.name}</span><small>{r.path}</small>{!!r.matched.length&&<small>符合：{r.matched.map(key=>key==='folder_name'?'資料夾名稱':key==='path'?'路徑':key).join('、')}</small>}</button>)}{!busy&&!error&&!result?.hits.length&&<div className="search-empty"><Text fw={500}>{query.trim()?'找不到符合的資料夾':'目前沒有可搜尋的資料夾'}</Text><Text size="sm" c="dimmed">{query.trim()?'試試較短的關鍵字，或切換搜尋範圍。':'先建立／連結專案，並確認資料夾已完成掃描。'}</Text></div>}</div>
    {(result?.total??0)>100&&<Pagination total={Math.ceil(result!.total/100)} value={page} onChange={setPage} disabled={busy} size="sm"/>}
    <details className="search-details"><summary>常用搜尋{project?.savedSearches?.length?' · '+project.savedSearches.length:''}</summary><Stack gap="sm" mt="sm">
      {!!project?.savedSearches?.length&&<Group gap={4}>{project.savedSearches.map(s=><Group gap={0} key={s.id}><Button size="compact-xs" variant="default" onClick={()=>setQuery(s.query)} title={s.query}>{s.name}</Button><ActionIcon size="sm" variant="subtle" color="gray" aria-label={`刪除常用搜尋 ${s.name}`} disabled={busy||dirty} onClick={async()=>{try{const response=await window.media.request({action:'saveProject',project:{...project,savedSearches:project.savedSearches!.filter(v=>v.id!==s.id)}});onSnapshot(response.snapshot)}catch(e){setError(String(e))}}}>×</ActionIcon></Group>)}</Group>}
      <Group align="end"><TextInput className="search-query" label="保存目前條件" value={saveName} maxLength={100} placeholder="輸入名稱（留空使用搜尋文字）" onChange={e=>setSaveName(e.currentTarget.value)}/><Button size="sm" variant="default" onClick={save} disabled={!project||dirty||busy||!query.trim()||(project.savedSearches?.length??0)>=100}>保存到目前專案</Button></Group>{!project&&<Text size="xs" c="dimmed">開啟專案後可保存常用搜尋。</Text>}
    </Stack></details>
    <details className="search-details"><summary>進階搜尋與索引</summary><Stack gap="sm" mt="sm"><Text size="sm" c="dimmed">名稱篩選例：folder_name:"中文 名稱"。其他條件可使用下方欄位。空格／同欄位逗號＝同時符合；~＝任一符合；-＝排除。引號包住空格，反斜線用來跳脫。</Text>
      {!!result?.fields.length&&<div className="field-suggestions">{result.fields.map(f=><button key={`${f.projectId}/${f.attributeId}`} onClick={()=>setQuery(q=>`${q}${q?' ':''}${JSON.stringify(f.key+'@'+f.attributeId)}:`)}><strong>{f.key}</strong><small>{f.type} · {projects.find(p=>p.projectId===f.projectId)?.project?.name}</small></button>)}</div>}
      {result?.parsed&&<Text size="xs" c="dimmed">目前條件：{result.parsed}</Text>}<Group justify="space-between"><Text size="xs" c="dimmed">{result?.index}</Text><Button size="compact-xs" variant="subtle" color="gray" disabled={busy} onClick={async()=>{setBusy(true);try{await window.explorer.request({action:'rebuildIndex'});setRefresh(v=>v+1)}catch(e){setError(String(e));setBusy(false)}}}>重建搜尋索引</Button></Group>
    </Stack></details>
    <Group className="search-footer" justify="space-between"><Text size="xs" c="dimmed">選取結果後開啟，也可雙擊直接進入。</Text><Group gap="xs"><Button variant="default" onClick={close}>取消</Button><Button disabled={!hit||busy||!!error} onClick={()=>open()}>開啟資料夾</Button></Group></Group>
  </Stack></Modal>
}
