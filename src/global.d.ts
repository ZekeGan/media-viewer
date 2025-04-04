declare interface IGameData {
  id: string
  game_name: string
  game_url: string
  tags: string[]
  author: string
  author_from: string
  isDynamic: 'dynamic' | 'static'
  isCensored: 'censored' | 'uncensored'
  folder_path: string
}

declare interface IGameMeta {
  data: IGameData
  cover: any | null
}

declare type CheckList = {
  key: string
  label: string
  count: number
  checked: boolean
}[]

declare type ISystem = {
  tags: {
    [k in string]: {
      _key: string
      tw: string
      parent: string
    }
  }
  system: {
    [k in string]: {
      tw: string
    }
  }
}
