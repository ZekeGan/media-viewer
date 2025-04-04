/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises
const path = require('path')

const GamePath = path.join('Z:/Game')
const TargetPath = path.join(__dirname, '../src/assets/')

const copyCover = async () => {
  try {
    const gameDirs = await fs.readdir(GamePath)

    // 遍歷所有遊戲目錄
    const copyTasks = gameDirs
      .filter(dirName => dirName !== '_meta')
      .map(async dirName => {
        const metaDir = path.join(GamePath, dirName, '_meta')

        try {
          const dirs = await fs.readdir(metaDir)
          const coverFile = dirs.find(file =>
            ['.jpg', '.png', '.webp'].includes(path.extname(file))
          )

          if (!coverFile) return

          const coverPath = path.join(metaDir, coverFile)
          const dataPath = path.join(metaDir, 'data.json')

          const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
          const newCoverName = `${data.id}${path.extname(coverFile)}`
          const targetCoverPath = path.join(TargetPath, newCoverName)

          // 複製封面文件
          await fs.copyFile(coverPath, targetCoverPath)
        } catch {}
      })

    // 等待所有拷貝操作完成
    await Promise.all(copyTasks)
  } catch {}
}

copyCover()
