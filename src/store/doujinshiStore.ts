import { ComboboxItem } from '@mantine/core'
import { readLocalStorageValue } from '@mantine/hooks'
import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { doujinshiTypes } from '@/constants'
import { getLabels } from '@/utils/doujinshiUtils'

interface IPageSetting {
  pageCount: 1 | 2
  isFullWidth: boolean
  isFullHeight: boolean
  zoomRatio: number
  isVertical: boolean
}

interface Pagination {
  allPages: IImageData[]
  allPageList: ComboboxItem[]
  totalPage: number
  curPageLabels: string[]
  curPageIdxs: number[]
  prevPageIdxs: number[]
  prevPageLabels: string[]
  nextPageIdxs: number[]
  nextPageLabels: string[]
}

interface IDoujinshiStore {
  searchTypes: IDoujinshiData['types'][]
  setSearchTypes: (val: IDoujinshiData['types'][]) => void

  pageSetting: IPageSetting
  setPageSetting: (cb: (prev: IPageSetting) => IPageSetting) => void

  doujinshiList: IDoujinshiMeta[] | undefined
  fetchDoujinshiList: () => void

  curDoujinshi: IDoujinshiMeta | undefined
  setCurDoujinshi: (title: string) => void

  curPageLabel: string
  setCurPageLabel: (val: string) => void

  pagination: Pagination | undefined
  setPagination: (doujin: IDoujinshiMeta, label: string, count: number) => void

  detailCountPerRows: number
  setDetailCountPerRows: (count: number) => void

  toolBarOpacity: number
  setToolBarOpacity: (val: number) => void
}

export const useDoujinshiStore = create<IDoujinshiStore>()(
  persist(
    (set, get) => ({
      searchTypes: doujinshiTypes,
      setSearchTypes: val => set({ searchTypes: val }),

      pageSetting: {
        pageCount: 1,
        isFullWidth: false,
        isFullHeight: true,
        zoomRatio: 1,
        isVertical: false,
      },
      setPageSetting: cb => {
        const newState = cb(get().pageSetting)
        set({ pageSetting: newState })
      },

      doujinshiList: undefined,
      fetchDoujinshiList: async () => {
        if (get().doujinshiList) return
        const res = await axios.get('/api/doujinshi')
        set({ doujinshiList: res.data.data })
      },

      curDoujinshi: undefined,
      setCurDoujinshi: title => {
        const doujinList = get().doujinshiList
        if (!doujinList) return
        const doujinTitle = decodeURIComponent(title)
        // console.log(doujinTitle)

        set({
          curDoujinshi: doujinList.find(d => d.data.title === doujinTitle),
        })
      },

      curPageLabel: '',
      setCurPageLabel: val => set({ curPageLabel: val }),

      pagination: undefined,
      setPagination: (curDoujinshi, curPageLabel, pageCount) => {
        const pages = curDoujinshi.meta.pages
        const totalPage = pages.length
        const curLabels = curPageLabel.split('-').filter(Boolean)

        const curIdxs = curLabels
          .map(l => pages.findIndex(d => d.title === l))
          .filter(i => i >= 0)
        const len = curIdxs.length
        const min = Math.min(...curIdxs)
        const max = Math.max(...curIdxs)
        // console.log(pageCount, 'inthepagination')

        const makeRange = (from: number) => {
          return Array.from({ length: len }, (_, i) => from + i).filter(
            i => i >= 0 && i < totalPage
          )
        }
        console.log(curIdxs, pages, 'idxs')

        const allPageList = pages.flatMap((d, i) => {
          if (pageCount === 1 || i === 0 || i === totalPage - 1) {
            return { label: `${i + 1}`, value: d.title }
          }
          return i % 2 === 0
            ? (() => {
                const data = getLabels({
                  doujin: curDoujinshi,
                  pageCount: pageCount,
                  curLabel: d.title,
                })
                return { label: data.pages, value: data.labels }
              })()
            : []
        }) as ComboboxItem[]

        set({
          pagination: {
            allPages: pages,
            allPageList,
            totalPage,
            curPageLabels: curLabels,
            curPageIdxs: curIdxs,
            prevPageIdxs: makeRange(min - len),
            prevPageLabels: makeRange(min - len).map(i => pages[i].title),
            nextPageIdxs: makeRange(max + 1),
            nextPageLabels: makeRange(max + 1).map(i => pages[i].title),
          },
        })
      },

      detailCountPerRows: 5,
      setDetailCountPerRows: count => set({ detailCountPerRows: count }),

      toolBarOpacity: 1,
      setToolBarOpacity: val => set({ toolBarOpacity: val }),
    }),
    {
      name: 'doujinshi-store',
      partialize: s => ({
        searchTypes: s.searchTypes,
        pageSetting: s.pageSetting,
        detailCountPerRows: s.detailCountPerRows,
        toolBarOpacity: s.toolBarOpacity,
      }),
    }
  )
)
