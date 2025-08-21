import { useEffect, useRef, useState } from 'react'
import {
  Badge,
  Box,
  Drawer,
  Menu,
  Paper,
  ScrollArea,
  Stack,
  Tooltip,
} from '@mantine/core'
import scrollIntoView from 'scroll-into-view-if-needed'
import { ObserverImg } from '@/components/ObserverImg'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'
import { getLabels } from '@/utils/doujinshiUtils'

export default function SideBar() {
  const itemRefs = useRef<Record<string, HTMLDivElement>>({})
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const { setHash } = useGoTo()
  const [opened, setOpened] = useState(false)

  // 自動滾動到指定Page位置
  useEffect(() => {
    if (!opened) return

    // 等待 Drawer 完全打开和渲染完成
    const timer = setTimeout(() => {
      const tryScroll = () => {
        const el = itemRefs.current[curPageLabel.split('-')[0]]

        if (!el) {
          requestAnimationFrame(tryScroll)
          return
        }

        scrollIntoView(el, {
          behavior: 'instant',
          block: 'start',
        })
      }

      tryScroll()
    }, 50) // 增加延迟时间

    return () => clearTimeout(timer)
  }, [curPageLabel, opened])

  const goToPage = (label: string) => {
    if (!curDoujinshi) return
    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount,
      curLabel: label,
    }).labels
    setHash(labels)
  }

  if (!curDoujinshi) return null

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="right"
      trigger="hover"
      transitionProps={{ duration: 300, transition: 'slide-right' }}
    >
      <Menu.Target>
        <Box h="100vh" w="10vw" pos="fixed" left="0" top="0" />
      </Menu.Target>

      <Menu.Dropdown ml="-10vw">
        <ScrollArea h="95vh" w="20vw">
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
      </Menu.Dropdown>
    </Menu>
  )
}
