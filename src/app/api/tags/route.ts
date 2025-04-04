import fs from 'fs/promises'
import path from 'path'
import { CompanyName, ProjectName } from '@/constants/env'

export async function POST(req: Request) {
  try {
    const data = await req.json()

    const appDataPath = process.env.APPDATA
    if (!appDataPath) throw new Error()

    const envDataPath = path.join(appDataPath, CompanyName, ProjectName)

    console.log(data)

    await fs.writeFile(path.join(envDataPath, 'system.json'), JSON.stringify(data))

    return new Response(JSON.stringify({ status: 201, message: 'success' }))
  } catch {
    return new Response(JSON.stringify({ status: 400, message: 'error' }))
  }
}
