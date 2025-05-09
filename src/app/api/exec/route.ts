import { exec } from 'child_process'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { folderPath } = body

    exec(`explorer ${folderPath}`)

    return NextResponse.json({ status: 200, message: 'success' })
  } catch {
    return NextResponse.json({ status: 400, message: 'error' })
  }
}
