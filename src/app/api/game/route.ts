import fs from 'fs'
import { GamePath } from '@/constants/env'
import nodeCache from '@/libs/nodeCache'
import { GameManager } from '@/utils/gameManager'

const listCacheKey = 'game-list'
const dirsCacheKey = 'game-dirs'

export async function GET() {
  try {
    const gameDirs = await fs.readdirSync(GamePath)

    const cachedData = nodeCache.get(listCacheKey)
    const cachedDirs = nodeCache.get(dirsCacheKey) as string[]

    // if (equals(gameDirs, cachedDirs) && cachedData) return cachedData as IGameMeta[]

    console.log('keep')

    const result: IGameMeta[] = []

    for (const dirName of gameDirs) {
      if (dirName === '_meta') continue

      const game = new GameManager(dirName)

      if (!fs.existsSync(game.gameMetaPath)) await game.createNewMeta()

      const cover = await game.getCover()
      const data = await game.getData()

      result.push({ data, cover })
    }

    nodeCache.set(listCacheKey, result)
    return new Response(JSON.stringify({ status: 201, message: 'success', data: result }))
  } catch (err) {
    console.log('error', err)
    return new Response(JSON.stringify({ status: 400, message: 'error', data: [] }))
  }
}
