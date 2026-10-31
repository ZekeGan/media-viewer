import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

// Cache only generated, immutable bytes. Callers copy them into their own media trees.
const args = [
  '-v',
  'error',
  '-f',
  'lavfi',
  '-i',
  'testsrc=size=480x270:rate=12',
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=300:sample_rate=44100',
  '-t',
  '30',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-c:a',
  'aac',
]
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

export async function videoFixture(): Promise<string> {
  const base = path.resolve('.test-output/fixtures')

  const key = createHash('sha256').update(JSON.stringify(args)).digest('hex').slice(0, 16)

  const cached = path.join(base, 'video-' + key)

  const read = async () => {
    const file = path.join(cached, 'video.mp4')

    const [bytes, hash] = await Promise.all([
      fs.readFile(file),
      fs.readFile(path.join(cached, 'sha256'), 'utf8'),
    ])

    if (digest(bytes) !== hash) throw new Error('受控影音快取校驗失敗：' + cached)

    return file
  }

  try {
    const file = await read()

    console.log('Fixture cache hit: ' + cached)

    return file
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  await fs.mkdir(base, { recursive: true })

  const staging = await fs.mkdtemp(path.join(base, 'video-staging-'))

  try {
    const file = path.join(staging, 'video.mp4')

    await promisify(execFile)('ffmpeg', [...args, file], { windowsHide: true })

    await fs.writeFile(path.join(staging, 'sha256'), digest(await fs.readFile(file)))

    // Publish the completed directory, so parallel runners cannot see partial files.
    try {
      await fs.rename(staging, cached)
    } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? ''))
        throw error

      await read()
      // Accept a concurrent winner only if its bytes pass validation.
    }

    console.log('Fixture generated/reused: ' + cached)

    return await read()
  } finally {
    // Only remove our two staging files; never recursively clean a shared directory.
    for (const name of ['video.mp4', 'sha256']) {
      await fs.unlink(path.join(staging, name)).catch((error) => {
        if (error.code !== 'ENOENT') throw error
      })
    }

    await fs.rmdir(staging).catch((error) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}
