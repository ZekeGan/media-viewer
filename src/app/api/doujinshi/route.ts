import fs from 'fs'
import { DoujinshiPath } from '@/constants/env'
import { DoujinshiManager } from '@/utils/doujinshiManager'
import { NextResponse } from 'next/server'
import { cacheTime } from '@/context/server'

export async function GET() {
  try {
    const doujinshiDirs = await fs.readdirSync(DoujinshiPath)

    const result: IDoujinshiMeta[] = []

    for (const dirName of doujinshiDirs) {
      if (dirName === '_meta') continue

      const doujinshi = new DoujinshiManager(dirName)
      try {
        if (!fs.existsSync(doujinshi.doujinshiMetaPath)) {
          await doujinshi.createNewMeta()
        } else {
          await doujinshi.renewMeta()
        }

        const meta = await doujinshi.getMeta()
        const data = await doujinshi.getData()

        result.push({ data, meta })
      } catch {
        continue
      }
    }

    result.sort((a, b) => (a.data.title > b.data.title ? 1 : a.data.title < b.data.title ? -1 : 0))

    return NextResponse.json(
      { status: 201, message: 'success', data: result },
      {
        status: 200,
        headers: {
          // 'Cache-Control': `max-age=${cacheTime}`,
        },
      }
    )
  } catch (err) {
    return NextResponse.json(JSON.stringify({ status: 400, message: 'error', data: [] }))
  }
}
