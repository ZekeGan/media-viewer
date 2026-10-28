import {stabilizeQuery,type StableQuery} from '../shared/query'
import {t as tr, useLocale, fieldTypeLabel} from './i18n'
import { Icon } from './icons'
import { useEffect, useState } from 'react'
import { ActionIcon, Alert, Badge, Button, Group, Loader, Modal, Pagination, Select, Stack, Text, TextInput } from '@mantine/core'
import type { LinkedProject, Snapshot } from '../shared/model'
import type { SearchHit, SearchResult } from '../shared/explorer'
export function SearchDialog({opened,close,selected,projects,onSelect,onSnapshot,dirty}:{opened:boolean;close:()=>void;selected:string;projects:LinkedProject[];onSelect:(projectId:string,rowId?:string)=>boolean;onSnapshot:(s:Snapshot)=>void;dirty:boolean}) {
 useLocale()

  const [scope,setScope]=useState('all'),[query,setQuery]=useState(''),[page,setPage]=useState(1),[result,setResult]=useState<SearchResult>(),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saveName,setSaveName]=useState(''),[hit,setHit]=useState<SearchHit>(),[refresh,setRefresh]=useState(0)
  const [queryAst,setQueryAst]=useState<StableQuery>()
  const project=projects.find(p=>p.projectId===selected)?.project
  useEffect(()=>{setScope(selected?'current':'all')},[selected])
  useEffect(()=>{setPage(1)},[query,scope])
  useEffect(()=>{
    if(!opened)return
    let alive=true;setBusy(true);setError('');setHit(undefined)
    const timer=setTimeout(()=>{window.explorer.request({action:'search',query,queryAst,projectId:scope==='current'?selected:undefined,offset:(page-1)*100,limit:100}).then(r=>{if(alive){setResult(r.search);if(queryAst&&r.search?.resolvedQuery)setQuery(r.search.resolvedQuery);setHit(r.search?.hits[0])}}).catch(e=>{if(alive){setResult(undefined);setError(String(e))}}).finally(()=>{if(alive)setBusy(false)})},150)
    return()=>{alive=false;clearTimeout(timer)}
  },[opened,query,queryAst,scope,selected,page,projects,refresh])
  const open=(target=hit)=>{if(target&&!busy&&onSelect(target.projectId,target.rowId))close()}
  const save=async()=>{if(!project||!query.trim())return;const name=saveName.trim()||query.trim().slice(0,60);setBusy(true);try{const response=await window.media.request({action:'saveProject',project:{...project,savedSearches:[...(project.savedSearches??[]),{id:crypto.randomUUID(),name,query,queryAst:queryAst??stabilizeQuery(query,result?.fields??[])}]}});onSnapshot(response.snapshot);setSaveName('')}catch(e){setError(String(e))}finally{setBusy(false)}}
  return <Modal opened={opened} onClose={close} title={tr("搜尋資料夾")} size="xl" classNames={{body:'folder-search-dialog'}}><Stack gap="md">
    <div className="folder-search-inputs"><TextInput className="search-query" label={tr("資料夾名稱、路徑或欄位值")} placeholder={tr("輸入關鍵字搜尋…")} data-autofocus value={query} maxLength={2000} onChange={e=>{setQueryAst(undefined);setQuery(e.currentTarget.value)}} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();open()}}} leftSection={<Icon name="search" size={17}/>} rightSection={query?<ActionIcon variant="subtle" color="gray" aria-label={tr("清除搜尋")} onClick={()=>{setQueryAst(undefined);setQuery('')}}><Icon name="close" size={15}/></ActionIcon>:null}/><Select label={tr("搜尋範圍")} data={[{value:'current',label:project?tr("目前專案 · ")+project.name:tr("目前專案"),disabled:!selected},{value:'all',label:tr("全部已連結專案")}]} value={scope} allowDeselect={false} onChange={v=>setScope(v??'all')}/></div>
    {error&&<Alert color="red" title={tr("搜尋未完成")}>{error}</Alert>}
    {!!result?.incomplete.length&&<Alert color="orange" title={tr("部分結果無法取得")}>{tr("以下專案離線或不完整：")}{result.incomplete.join('、')}</Alert>}
    <Group justify="space-between" gap="xs"><Text size="sm" c="dimmed">{query.trim()?tr("搜尋結果"):tr("可搜尋的資料夾")}</Text><Group gap="xs">{busy&&<Loader size="xs"/>}<Badge color="gray" variant="light">{busy?tr("搜尋中…"):tr("{0} 個資料夾",result?.total??0)}</Badge></Group></Group>
    <div className="search-results" aria-label={tr("搜尋結果")} aria-busy={busy}>{!error&&result?.hits.map(r=><button key={r.rowId} className={hit?.rowId===r.rowId?'selected':''} aria-pressed={hit?.rowId===r.rowId} disabled={busy} onClick={()=>setHit(r)} onDoubleClick={()=>open(r)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();open(r)}}}><strong>{r.name}</strong><span>{projects.find(p=>p.projectId===r.projectId)?.project?.name}</span><small>{r.path}</small>{!!r.matched.length&&<small>{tr("符合：")}{r.matched.map(key=>key==='folder_name'?tr("資料夾名稱"):key==='path'?tr("路徑"):key).join('、')}</small>}</button>)}{!busy&&!error&&!result?.hits.length&&<div className="search-empty"><Text fw={500}>{query.trim()?tr("找不到符合的資料夾"):tr("目前沒有可搜尋的資料夾")}</Text><Text size="sm" c="dimmed">{query.trim()?tr("試試較短的關鍵字，或切換搜尋範圍。"):tr("先建立／連結專案，並確認資料夾已完成掃描。")}</Text></div>}</div>
    {(result?.total??0)>100&&<Pagination total={Math.ceil(result!.total/100)} value={page} onChange={setPage} disabled={busy} size="sm"/>}
    <details className="search-details"><summary>{tr("常用搜尋")}{project?.savedSearches?.length?' · '+project.savedSearches.length:''}</summary><Stack gap="sm" mt="sm">
      {!!project?.savedSearches?.length&&<Group gap={4}>{project.savedSearches.map(s=><Group gap={0} key={s.id}><Button size="compact-xs" variant="default" onClick={()=>{setQueryAst(s.queryAst);setQuery(s.query)}} title={s.query}>{s.name}</Button><ActionIcon size="sm" variant="subtle" color="gray" aria-label={tr("刪除常用搜尋 {0}",s.name)} disabled={busy||dirty} onClick={async()=>{try{const response=await window.media.request({action:'saveProject',project:{...project,savedSearches:project.savedSearches!.filter(v=>v.id!==s.id)}});onSnapshot(response.snapshot)}catch(e){setError(String(e))}}}><Icon name="close" size={15}/></ActionIcon></Group>)}</Group>}
      <Group align="end"><TextInput className="search-query" label={tr("保存目前條件")} value={saveName} maxLength={100} placeholder={tr("輸入名稱（留空使用搜尋文字）")} onChange={e=>setSaveName(e.currentTarget.value)}/><Button size="sm" variant="default" onClick={save} disabled={!project||dirty||busy||!query.trim()||(project.savedSearches?.length??0)>=100}>{tr("保存到目前專案")}</Button></Group>{!project&&<Text size="xs" c="dimmed">{tr("開啟專案後可保存常用搜尋。")}</Text>}
    </Stack></details>
    <details className="search-details"><summary>{tr("進階搜尋與索引")}</summary><Stack gap="sm" mt="sm"><Text size="sm" c="dimmed">{tr("名稱篩選例：folder_name:\"中文 名稱\"。其他條件可使用下方欄位。空格／同欄位逗號＝同時符合；~＝任一符合；-＝排除。引號包住空格，反斜線用來跳脫。")}</Text>
      {!!result?.fields.length&&<div className="field-suggestions">{result.fields.map(f=><button key={`${f.projectId}/${f.attributeId}`} onClick={()=>{setQueryAst(undefined);setQuery(q=>`${q}${q?' ':''}${JSON.stringify(f.key+'@'+f.attributeId)}:`)}}><strong>{f.key}</strong><small>{fieldTypeLabel(f.type)} · {projects.find(p=>p.projectId===f.projectId)?.project?.name}</small></button>)}</div>}
      {result?.parsed&&<Text size="xs" c="dimmed">{tr("目前條件：")}{result.parsed}</Text>}<Group justify="space-between"><Text size="xs" c="dimmed">{result?.index}</Text><Button size="compact-xs" variant="subtle" color="gray" disabled={busy} onClick={async()=>{setBusy(true);try{await window.explorer.request({action:'rebuildIndex'});setRefresh(v=>v+1)}catch(e){setError(String(e));setBusy(false)}}}>{tr("重建搜尋索引")}</Button></Group>
    </Stack></details>
    <Group className="search-footer" justify="space-between"><Text size="xs" c="dimmed">{tr("選取結果後開啟，也可雙擊直接進入。")}</Text><Group gap="xs"><Button variant="default" onClick={close}>{tr("取消")}</Button><Button disabled={!hit||busy||!!error} onClick={()=>open()}>{tr("開啟資料夾")}</Button></Group></Group>
  </Stack></Modal>
}
