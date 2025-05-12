import { Img } from '@/components/Img'
import { ObserverImg } from '@/components/ObserverImg'
import { useDoujinshi } from '@/context/doujinshiContext'
import { useMainData } from '@/context/mainContext'
import useFetchChuckImages from '@/hooks/useFetchChuckImages'
import { useFetchInfiniteImages } from '@/hooks/useFetchInfiniteImages'
import { getImagePath } from '@/utils'
import { getLabels } from '@/utils/doujinshiUtils'
import { Box, Center, Stack } from '@mantine/core'
import { useEffect, useRef } from 'react'

export default function VerticalReadingContainer() {
  const itemsRef = useRef<Record<string, HTMLDivElement>>({})
  const { doujinshiPageSetting } = useMainData()
  const { curDoujinshi, setCurPageLabel, curPageLabel, pagination } =
    useDoujinshi()
  const { imagesList } = useFetchChuckImages(
    curDoujinshi,
    curPageLabel.split('-')[0],
    10
  )

  // 更新 hash
  useEffect(() => {
    if (!curDoujinshi) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const title = entry.target.getAttribute('id') ?? ''

          setCurPageLabel(
            getLabels({
              doujin: curDoujinshi,
              pageCount: doujinshiPageSetting.pageCount,
              curLabel: title,
            }).labels
          )
        }
      },
      { threshold: 0.1 }
    )

    const timeout = setTimeout(() => {
      const refs = Object.values(itemsRef.current)
      for (const el of refs) {
        if (el instanceof Element) {
          observer.observe(el)
        }
      }
    }, 100)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [curDoujinshi, doujinshiPageSetting.pageCount, setCurPageLabel])

  // scroll to curLabel view
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     const label = curPageLabel.split('-')[0]
  //     if (itemsRef.current) {
  //       itemsRef.current[label].scrollIntoView({
  //         behavior: 'instant',
  //         block: 'center',
  //       })
  //     }
  //   }, 50)
  //   return () => clearTimeout(timeout)
  // }, [curPageLabel])

  if (!imagesList || !curDoujinshi) return
  console.log('vertical', imagesList)

  return (
    <Center>
      <Stack
        gap={0}
        {...(doujinshiPageSetting.isFullWidth && { w: '100vw' })}
        {...(!doujinshiPageSetting.isFullWidth && {
          w: `${doujinshiPageSetting.zoomRatio * 100}rem`,
        })}
      >
        {imagesList.map(d => (
          <Box
            key={d.title}
            id={d.title}
            flex={1}
            ref={el => {
              if (el) itemsRef.current[d.title] = el
            }}
          >
            <Img
              // w={d.width}
              // h={d.height}
              fit="contain"
              src={d.imageUrl}
            />
          </Box>
        ))}
      </Stack>
    </Center>
  )
}
