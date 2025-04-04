/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises
const path = require('path')

const GamePath = 'Z:/Game'

const addUniqueIdToJson = async () => {
  try {
    const { nanoid } = await import('nanoid') // 動態引入 nanoid
    const gameDirs = await fs.readdir(GamePath)

    // 遍歷所有遊戲目錄
    for (const dirName of gameDirs) {
      if (dirName === '_meta') continue // 忽略 _meta 目錄

      const dataPath = path.join(GamePath, dirName, '_meta/data.json')

      try {
        // 嘗試讀取 data.json 檔案
        const fileContent = await fs.readFile(dataPath, 'utf-8')
        const jsonData = JSON.parse(fileContent)

        /** 修改這裡 */

        if (!jsonData.id) {
          jsonData.id = nanoid()
          console.log(jsonData)
        }

        /** */

        await fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), 'utf-8')
      } catch (err) {
        console.error(`Error processing file: ${dataPath}`, err) // 提供具體錯誤訊息
      }
    }
  } catch (err) {
    console.error('Error reading game directories', err) // 捕捉最外層錯誤
  }
}

addUniqueIdToJson()
