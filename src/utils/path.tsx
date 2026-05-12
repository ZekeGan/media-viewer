import { IDoujinshiMeta, IGameMeta } from 'shared/type'

export const getImagePath = (doujin: IDoujinshiMeta, label: string) => {
  return `media://image?path=${encodeURIComponent(`${doujin.meta.root}/${label}`)}`
}

export const getMetaImagePath = (meta: IDoujinshiMeta | IGameMeta) => {
  return `media://image/?path=${encodeURIComponent(meta.meta.root)}/_meta/${meta.meta.coverName}`
}
