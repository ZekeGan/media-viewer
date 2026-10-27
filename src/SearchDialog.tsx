import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Group, Modal, Pagination, Select, Stack, TextInput } from '@mantine/core'
import type { LinkedProject, Snapshot } from '../shared/model'
import type { SearchResult } from '../shared/explorer'
export function SearchDialog({opened,close,selected,projects,onSelect,onSnapshot,dirty}:{opened:boolean;close:()=>void;selected:string;projects:LinkedProject[];onSelect:(projectId:string,rowId?:string)=>boolean;onSnapshot:(s:Snapshot)=>void;dirty:boolean}) {
  const [scope,setScope]=useState('all'),[query,setQuery]=useState(''),[page,setPage]=useState(1),[result,setResult]=useState<SearchResult>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saveName,setSaveName]=useState('')
  useEffect(()=>{setScope(selected?'current':'all')},[selected])
  useEffect(()=>{setPage(1)},[query,scope])
  useEffect(()=>{if(!opened)return;let alive=true;setBusy(true);const timer=setTimeout(()=>{window.explorer.request({action:'search',query,projectId:scope==='current'?selected:undefined,offset:(page-1)*100,limit:100}).then(r=>{if(alive){setResult(r.search);setError('')}}).catch(e=>{if(alive)setError(String(e))}).finally(()=>{if(alive)setBusy(false)})},100);return()=>{alive=false;clearTimeout(timer)}},[opened,query,scope,selected,page,projects])
  const project=projects.find(p=>p.projectId===selected)?.project
  const save=async()=>{if(!project||!query.trim())return;const name=saveName.trim()||query.trim().slice(0,60);setBusy(true);try{const response=await window.media.request({action:'saveProject',project:{...project,savedSearches:[...(project.savedSearches??[]),{id:crypto.randomUUID(),name,query}]}});onSnapshot(response.snapshot);setSaveName('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  return <Modal opened={opened} onClose={close} title="搜尋資料夾" size="xl"><Stack>
    <Group align="end"><Select label="搜尋範圍" data={[{value:'current',label:'當前專案',disabled:!selected},{value:'all',label:'全部專案'}]} value={scope} allowDeselect={false} onChange={v=>setScope(v??'all')}/><TextInput className="search-query" label="搜尋條件" placeholder={'自由文字、tag:2025,game、name:"中文 名稱"'} autoFocus value={query} onChange={e=>setQuery(e.currentTarget.value)}/></Group>
    <small className="muted">空格／同欄位逗號＝AND；~＝OR；-＝排除；引號包空格，反斜線跳脫。folder_name／path 是基本資訊。</small>
    {error&&<Alert color="red">{error}</Alert>}
    {!!result?.incomplete.length&&<Alert color="orange">以下專案離線或不完整：{result.incomplete.join('、')}</Alert>}
    <Group gap="xs" align="end"><TextInput label="常用搜尋名稱" value={saveName} maxLength={100} placeholder="留空則使用查詢文字" onChange={e=>setSaveName(e.currentTarget.value)}/><Button size="xs" variant="light" onClick={save} disabled={!project||dirty||busy||!query.trim()||(project.savedSearches?.length??0)>=100}>保存常用搜尋</Button><Button size="xs" variant="subtle" onClick={async()=>{try{await window.explorer.request({action:'rebuildIndex'});setQuery(q=>q+' ')}catch(e){setError(String(e))}}}>重建索引</Button><span className="muted">{result?.index}</span></Group>
    {!!project?.savedSearches?.length&&<Group gap={4}>{project.savedSearches.map(s=><Group gap={0} key={s.id}><Button size="compact-xs" variant="default" onClick={()=>setQuery(s.query)} title={s.query}>{s.name}</Button><Button size="compact-xs" variant="subtle" aria-label={`刪除常用搜尋 ${s.name}`} disabled={busy||dirty} onClick={async()=>{try{const response=await window.media.request({action:'saveProject',project:{...project,savedSearches:project.savedSearches!.filter(v=>v.id!==s.id)}});onSnapshot(response.snapshot)}catch(e){setError(String(e))}}}>×</Button></Group>)}</Group>}
    <details><summary>不知道有哪些欄位？展開提示（{result?.fields.length??0}）</summary><div className="field-suggestions">{result?.fields.map(f=><button key={`${f.projectId}/${f.attributeId}`} onClick={()=>setQuery(q=>`${q}${q?' ':''}${JSON.stringify(f.key+'@'+f.attributeId)}:`)}><strong>{f.key}</strong><small>{f.type} · {projects.find(p=>p.projectId===f.projectId)?.project?.name} · {f.attributeId.slice(0,8)}</small></button>)}</div></details>
    <Group justify="space-between"><Badge variant="light">{busy?'搜尋中…':`${result?.total??0} 筆`}</Badge><small>{result?.parsed}</small></Group>
    <div className="search-results" aria-busy={busy}>{!error&&result?.hits.map(r=><button key={r.rowId} disabled={busy} onClick={()=>{if(onSelect(r.projectId,r.rowId))close()}}><strong>{r.name}</strong><span>{projects.find(p=>p.projectId===r.projectId)?.project?.name}</span><small>{r.path}</small><small>命中：{r.matched.join('、')||'條件組合'}</small></button>)}{!busy&&!error&&!result?.hits.length&&<p>沒有符合條件的資料夾。</p>}</div>
    <Pagination total={Math.max(1,Math.ceil((result?.total??0)/100))} value={page} onChange={setPage} disabled={busy}/>
  </Stack></Modal>
}
