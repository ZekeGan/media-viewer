import { DoujinshiManager } from '@/utils/doujinshiManager'

export async function POST(req: Request) {
  try {
    const { name } = await req.json()

    const doujinshi = new DoujinshiManager(name)
    const allImages = await doujinshi.getAllImages()
    console.log(allImages)

    return new Response(JSON.stringify({ status: 201, message: 'success', data: allImages }))
  } catch (err) {
    console.log('error', err)
    return new Response(JSON.stringify({ status: 400, message: 'error', data: [] }))
  }
}
