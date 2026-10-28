import {t as tr, useLocale} from './i18n'
import {useState} from 'react'
import {Alert,Button,Group,Select,Stack,Tabs,Text,TextInput} from '@mantine/core'
import type {Project,ProjectRemovalPreview,CleanupResult,Request,Response} from '../shared/model'

export function ProjectSettings({project,root,busy,dirty,categories,change,act,close}:{project:Project;root:string;busy:boolean;dirty:boolean;categories:{value:string;label:string}[];change:(project:Project)=>void;act:(request:Request)=>Promise<Response|undefined>;close:()=>void}){
 useLocale()

 const [preview,setPreview]=useState<ProjectRemovalPreview>(),[result,setResult]=useState<CleanupResult>()
 return <Tabs defaultValue="general"><Tabs.List><Tabs.Tab value="general">{tr("一般")}</Tabs.Tab><Tabs.Tab value="connection">{tr("連結與資料")}</Tabs.Tab></Tabs.List>
  <Tabs.Panel value="general" pt="lg"><Stack gap="lg">
   <section className="settings-section"><TextInput label={tr("專案名稱")} value={project.name} maxLength={100} onChange={event=>change({...project,name:event.currentTarget.value})}/><Select mt="md" label={tr("媒體分類")} description={tr("決定右側內容的呈現方式，不更改原始資料夾。")} data={categories} allowDeselect={false} value={project.mediaCategory} onChange={value=>value&&change({...project,mediaCategory:value})}/></section>
   <div><Text size="xs" c="dimmed">{tr("資料夾位置")}</Text><Text size="sm" className="path">{root}</Text></div>
   <Text size="sm" c="dimmed">{tr("CARD 的層級、密度與每頁筆數，請由資料夾檢視區的「CARD 顯示設定」調整。")}</Text>
   {!project.scanAll&&<Button variant="default" disabled={busy} onClick={()=>{if(window.confirm(tr("擴大掃描全部層級？僅在允許的資料夾建立記錄，遊戲保護與清理排除仍保留。")))change({...project,scanAll:true})}}>{tr("舊專案：擴大掃描範圍")}</Button>}
   <Group justify="flex-end"><Button variant="default" disabled={busy} onClick={close}>{tr("取消")}</Button><Button loading={busy} disabled={!project.name.trim()||!dirty} onClick={async()=>{if(await act({action:'saveProject',project}))close()}}>{tr("保存專案設定")}</Button></Group>
  </Stack></Tabs.Panel>
  <Tabs.Panel value="connection" pt="lg"><Stack gap="lg">
   <section className="settings-section"><Text fw={600}>{tr("取消專案連結")}</Text><Text size="sm" c="dimmed" my="sm">{tr("只從本機清單移除。專案設定與資料保留，之後可重新連結。")}</Text><Button variant="default" disabled={busy||dirty} onClick={async()=>{if(await act({action:'unlink',projectId:project.projectId}))close()}}>{tr("取消專案連結（保留資料）")}</Button></section>
   <section className="settings-section cleanup-section"><Text fw={600}>{tr("移除專案（刪除資料）")}</Text><Text size="sm" c="dimmed" my="sm">{tr("移除此專案設定與私有覆寫。空白且無其他專案使用的根記錄會先備份到本機復原區，再清除根目錄的 .media-viewer。共用值、圖片、其他專案及原始媒體保留。")}</Text>
    {!preview&&<Button variant="light" color="red" disabled={busy||dirty} onClick={async()=>{setResult(undefined);const response=await act({action:'removeProjectPreview',projectId:project.projectId});if(response?.removalPreview)setPreview(response.removalPreview)}}>{tr("預覽移除專案")}</Button>}
    {preview&&<Stack gap="sm" mt="md"><Alert color="orange" title={tr("即將移除「")+preview.name+'」'}>{tr("從")}{preview.privateCount} {tr("筆現用資料夾記錄移除此專案私有值，並封存此專案設定及備份。")}{preview.rootCleanup&&<><Text size="sm" mt="xs">{tr("根目錄 .media-viewer 將移至本機復原區，重新新增時可建立新的根記錄。")}</Text><Text size="xs" className="path">{tr("復原位置：")}{preview.recoveryPath}</Text></>}</Alert><details><summary>{tr("查看影響範圍（")}{preview.paths.length} {tr("個檔案）")}</summary><div className="file-list">{preview.paths.map(file=><div key={file}>{file}</div>)}</div></details>{preview.skipped.length>0&&<details><summary>{tr("保留／略過項目（")}{preview.skipped.length}）</summary>{preview.skipped.map((text,index)=><Text size="xs" key={index}>{text}</Text>)}</details>}<Group justify="flex-end"><Button variant="default" disabled={busy} onClick={()=>setPreview(undefined)}>{tr("取消移除")}</Button><Button color="red" loading={busy} onClick={async()=>{const response=await act({action:'removeProject',token:preview.token});setPreview(undefined);if(response?.removal){setResult(response.removal);if(!response.removal.failed.length)close()}}}>{tr("確認移除專案及私有資料")}</Button></Group></Stack>}
    {result&&<Alert mt="md" color="orange" title={tr("部分移除未完成")}>{result.failed.map((text,index)=><Text size="xs" key={index}>{text}</Text>)}<Text size="xs">{tr("已處理的記錄保有備份；剩餘資料保留，可重新預覽。")}</Text></Alert>}
   </section>
  </Stack></Tabs.Panel>
 </Tabs>
}
