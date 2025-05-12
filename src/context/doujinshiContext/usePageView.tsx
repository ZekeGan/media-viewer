import { getLabels } from '@/utils/doujinshiUtils'
import { ComboboxItem } from '@mantine/core'
import { useHash } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { useMainData } from '../mainContext'

export type Pagination = {
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

export const usePageView = (curDoujinshi?: IDoujinshiMeta) => {
  const { doujinshiPageSetting } = useMainData()
  const router = useRouter()
  const [_curPageLabel, setCurPageLabel] = useHash()
  const curPageLabel = _curPageLabel.slice(1)

  const pagination = useMemo(() => {
    if (!curDoujinshi) return

    const pageCount = doujinshiPageSetting.pageCount
    const pages = curDoujinshi.meta.pages
    const totalPage = pages.length
    const curLabels = curPageLabel.split('-').filter(Boolean)
    const toIdx = (l: string) => pages.findIndex(d => d.title === l)

    const curIdxs = curLabels.map(toIdx).filter(i => i >= 0)
    const len = curIdxs.length
    const min = Math.min(...curIdxs)
    const max = Math.max(...curIdxs)

    const makeRange = (from: number) => {
      return Array.from({ length: len }, (_, i) => from + i).filter(
        i => i >= 0 && i < totalPage
      )
    }

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

    return {
      allPages: pages,
      allPageList,
      totalPage,
      curPageLabels: curLabels,
      curPageIdxs: curIdxs,
      prevPageIdxs: makeRange(min - len),
      prevPageLabels: makeRange(min - len).map(i => pages[i].title),
      nextPageIdxs: makeRange(max + 1),
      nextPageLabels: makeRange(max + 1).map(i => pages[i].title),
    } satisfies Pagination
  }, [curDoujinshi, curPageLabel, doujinshiPageSetting.pageCount])

  const goToSpecificPage = useCallback(
    (label: string) => {
      if (!curDoujinshi) return

      setCurPageLabel(label)
      router.replace(
        `/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}/view#${encodeURIComponent(label)}`
      )
    },
    [curDoujinshi, router, setCurPageLabel]
  )

  const goToPage = useCallback(
    (v: number) => {
      if (!curDoujinshi || !pagination) return

      const targets =
        v > 0
          ? pagination.nextPageLabels[0]
          : v < 0
            ? pagination.prevPageLabels[0]
            : pagination.curPageLabels[0]

      if (targets) {
        const label = getLabels({
          doujin: curDoujinshi,
          pageCount: doujinshiPageSetting.pageCount,
          curLabel: targets,
        }).labels
        return goToSpecificPage(label)
      }

      notifications.show({
        position: 'top-center',
        message: v < 0 ? '已經是最前了' : '已經是最底了',
        autoClose: 2000,
      })
    },
    [curDoujinshi, doujinshiPageSetting.pageCount, goToSpecificPage, pagination]
  )

  const goToGallery = () => {
    if (!curDoujinshi) return
    router.push(`/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}`)
  }

  return {
    pagination,
    goToSpecificPage,
    goToPage,
    curPageLabel,
    goToGallery,
    setCurPageLabel,
  }
}
