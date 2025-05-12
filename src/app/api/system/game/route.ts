import { CompanyName, ProjectName } from '@/constants/env'
import { cacheTime } from '@/context/server'
import fs from 'fs'
import { NextResponse } from 'next/server'
import path from 'path'

const defaultData: ISystem = {
  game_tags: {},
  game_parent: {},
}

export async function GET() {
  try {
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
      await fs.writeFileSync(
        systemDataPath,
        JSON.stringify(defaultData, null, 2),
        'utf-8'
      )
    }

    // read system.json
    const data = JSON.parse(
      await fs.readFileSync(systemDataPath, 'utf-8')
    ) as ISystem

    return NextResponse.json(
      { status: 201, message: 'success', data },
      {
        headers: { 'Cache-Control': `max-age=${cacheTime}` },
      }
    )
  } catch (err) {
    return NextResponse.json({
      status: 400,
      message: 'error',
      data: defaultData,
    })
  }
}
