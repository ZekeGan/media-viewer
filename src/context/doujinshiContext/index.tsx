'use client'

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useHash } from '@mantine/hooks'
import { ComboboxItem } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useImagessList } from './useImageList'
import { useDoujinshiData } from './useDoujinshiData'

type Pagination = {
  allPages: string[]
  totalPage: number
  allPageList: ComboboxItem[]
  curPageIdxs: number[]
  curPageLabels: string[]
  prevPageIdxs: number[]
  prevPageLabels: string[]
  nextPageIdxs: number[]
  nextPageLabels: string[]
}

type IImageAttrs = {
  isVertical: boolean
  isSinglePage: boolean
  isFullWidth: boolean
  isFullHeight: boolean
  zoomRatio: number
}

type ContextValue = {
  doujinshiList: IDoujinshiMeta[] | undefined
  curPageLabel: string
  curDoujinshi: IDoujinshiMeta | undefined
  imageList: { label: string; imageUrl: string }[] | undefined
  pagination: Pagination | undefined
  pageCount: number
  setPageCount: (v: number) => void
  goToSpecificPage: (label: string) => void
  goToGallery: () => void
  goToPage: (v: number) => void
  imageAttrs: IImageAttrs
  setImageAttrs: Dispatch<SetStateAction<IImageAttrs>>
}

const DoujinshiProvider = createContext<ContextValue>({
  doujinshiList: undefined,
  curPageLabel: '',
  curDoujinshi: undefined,
  imageList: undefined,
  pagination: undefined,
  pageCount: 1,
  setPageCount: () => {},
  goToSpecificPage: () => {},
  goToGallery: () => {},
  goToPage: () => {},
  imageAttrs: {
    isSinglePage: true,
    isFullWidth: false,
    zoomRatio: 1,
    isFullHeight: true,
    isVertical: false,
  },
  setImageAttrs: () => {},
})

export const DoujinshiContext = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { doujinshiList, curDoujinshi } = useDoujinshiData()
  const { imageList } = useImagessList(curDoujinshi)
  const [_curPageLabel, setCurPageLabel] = useHash()
  const curPageLabel = _curPageLabel.slice(1)
  const [pageCount, setPageCount] = useState(2)

  const [imageAttrs, setImageAttrs] = useState<IImageAttrs>({
    isSinglePage: true,
    isFullWidth: false,
    zoomRatio: 1,
    isFullHeight: true,
    isVertical: false,
  })

  const getLabels = useCallback(
    (label: string) => {
      let data = {
        labels: '',
        pages: '',
      }
      if (!curDoujinshi) return data

      const idx = curDoujinshi.data.pages.findIndex(d => d === label)

      if (pageCount === 1) {
        data.labels = curDoujinshi.data.pages[idx]
        data.pages = `${idx + 1}`
      } else if (pageCount > 1) {
        if (idx === 0) {
          data.labels = curDoujinshi.data.pages[0]
          data.pages = '1'
        } else if (idx % 2 === 0) {
          data.labels = `${curDoujinshi.data.pages[idx - 1] ?? ''}-${curDoujinshi.data.pages[idx]}`
          data.pages = `${idx}-${idx + 1}`
        } else if (idx % 2 === 1) {
          data.labels = `${curDoujinshi.data.pages[idx]}-${curDoujinshi.data.pages[idx + 1] ?? ''}`
          data.pages = `${idx + 1}-${idx + 2}`
        }
      }
      return data
    },
    [curDoujinshi, pageCount]
  )

  // 監聽hash事件
  useEffect(() => {
    setCurPageLabel(window.location.hash)
  }, [setCurPageLabel])

  // 根據當前hash來組合各種pagination數據
  const pagination = useMemo(() => {
    if (!curDoujinshi || !curPageLabel) return undefined
    const getPageLabel = (idxs: number[]) => {
      return idxs.map(d => curDoujinshi.data.pages[d])
    }

    const curPageLabels = curPageLabel.split('-').filter(d => d !== '')

    let allPageList = curDoujinshi.data.pages
      .map((d, idx) => {
        if (pageCount === 1) {
          return { label: idx + 1, value: `${d}` }
        }

        if (idx === 0) {
          return { value: d, label: '1' }
        } else if (idx % 2 === 0) {
          const data = getLabels(d)
          return { label: data.pages, value: data.labels }
        } else if (idx === curDoujinshi.data.pages.length - 1) {
          return { label: curDoujinshi.data.pages.length.toString(), value: `${d}` }
        }
      })
      .filter(d => d) as ComboboxItem[]

    const curPageIdxs = Array.from({ length: curPageLabels.length })
      .map((_, idx) => curDoujinshi.data.pages.findIndex(d => d === curPageLabels[idx]))
      .filter(d => d >= 0)
      .reverse()
    const prevPageIdxs = Array.from({ length: curPageLabels.length })
      .map((_, i) => Math.min(...curPageIdxs) - 1 - i)
      .filter(d => d >= 0)
    const nextPageIdxs = Array.from({ length: curPageLabels.length })
      .map((_, i) => Math.max(...curPageIdxs) + 1 + i)
      .filter(d => d <= curDoujinshi.data.pages.length - 1)
      .reverse()

    return {
      allPages: curDoujinshi.data.pages,
      allPageList,
      totalPage: curDoujinshi.data.pages.length,

      curPageIdxs,
      curPageLabels,

      prevPageIdxs,
      prevPageLabels: getPageLabel(prevPageIdxs),

      nextPageIdxs,
      nextPageLabels: getPageLabel(nextPageIdxs),
    }
  }, [curDoujinshi, curPageLabel, getLabels, pageCount])

  // 根據給予的label來組合成hash，前往指定頁面
  const goToSpecificPage = (label: string) => {
    if (!curDoujinshi) return

    const labels = getLabels(label).labels

    setCurPageLabel(labels)
    router.replace(`/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}/view#${labels}`)
  }

  const goToGallery = () => {
    if (!curDoujinshi) return
    router.replace(`/doujinshi/${curDoujinshi.data.title}`)
  }

  // 往前往後或是停在當前頁面
  const goToPage = (v: number) => {
    if (!curDoujinshi || !pagination) return

    let label
    if (v > 0) label = pagination.nextPageLabels[0]
    else if (v < 0) label = pagination.prevPageLabels[0]
    else if (v === 0) label = pagination.curPageLabels[0]
    else label = undefined

    if (!!label) goToSpecificPage(label)
    else {
      if (v < 0) {
        notifications.show({
          position: 'top-center',
          message: '已經是第一頁了',
          autoClose: 2000,
        })
      } else if (v > 0) {
        notifications.show({
          position: 'top-center',
          message: '已經是最後一頁了',
          autoClose: 2000,
        })
      }
    }
  }

  useEffect(() => {
    goToPage(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount])

  return (
    <DoujinshiProvider.Provider
      value={{
        doujinshiList,
        curPageLabel,
        curDoujinshi,
        imageList,
        pagination,
        pageCount,
        setPageCount,
        goToSpecificPage,
        goToGallery,
        goToPage,
        imageAttrs,
        setImageAttrs,
      }}
    >
      {children}
    </DoujinshiProvider.Provider>
  )
}

export const useDoujinshi = () => {
  return useContext(DoujinshiProvider)
}
