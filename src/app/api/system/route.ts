import { CompanyName, ProjectName } from '@/constants/env'
import nodeCache from '@/libs/nodeCache'
import fs from 'fs'
import path from 'path'

const systemCacheKey = 'system'

const defaultData: ISystem = {
  tags: {},
  system: {},
}

export async function GET() {
  try {
    const cachedData = nodeCache.get(systemCacheKey) as ISystem
    // if (cachedData) return cachedData

    const appDataPath = process.env.APPDATA
    if (!appDataPath) throw new Error()

    const envDataPath = path.join(appDataPath, CompanyName, ProjectName)
    if (!fs.existsSync(envDataPath)) {
      await fs.mkdirSync(envDataPath, { recursive: true })
    }

    const systemDataPath = path.join(envDataPath, 'system.json')
    if (!fs.existsSync(systemDataPath)) {
      await fs.writeFileSync(systemDataPath, JSON.stringify({ tags: {} }, null, 2), 'utf-8')
    }

    const data = JSON.parse(await fs.readFileSync(systemDataPath, 'utf-8')) as ISystem

    return new Response(JSON.stringify({ status: 201, message: 'success', data }))
  } catch (err) {
    console.log('error', err)
    return new Response(JSON.stringify({ status: 400, message: 'error', data: defaultData }))
  }
}
