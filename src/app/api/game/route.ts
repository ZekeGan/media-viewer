import fs from 'fs'
import { GamePath } from '@/constants/env'
import { GameManager } from '@/utils/gameManager'
import { NextResponse } from 'next/server'
import { cacheTime } from '@/context/server'

export async function GET() {
  try {
    const gameDirs = await fs.readdirSync(GamePath)

    const result: IGameMeta[] = []

    for (const dirName of gameDirs) {
      if (dirName === '_meta') continue

      const game = new GameManager(dirName)

      if (!fs.existsSync(game.gameMetaPath)) await game.createNewMeta()

      const data = await game.getData()
      const meta = await game.getMeta()
      result.push({ data, meta })
    }

    return NextResponse.json(
      { status: 201, message: 'success', data: result },
      {
        status: 200,
        headers: {
          'Cache-Control': `max-age=${cacheTime}`,
        },
      }
    )
  } catch (err) {
    console.log('error', err)
    return NextResponse.json({ status: 400, message: 'error', data: [] })
  }
}
