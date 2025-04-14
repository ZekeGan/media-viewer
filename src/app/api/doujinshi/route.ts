import fs from 'fs'
import path from 'path'
import { downloadFile } from '@/utils/download'
import { DoujinshiPath } from '@/constants/env'
import { DoujinshiManager } from '@/utils/doujinshiManager'

export async function GET() {
  try {
    const doujinshiDirs = await fs.readdirSync(DoujinshiPath)

    const result: IGameMeta[] = []

    for (const dirName of doujinshiDirs) {
      if (dirName === '_meta') continue

      const doujinshi = new DoujinshiManager(dirName)

      if (!fs.existsSync(doujinshi.doujinshiMetaPath)) {
        await doujinshi.createNewMeta()
      }

      const cover = await doujinshi.getCover()
      const data = await doujinshi.getData()

      result.push({ data, cover })
      break
    }

    return new Response(JSON.stringify({ status: 201, message: 'success', data: result }))
  } catch (err) {
    console.log('error', err)
    return new Response(JSON.stringify({ status: 400, message: 'error', data: [] }))
  }
}
