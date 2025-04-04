'use client'

import axios from 'axios'
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
  _list: IGameMeta[]
  setList: Dispatch<SetStateAction<IGameMeta[]>>
  tags: ISystem['tags']
  system: ISystem['system']
  updateGameList: () => Promise<void>
  updateSystemData: () => Promise<void>
}

const MainProvider = createContext<ContextValue>({
  gameList: [],
  _list: [],
  setList: () => {},
  tags: {},
  system: {},
  updateGameList: async () => {},
  updateSystemData: async () => {},
})

export const MainContext = ({ children }: { children: ReactNode }) => {
  const [tags, setTags] = useState<ISystem['tags'] | undefined>()
  const [system, setSystem] = useState<ISystem['system'] | undefined>()
  const [gameList, setGameList] = useState<IGameMeta[] | undefined>()

  const fetchSystemData = async () => {
    const res = await axios.get('/api/system')
    if (res.data.statue === 401) return

    setTags(res.data.data.tags)
    setSystem(res.data.data.system)
  }

  const fetchGameList = async () => {
    const res = await axios.get('/api/meta')
    if (res.data.statue === 401) return

    setGameList(res.data.data)
  }

  const [_list, setList] = useState<IGameMeta[]>([])

  useEffect(() => {
    fetchSystemData()
    fetchGameList()
  }, [])

  if (!tags || !system || !gameList) return null

  return (
    <MainProvider.Provider
      value={{
        gameList,
        _list,
        setList,
        tags,
        system,
        updateGameList: fetchGameList,
        updateSystemData: fetchSystemData,
      }}
    >
      {children}
    </MainProvider.Provider>
  )
}

export const useMainData = () => {
  return useContext(MainProvider)
}
