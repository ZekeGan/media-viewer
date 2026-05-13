import { app } from 'electron'
import { existsSync } from 'fs'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { ISystem } from '../../shared/type'
import { defaultSystemData } from '../config/defaultData'

const DB_NAME = '.db'
const DB_PATH = path.join(app.getPath('userData'), DB_NAME)
const SYSTEM_DATA_PATH = path.join(
  app.getPath('userData'),
  DB_NAME,
  'system.json'
)

// export async function saveTags(tags: any) {
//   console.log(tags)

//   await writeFile(SYSTEM_DATA_PATH, JSON.stringify(tags))
// }

export async function getSystemData() {
  //  確保目錄存在 (recursive: true 若目錄已存在不會報錯)
  await mkdir(DB_PATH, { recursive: true })

  //  檢查檔案是否存在，不存在則寫入初始值
  if (!existsSync(SYSTEM_DATA_PATH)) {
    await writeFile(
      SYSTEM_DATA_PATH,
      JSON.stringify(defaultSystemData, null, 2),
      'utf-8'
    )
  }

  // 讀取並解析
  const rawData = await readFile(SYSTEM_DATA_PATH, 'utf-8')
  const data = JSON.parse(rawData) as ISystem

  return data
}
