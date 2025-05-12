'use client'

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react'
import { useDoujinshiData } from './useDoujinshiData'
import { Pagination, usePageView } from './usePageView'

type ContextValue = {
  doujinshiList: IDoujinshiMeta[] | undefined
  curPageLabel: string
  curDoujinshi: IDoujinshiMeta | undefined
  pagination: Pagination | undefined

  goToSpecificPage: (label: string) => void
  goToGallery: () => void
  goToPage: (v: number) => void
  openSideBar: boolean
  setOpenSideBar: Dispatch<SetStateAction<boolean>>
  setCurPageLabel: (value: string) => void
}

const DoujinshiProvider = createContext<ContextValue>({
  doujinshiList: undefined,
  curPageLabel: '',
  curDoujinshi: undefined,
  pagination: undefined,

  goToSpecificPage: () => {},
  goToGallery: () => {},
  goToPage: () => {},
  openSideBar: false,
  setOpenSideBar: () => {},
  setCurPageLabel: () => {},
})

export const DoujinshiContext = ({ children }: { children: ReactNode }) => {
  const { doujinshiList, curDoujinshi } = useDoujinshiData()
  const {
    pagination,
    curPageLabel,
    goToSpecificPage,
    goToPage,
    goToGallery,
    setCurPageLabel,
  } = usePageView(curDoujinshi)

  const [openSideBar, setOpenSideBar] = useState(false)

  return (
    <DoujinshiProvider.Provider
      value={{
        doujinshiList,
        curPageLabel,
        curDoujinshi,
        pagination,
        goToSpecificPage,
        goToGallery,
        goToPage,
        openSideBar,
        setOpenSideBar,
        setCurPageLabel,
      }}
    >
      {children}
    </DoujinshiProvider.Provider>
  )
}

export const useDoujinshi = () => {
  return useContext(DoujinshiProvider)
}
