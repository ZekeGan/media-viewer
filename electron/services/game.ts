import fs from 'fs'
import { IGameMeta } from '../../shared/type'
import { GamePath } from '../config/env'
import { GameManager } from '../managers/gameManager'

export async function getGameList(): Promise<IGameMeta[]> {
  const gameDirs = fs.readdirSync(GamePath)

  const result: IGameMeta[] = []

  for (const dirName of gameDirs) {
    if (dirName === '_meta') continue

    const game = new GameManager(dirName)

    if (!fs.existsSync(game.gameMetaPath)) {
      await game.createNewMeta()
    }

    const data = await game.getData()
    const meta = await game.getMeta()

    result.push({ data, meta })
  }

  return result
}
