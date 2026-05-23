import { View } from 'shared/main'
import { IDoujinshiMeta, ISystem } from 'shared/type'

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare global {
  interface Window {
    electronApi: {
      // old
      getGameList: () => Promise<IGameMeta[]>
      getDoujinshiList: () => Promise<IDoujinshiMeta[]>
      openFolder: (folderPath: string) => Promise<void>
      saveTags: (tags: any) => Promise<void>
      getSystemData: () => Promise<ISystem>

      // v2
      getViewList: () => Promise<View[]>
      getView: (viewId: string) => Promise<View>
      saveView: (view: View) => Promise<void>
      createView: (path: string, depth?: number) => Promise<void>

      // dialog
      selectFolder: () => Promise<string | null>
    }
  }
}

export {}
