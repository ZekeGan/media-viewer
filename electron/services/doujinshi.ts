import fs from 'fs'
import { IDoujinshiMeta } from '../../shared/type'
import { DoujinshiPath } from '../config/env'
import { DoujinshiManager } from '../managers/doujinshiManager'

export async function getDoujinshiList() {
  const doujinshiDirs = await fs.readdirSync(DoujinshiPath)

  const result: IDoujinshiMeta[] = []

  for (const dirName of doujinshiDirs) {
    if (dirName === '_meta') continue

    const doujinshi = new DoujinshiManager(dirName)
    try {
      if (!fs.existsSync(doujinshi.doujinshiMetaPath)) {
        await doujinshi.createNewData()
      } else {
        // await doujinshi.createNewData()
      }

      const data = await doujinshi.getData()
      const meta = await doujinshi.getMeta()

      result.push({ data, meta })
    } catch {
      continue
    }
  }

  result.sort((a, b) =>
    a.data.title > b.data.title ? 1 : a.data.title < b.data.title ? -1 : 0
  )

  return result
}
