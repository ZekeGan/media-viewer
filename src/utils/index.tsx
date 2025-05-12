export const getImagePath = (doujin: IDoujinshiMeta, label: string) => {
  return `/api/image?path=${encodeURIComponent(`${doujin.meta.root}/${label}`)}`
}
