import { WindowView } from 'shared/main'
import { IDoujinshiMeta, ISystem } from 'shared/type'

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare global {
  interface Window {
    electronApi: {
      getGameList: () => Promise<IGameMeta[]>
      getDoujinshiList: () => Promise<IDoujinshiMeta[]>
      openFolder: (folderPath: string) => Promise<void>
      saveTags: (tags: any) => Promise<void>
      getSystemData: () => Promise<ISystem>

      getWindowViewList: () => Promise<WindowView[]>
    }
  }
}

export {}
