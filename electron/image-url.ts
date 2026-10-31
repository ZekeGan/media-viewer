import dns from 'node:dns/promises'
import net from 'node:net'
import { limitedBytes } from './metadata-common'
import { identifyImage } from '../shared/images'

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_REDIRECTS = 3

const privateV4 = (ip: string) => {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
  )
}
export const privateAddress = (ip: string): boolean => {
  const version = net.isIP(ip)
  if (version === 4) return privateV4(ip)
  if (version !== 6) return true
  const value = ip.toLowerCase()
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return privateV4(mapped[1])
  return value === '::' || value === '::1' || /^f[cd]/.test(value) || /^fe[89ab]/.test(value)
}

export interface RemoteImage { bytes: Buffer; ext: string; mime: string; name: string }
export interface ImageUrlOptions {
  fetcher?: typeof fetch
  allowPrivate?: boolean
  lookup?: (host: string) => Promise<string[]>
}

const resolveHost = async (host: string) =>
  (await dns.lookup(host, { all: true })).map((entry) => entry.address)

// Downloads a user-specified image URL under main-process control: HTTP(S) only, no credentials,
// no private or loopback targets, limited redirects, timeout and size, and content-based type checks.
export async function fetchImageUrl(raw: string, options: ImageUrlOptions = {}): Promise<RemoteImage> {
  const fetcher = options.fetcher ?? fetch,
    lookup = options.lookup ?? resolveHost
  if (typeof raw !== 'string' || raw.length > 2048) throw new Error('圖片網址不合法')
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new Error('圖片網址不合法')
  }
  for (let hop = 0; ; hop++) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname)
      throw new Error('只接受不含帳號密碼的 HTTP(S) 圖片網址')
    if (!options.allowPrivate) {
      const host = url.hostname.replace(/^\[|\]$/g, '')
      if (host.toLowerCase() === 'localhost' || host.toLowerCase().endsWith('.localhost'))
        throw new Error('不允許本機或內網位址')
      const addresses = net.isIP(host) ? [host] : await lookup(host).catch(() => [])
      if (!addresses.length) throw new Error('無法解析圖片網址的主機')
      if (addresses.some(privateAddress)) throw new Error('不允許本機或內網位址')
    }
    const response = await fetcher(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'image/*' },
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location || hop >= MAX_REDIRECTS) throw new Error('圖片網址重新導向過多或無效')
      url = new URL(location, url)
      continue
    }
    const bytes = await limitedBytes(response, MAX_IMAGE_BYTES)
    const identified = identifyImage(bytes)
    if (!identified) throw new Error('網址內容不是支援的圖片（PNG、JPEG、GIF、WebP、BMP、AVIF、ICO）')
    const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
      .replace(/[\\/:*?"<>|\0]/g, '_')
      .slice(0, 80)
    return { bytes, ...identified, name: (last.replace(/\.[a-z0-9]{2,5}$/i, '') || 'image') + '.' + identified.ext }
  }
}
