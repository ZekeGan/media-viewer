import { app } from 'electron'
import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const DB_NAME = '.db'

export async function ensureFile(fileName: string) {
  const dir = path.join(app.getPath('userData'), DB_NAME, fileName)

  await mkdir(dir, { recursive: true })

  //  檢查檔案是否存在，不存在則寫入初始值
  if (!existsSync(dir)) {
    await writeFile(dir, JSON.stringify({}, null, 2), 'utf-8')
  }
}
