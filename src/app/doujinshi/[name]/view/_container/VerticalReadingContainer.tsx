import { useEffect, useRef } from 'react'
import { Center, Paper, ScrollArea, Stack } from '@mantine/core'
import scrollIntoView from 'scroll-into-view-if-needed'
import LoadingContainer from '@/components/LoadingContainer'
import { ObserverImg } from '@/components/ObserverImg'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'

export default function VerticalReadingContainer() {
  const isFullWidth = useDoujinshiStore(state => state.pageSetting.isFullWidth)
  const zoomRatio = useDoujinshiStore(state => state.pageSetting.zoomRatio)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<Record<string, HTMLDivElement>>({})
  const temp = useRef('')
  const { setHash } = useGoTo()

  // 更新 hash
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const title = entry.target.getAttribute('id') ?? ''
          console.log(title)

          temp.current = title
        }
      },
      { threshold: 0.2 }
    )

    for (const label in itemsRef.current) {
      const el = itemsRef.current[label]
      if (el) observer.observe(el)
    }

    return () => {
      observer.disconnect()
      if (temp.current) setHash(temp.current)
    }
  }, [setHash])

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setHash(temp.current)
  //   }, 5000)
  //   return () => clearInterval(timer)
  // }, [setHash])

  // scroll to curLabel view
  useEffect(() => {
    const tryScroll = () => {
      const el = itemsRef.current[curPageLabel.split('-')[0]]
      if (!el) {
        requestAnimationFrame(tryScroll)
        return
      }
      //* 記得讓el有寬高，這樣才能滾到相對應的位置
      scrollIntoView(el, {
        behavior: 'auto',
        block: 'start',
        scrollMode: 'if-needed',
      })
    }

    tryScroll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  console.log('scroll')

  if (!curDoujinshi) return <LoadingContainer />

  return (
    <ScrollArea ref={containerRef} w="100vw" h="100vh" type="always">
      <Center>
        <Stack
          gap={0}
          {...(isFullWidth && { w: '100vw' })}
          {...(!isFullWidth && { w: `${zoomRatio * 100}rem` })}
        >
          {curDoujinshi.meta.pages.map(d => (
            <Paper
              ref={el => {
                if (el) itemsRef.current[d.title] = el
              }}
              radius={0}
              key={d.title}
              id={d.title}
              flex={1}
              style={{ aspectRatio: d.width / d.height }}
              // withBorder
            >
              <ObserverImg
                fit="contain"
                src={getImagePath(curDoujinshi, d.title)}
                style={{ aspectRatio: d.width / d.height }}
              />
            </Paper>
          ))}
        </Stack>
      </Center>
    </ScrollArea>
  )
}
