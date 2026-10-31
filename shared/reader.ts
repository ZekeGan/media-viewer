export interface ImageSize {
  width: number
  height: number
}
export function readingGroups(count: number, spread: boolean, firstSingle: boolean): number[][] {
  const groups: number[][] = []
  for (let i = 0; i < count;) {
    const pair = spread && !(firstSingle && i === 0)
    groups.push(pair && i + 1 < count ? [i, i + 1] : [i])
    i += pair ? 2 : 1
  }
  return groups
}
export function spreadGeometry(
  sizes: ImageSize[],
  fit: 'width' | 'height' | 'original' | 'contain',
  box: ImageSize,
  zoom: number
) {
  const naturalHeight = Math.max(1, ...sizes.map((s) => s.height)),
    ratio = sizes.reduce((sum, s) => sum + s.width / Math.max(1, s.height), 0) || 1
  const height =
    (fit === 'contain'
      ? Math.min(box.height, box.width / ratio)
      : fit === 'height'
        ? box.height
        : fit === 'width'
          ? box.width / ratio
          : naturalHeight) * zoom
  return {
    width: height * ratio,
    height,
    widths: sizes.map((s) => (height * s.width) / Math.max(1, s.height)),
  }
}
export const readerArrowStep = (key: string, rtl: boolean) =>
  key === 'ArrowLeft' ? (rtl ? 1 : -1) : key === 'ArrowRight' ? (rtl ? -1 : 1) : 0
