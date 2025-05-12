'use client'

import { useHash } from '@mantine/hooks'
import axios from 'axios'
import { usePathname } from 'next/navigation'
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'

type ContextValue = {
  gameList: IGameMeta[]
  tempGameList: IGameMeta[]
  setTempGameList: Dispatch<SetStateAction<IGameMeta[]>>
  gameTags: ISystem['game_tags']
  gameParent: ISystem['game_parent']
  updateGameList: () => Promise<void>
  updateSystemData: () => Promise<void>
  hash: string
  setHash: (v: string) => void
}

const GameProvider = createContext<ContextValue>({
  gameList: [],
  tempGameList: [],
  setTempGameList: () => {},
  gameTags: {},
  gameParent: {},
  updateGameList: async () => {},
  updateSystemData: async () => {},
  hash: '',
  setHash: () => {},
})

export const GameContext = ({ children }: { children: ReactNode }) => {
  const [hash, setHash] = useHash()

  const pathname = usePathname()
  const [gameTags, setGameTags] = useState<ISystem['game_tags'] | undefined>()
  const [gameParent, setGameParent] = useState<
    ISystem['game_parent'] | undefined
  >()
  const [gameList, setGameList] = useState<IGameMeta[] | undefined>()
  const [tempGameList, setTempGameList] = useState<IGameMeta[]>([])

  const fetchSystemData = async () => {
    const res = await axios.get('/api/system/game')
    if (res.data.statue === 401) return
    const system = res.data.data as ISystem

    setGameTags(system.game_tags)
    setGameParent(system.game_parent)
  }

  const fetchGameList = async () => {
    const res = await axios.get('/api/game')
    if (res.data.statue === 401) return
    setGameList(res.data.data)
  }

  useEffect(() => {
    fetchSystemData()
    fetchGameList()
  }, [pathname])

  if (!gameTags || !gameParent || !gameList) return null

  return (
    <GameProvider.Provider
      value={{
        gameList,
        tempGameList,
        setTempGameList,
        gameTags,
        gameParent,
        updateGameList: fetchGameList,
        updateSystemData: fetchSystemData,
        hash,
        setHash,
      }}
    >
      {children}
    </GameProvider.Provider>
  )
}

export const useGameData = () => {
  return useContext(GameProvider)
}
