declare interface IImageData {
  title: string
  width: number
  height: number
}

declare interface IDoujinshiData {
  id: string
  fullTitle: string
  title: string
  groups: string[]
  artists: string[]
  series: string[]
  types: 'doujinshi' | 'manga' | 'artistcg' | 'gamecg' | 'imageset' | 'misc'
  language: string[]
  male: string[]
  female: string[]
  misc: string[]
  characters: string[]
}

declare interface IDoujinshiMeta {
  data: IDoujinshiData
  meta: {
    root: string
    coverName: string
    pages: IImageData[]
  }
}

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
  meta: {
    root: string
    coverName: string
  }
}

declare type CheckList = {
  key: string
  label: string
  count: number
  checked: boolean
}[]

declare type ISystem = {
  game_tags: {
    [k in string]: {
      _key: string
      tw: string
      parent: string
    }
  }
  game_parent: {
    [k in string]: {
      tw: string
    }
  }
}
