'use client'

import { useLocalStorage } from '@mantine/hooks'
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'

export type IDoujinshiSetting = {
  pageCount: number
  isFullWidth: boolean
  isFullHeight: boolean
  zoomRatio: number
  isVertical: boolean
}

export const defaultDoujinshiSetting: IDoujinshiSetting = {
  pageCount: 1,
  isFullWidth: false,
  isFullHeight: true,
  zoomRatio: 1,
  isVertical: false,
}

type ContextValue = {
  doujinshiPageSetting: IDoujinshiSetting
  setDoujinshiPageSetting: Dispatch<SetStateAction<IDoujinshiSetting>>
}

const defaultContext: ContextValue = {
  doujinshiPageSetting: defaultDoujinshiSetting,
  setDoujinshiPageSetting: () => {},
}

const MainProvider = createContext<ContextValue>(defaultContext)

export const MainContext = ({ children }: { children: ReactNode }) => {
  const [locaStorage, setLocalStorage] = useLocalStorage({
    key: 'setting',
    defaultValue: JSON.stringify({ defaultDoujinshiSetting }),
  })

  const [doujinshiPageSetting, setDoujinshiPageSetting] =
    useState<IDoujinshiSetting>(
      JSON.parse(locaStorage).doujinshiPageSetting ?? defaultDoujinshiSetting
    )

  // 更新localStorage
  useEffect(() => {
    setLocalStorage(
      JSON.stringify({
        doujinshiPageSetting: doujinshiPageSetting,
      })
    )
  }, [doujinshiPageSetting, setLocalStorage])

  return (
    <MainProvider.Provider
      value={{ doujinshiPageSetting, setDoujinshiPageSetting }}
    >
      {children}
    </MainProvider.Provider>
  )
}

export const useMainData = () => {
  return useContext(MainProvider)
}
