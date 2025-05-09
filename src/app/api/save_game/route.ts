import fs from 'fs/promises'
import path from 'path'
import { downloadFile } from '@/utils/download'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { data, cover } = await req.json()
    const metaPath = path.join(data.folder_path, '_meta')

    await fs.writeFile(path.join(metaPath, 'data.json'), JSON.stringify(data))

    if (cover) await downloadFile(cover, metaPath)

    return NextResponse.json({ status: 201, message: 'success' })
  } catch {
    return NextResponse.json({ status: 400, message: 'error' })
  }
}
