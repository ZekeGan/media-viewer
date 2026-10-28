import fs from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { missing, safePath } from './files'
import { importSettings } from './settings-package'
import type { SettingsPackage } from '../shared/workspace'

export async function writeSettingsFile(file:string,value:SettingsPackage) {
  if(path.extname(file).toLowerCase()!=='.json'||file.split(/[\\/]/).some(part=>part.toLowerCase()==='.media-viewer'))throw new Error('請選擇獨立的 JSON 設定包檔案')
  await safePath(path.dirname(file),file)
  const stat=await fs.stat(file).catch(error=>{if(!missing(error))throw error})
  if(stat&&(!stat.isFile()||stat.size>4*1024*1024))throw new Error('既有檔案不是設定包，未覆寫')
  const old=stat?await fs.readFile(file):undefined
  if(old)importSettings(JSON.parse(old.toString('utf8')))
  const temporary=file+'.'+randomUUID()+'.tmp'
  let created=false
  try {
    const handle=await fs.open(temporary,'wx');created=true
    try {await handle.writeFile(JSON.stringify(value,null,2));await handle.sync()}finally{await handle.close()}
    const now=await fs.readFile(file).catch(error=>{if(!missing(error))throw error})
    if(old?!now||!old.equals(now):!!now)throw new Error('設定包在匯出期間已改變，未覆寫')
    if(old)await fs.writeFile(file+'.'+randomUUID()+'.bak',old,{flag:'wx'})
    await fs.rename(temporary,file)
  } finally {if(created)await fs.unlink(temporary).catch(()=>{})}
}
