import { exec } from 'child_process'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { folderPath } = body

    exec(`explorer ${folderPath}`)

    return new Response(JSON.stringify({ status: 200, message: 'success' }))
  } catch {
    return new Response(JSON.stringify({ status: 400, message: 'error' }))
  }
}
