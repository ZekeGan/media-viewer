export const imageTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  avif: 'image/avif',
  ico: 'image/x-icon',
}
export function identifyImage(bytes: Uint8Array): { ext: string; mime: string } | undefined {
  const text = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
  const ext =
    text(0, 8) === '\x89PNG\r\n\x1a\n'
      ? 'png'
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? 'jpg'
        : /^GIF8[79]a$/.test(text(0, 6))
          ? 'gif'
          : text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP'
            ? 'webp'
            : text(0, 2) === 'BM'
              ? 'bmp'
              : bytes.length >= 6 && text(0, 4) === '\0\0\x01\0'
                ? 'ico'
                : text(4, 8) === 'ftyp' && /avif|avis/.test(text(8, 40))
                  ? 'avif'
                  : undefined
  return ext ? { ext, mime: imageTypes[ext] } : undefined
}
