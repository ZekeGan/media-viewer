import { IDoujinshiMeta, ISystem } from 'shared/type'

export {}

declare global {
  interface Window {
    electronApi: {
      getGameList: () => Promise<IGameMeta[]>
      getDoujinshiList: () => Promise<IDoujinshiMeta[]>
      openFolder: (folderPath: string) => Promise<void>
      saveTags: (tags: any) => Promise<void>
      getSystemData: () => Promise<ISystem>
    }
  }
}
