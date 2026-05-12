import { IDoujinshiMeta } from 'shared/type'

export {}

declare global {
  interface Window {
    electronApi: {
      getGameList: () => Promise<IGameMeta[]>
      getDoujinshiList: () => Promise<IDoujinshiMeta[]>
      openFolder: (folderPath: string) => Promise<void>
    }
  }
}
