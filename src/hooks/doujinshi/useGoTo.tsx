import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getLabels } from '@/utils/doujinshiUtils'

export const useGoTo = () => {
  const router = useRouter()
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const pagination = useDoujinshiStore(s => s.pagination)

  const goToSpecificPage = useCallback(
    (label: string) => {
      if (!curDoujinshi) return
      router.replace(
        `/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}/view#${encodeURIComponent(label)}`
      )
    },
    [curDoujinshi, router]
  )

  const goToPage = useCallback(
    (v: number) => {
      if (!curDoujinshi || !pagination) return
      console.log(pagination)

      const targets =
        v > 0
          ? pagination.nextPageLabels[0]
          : v < 0
            ? pagination.prevPageLabels[0]
            : pagination.curPageLabels[0]

      if (targets) {
        const label = getLabels({
          doujin: curDoujinshi,
          pageCount,
          curLabel: targets,
        }).labels
        console.log(label, pageCount)
        setCurPageLabel(label)
        return
        // return goToSpecificPage(label)
      }

      notifications.show({
        position: 'top-center',
        message: v < 0 ? '已經是最前了' : '已經是最底了',
        autoClose: 2000,
      })
    },
    [curDoujinshi, pageCount, pagination, setCurPageLabel]
  )

  const goToGallery = () => {
    if (!curDoujinshi) return
    router.push(`/doujinshi/${encodeURIComponent(curDoujinshi.data.title)}`)
  }

  return { goToGallery, goToPage, goToSpecificPage }
}
