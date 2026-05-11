// import { ipcMain } from 'electron'
// import fs from 'fs'
// import { GamePath } from '../../src/constants/env.js'
// import { IGameMeta } from '../../src/global.js'
// import { GameManager } from '../../src/utils/gameManager.js'

// ipcMain.handle('get-games', async () => {
//   try {
//     const gameDirs = fs.readdirSync(GamePath)

//     const result: IGameMeta[] = []

//     for (const dirName of gameDirs) {
//       if (dirName === '_meta') continue

//       const game = new GameManager(dirName)

//       if (!fs.existsSync(game.gameMetaPath)) {
//         await game.createNewMeta()
//       }

//       const data = await game.getData()
//       const meta = await game.getMeta()

//       result.push({ data, meta })
//     }

//     return result
//   } catch (err) {
//     console.error(err)
//     return []
//   }
// })
