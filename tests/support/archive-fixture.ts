import { deflateRawSync } from 'node:zlib'
import { crc32 } from '../../electron/archive'
export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=',
  'base64'
)
export function zipFixture(
  entries: {
    name: string
    bytes: Buffer
    method?: number
    flags?: number
    size?: number
    crc?: number
  }[]
) {
  const files: Buffer[] = [],
    central: Buffer[] = []
  let offset = 0
  for (const entry of entries) {
    const name = Buffer.from(entry.name),
      method = entry.method ?? 8,
      bytes = method === 0 ? entry.bytes : deflateRawSync(entry.bytes),
      flags = entry.flags ?? 2048,
      crc = entry.crc ?? crc32(entry.bytes),
      size = entry.size ?? entry.bytes.length
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(flags, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(bytes.length, 18)
    local.writeUInt32LE(size, 22)
    local.writeUInt16LE(name.length, 26)
    const header = Buffer.alloc(46)
    header.writeUInt32LE(0x02014b50)
    header.writeUInt16LE(20, 6)
    header.writeUInt16LE(flags, 8)
    header.writeUInt16LE(method, 10)
    header.writeUInt32LE(crc, 16)
    header.writeUInt32LE(bytes.length, 20)
    header.writeUInt32LE(size, 24)
    header.writeUInt16LE(name.length, 28)
    header.writeUInt32LE(offset, 42)
    files.push(local, name, bytes)
    central.push(header, name)
    offset += local.length + name.length + bytes.length
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...files, directory, end])
}
