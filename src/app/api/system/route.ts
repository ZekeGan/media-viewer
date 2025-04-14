import { CompanyName, ProjectName } from '@/constants/env'
import nodeCache from '@/libs/nodeCache'
import fs from 'fs'
import path from 'path'

const systemCacheKey = 'system'

const defaultData: ISystem = {
  game_tags: {},
  game_parent: {},
}

export async function GET() {
  try {
    const cachedData = nodeCache.get(systemCacheKey) as ISystem
    // if (cachedData) return cachedData

    const appDataPath = process.env.APPDATA
    if (!appDataPath) throw new Error()

    // create system folder if folder didn't exit
    const envDataPath = path.join(appDataPath, CompanyName, ProjectName)
    if (!fs.existsSync(envDataPath)) {
      await fs.mkdirSync(envDataPath, { recursive: true })
    }

    // create system.json if file didn't exit
    const systemDataPath = path.join(envDataPath, 'system.json')
    if (!fs.existsSync(systemDataPath)) {
      await fs.writeFileSync(systemDataPath, JSON.stringify(defaultData, null, 2), 'utf-8')
    }

    // read system.json
    const data = JSON.parse(await fs.readFileSync(systemDataPath, 'utf-8')) as ISystem

    return new Response(JSON.stringify({ status: 201, message: 'success', data }))
  } catch (err) {
    console.log('error', err)
    return new Response(JSON.stringify({ status: 400, message: 'error', data: defaultData }))
  }
}
