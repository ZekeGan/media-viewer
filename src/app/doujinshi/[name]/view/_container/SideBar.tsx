import { useEffect, useRef } from 'react'
import { Badge, Drawer, Paper, ScrollArea, Stack, Tooltip } from '@mantine/core'
import scrollIntoView from 'scroll-into-view-if-needed'
import { Img } from '@/components/Img'
import { ObserverImg } from '@/components/ObserverImg'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'
import { getLabels } from '@/utils/doujinshiUtils'

export default function SideBar() {
  const itemRefs = useRef<Record<string, HTMLDivElement>>({})
  const sideBarOpen = useDoujinshiStore(state => state.sideBarOpen)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const { goToSpecificPage } = useGoTo()

  // 自動滾動到指定Page位置
  useEffect(() => {
    if (!sideBarOpen) return

    const tryScroll = () => {
      const el = itemRefs.current[curPageLabel.split('-')[0]]

      if (!el) {
        requestAnimationFrame(tryScroll)
        return
      }
      scrollIntoView(el, {
        behavior: 'instant',
        block: 'start',
        scrollMode: 'if-needed',
      })
    }

    tryScroll()
  }, [curPageLabel, sideBarOpen])

  const goToPage = (label: string) => {
    if (!curDoujinshi) return
    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount,
      curLabel: label,
    }).labels
    setCurPageLabel(labels)
    goToSpecificPage(labels)
  }

  if (!curDoujinshi || !sideBarOpen) return null
  console.log('sidebar---------')

  return (
    <Drawer
      opened={sideBarOpen}
      onClose={close}
      withCloseButton={false}
      withOverlay={false}
      padding={0}
      size="xs"
    >
      <ScrollArea h="100vh">
        <Stack gap="md" p="md">
          {curDoujinshi.meta.pages.map((d, idx) => (
            <Paper
              ref={el => {
                if (el) itemRefs.current[d.title] = el
              }}
              key={d.title}
              pos="relative"
              style={{
                aspectRatio: d.width / d.height,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              radius="md"
              withBorder
              onClick={() => goToPage(d.title)}
            >
              <Tooltip label={d.title}>
                <Badge
                  pos="absolute"
                  left={0}
                  top={0}
                  size="lg"
                  radius="lg"
                  m="xs"
                  opacity={0.8}
                  style={{ zIndex: 10 }}
                  color={
                    curPageLabel.split('-').some(t => t === d.title)
                      ? 'yellow'
                      : 'dark'
                  }
                >
                  {idx + 1}
                </Badge>
              </Tooltip>

              <ObserverImg
                src={getImagePath(curDoujinshi, d.title)}
                style={{ aspectRatio: d.width / d.height }}
                fit="contain"
              />
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Drawer>
  )
}
