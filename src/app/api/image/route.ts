import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { cacheTime } from '@/constants/server'

export async function GET(req: NextRequest) {
  try {
    const imageRawPath = req.nextUrl.searchParams.get('path')
    const imagePath = decodeURIComponent(imageRawPath || '')

    const buffer = fs.readFileSync(imagePath)

    const ext = path.extname(imagePath).toLowerCase()

    const mimeType =
      {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      }[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': `max-age=${cacheTime}`,
      },
    })
  } catch (err) {
    console.log('error', err)
    return NextResponse.json({ status: 400, message: 'error', data: [] })
  }
}
