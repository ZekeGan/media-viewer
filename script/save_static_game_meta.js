/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises
const path = require('path')

const GamePath = 'Z:/Game'
const allowImageFormat = ['.jpg', '.png', '.webp']

const getGameMetaList = async () => {
  try {
    const gameDirs = await fs.readdir(GamePath)
    const result = []

    for (const dirName of gameDirs) {
      if (dirName === '_meta') continue

      const gameMetaPath = path.join(GamePath, dirName, '_meta')

      try {
        const dirs = await fs.readdir(gameMetaPath)

        const dataPath = path.join(gameMetaPath, 'data.json')
        const coverPath = path.join(
          gameMetaPath,
          dirs.find(dir => allowImageFormat.includes(path.extname(dir))) || ''
        )

        const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))

        const coverBuffer = await fs.readFile(coverPath)
        const cover = `data:image/${path
          .extname(coverPath)
          .slice(1)};base64,${coverBuffer.toString('base64')}`

        result.push({ data, cover })
      } catch {}
    }

    return result
  } catch {
    return []
  }
}

getGameMetaList().then(async data => {
  await fs.mkdir('Z:/Game/_meta', { recursive: true })
  await fs.writeFile('Z:/Game/_meta/data.json', JSON.stringify(data))
})

// await fs.writeFile('Z:/Game/_meta/data.json', JSON.stringify(dataList))
