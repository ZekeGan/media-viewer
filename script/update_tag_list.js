/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs').promises

const GamePath = 'Z:/Game'

async function updateTag() {
  const set = new Set()

  try {
    const dirs = await fs.readdir(GamePath)

    for (const dir of dirs) {
      const dataPath = `${GamePath}/${dir}/_meta/data.json`

      const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'))
      data.tags.forEach(i => set.add(i))
    }
    console.log(Array.from(set))
  } catch {}
}

updateTag()
