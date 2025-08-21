import { useCallback, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useHash } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getLabels } from '@/utils/doujinshiUtils'

export const useGoTo = () => {
  const router = useRouter()
  const pathname = usePathname()

  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const pagination = useDoujinshiStore(s => s.pagination)
  const isVertical = useDoujinshiStore(s => s.pageSetting.isVertical)
  const [hash, setHash] = useHash()

  const goTo = useCallback(
    (label: string) => {
      if (!curDoujinshi || label === '') return

      setCurPageLabel(label)

      if (!pathname.includes('/view') || !isVertical) {
        console.log('replace', pathname)
        const url = `/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}/view#${label}`
        router.replace(url)
      }
    },
    [curDoujinshi, isVertical, pathname, router, setCurPageLabel]
  )

  useEffect(() => {
    if (hash === '') return
    let label: string = ''
    if (hash.startsWith('#')) label = hash.slice(1)

    goTo(label)
  }, [goTo, hash])

  const goToPage = useCallback(
    (v: number) => {
      if (!curDoujinshi || !pagination) return

      const targets =
        v > 0
          ? pagination.nextPageLabels[0]
          : v < 0
            ? pagination.prevPageLabels[0]
            : pagination.curPageLabels[0]

      if (!targets) {
        return notifications.show({
          position: 'top-center',
          message: v < 0 ? '已經是最前了' : '已經是最底了',
          autoClose: 2000,
        })
      }
      const label = getLabels({
        doujin: curDoujinshi,
        pageCount,
        curLabel: targets,
      }).labels

      goTo(label)
    },
    [curDoujinshi, goTo, pageCount, pagination]
  )

  const goToGallery = () => {
    if (!curDoujinshi) return
    router.replace(`/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}`)
  }

  return { goToGallery, goTo, goToPage, hash, setHash }
}
