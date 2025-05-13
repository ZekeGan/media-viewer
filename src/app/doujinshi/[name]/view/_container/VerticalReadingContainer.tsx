import LoadingContainer from '@/components/LoadingContainer'
import { ObserverImg } from '@/components/ObserverImg'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'
import { getLabels } from '@/utils/doujinshiUtils'
import { Box, Center, Paper, ScrollArea, Stack } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'

export default function VerticalReadingContainer() {
  const pageCount = useDoujinshiStore(state => state.pageSetting.pageCount)
  const isFullWidth = useDoujinshiStore(state => state.pageSetting.isFullWidth)
  const zoomRatio = useDoujinshiStore(state => state.pageSetting.zoomRatio)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)

  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<Record<string, HTMLDivElement>>({})
  const [hasScrolled, setHasScrolled] = useState(false)
  const tempLabel = useRef<string>(curPageLabel)

  // 更新 hash
  useEffect(() => {
    if (!curDoujinshi || !hasScrolled) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        const title = entry.target.getAttribute('id') ?? ''
        tempLabel.current = title
      },
      { threshold: 0.7 }
    )

    for (const label in itemsRef.current) {
      const el = itemsRef.current[label]
      if (el) observer.observe(el)
    }

    return () => {
      //* 避免每次更新pagelabel影響到其他組件
      setCurPageLabel(
        getLabels({
          doujin: curDoujinshi,
          pageCount: pageCount,
          curLabel: tempLabel.current,
        }).labels
      )
      observer.disconnect()
    }
  }, [curDoujinshi, pageCount, hasScrolled, setCurPageLabel])

  // scroll to curLabel view
  useEffect(() => {
    if (hasScrolled) return
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
      setHasScrolled(true)
    }

    tryScroll()
  }, [curPageLabel, hasScrolled])

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
              withBorder
              radius={0}
              key={d.title}
              id={d.title}
              flex={1}
              ref={el => {
                if (el) itemsRef.current[d.title] = el
              }}
            >
              <ObserverImg
                style={{ aspectRatio: d.width / d.height }}
                fit="contain"
                src={getImagePath(curDoujinshi, d.title)}
              />
            </Paper>
          ))}
        </Stack>
      </Center>
    </ScrollArea>
  )
}
