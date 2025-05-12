import {
  Badge,
  Box,
  Drawer,
  Paper,
  ScrollArea,
  Stack,
  Tooltip,
} from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useDoujinshi } from '@/context/doujinshiContext'
import { ObserverImg } from '@/components/ObserverImg'
import { getImagePath } from '@/utils'
import { useFetchInfiniteImages } from '@/hooks/useFetchInfiniteImages'

export default function SideBar() {
  const itemRefs = useRef<Record<string, HTMLDivElement>>({})
  const { curDoujinshi, goToSpecificPage, pagination, openSideBar } =
    useDoujinshi()

  const { visibleData, loaderRef } = useFetchInfiniteImages(
    curDoujinshi?.meta.pages
  )

  // 自動滾動到指定Page位置
  useEffect(() => {
    if (!pagination) return
    setTimeout(() => {
      const el = itemRefs.current[pagination.curPageLabels[0]]
      if (el) {
        el.scrollIntoView({
          behavior: 'instant',
          block: 'start',
        })
      }
    }, 0)
  }, [openSideBar, pagination])

  if (!curDoujinshi || !pagination) return null

  return (
    <Drawer
      opened={openSideBar}
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
              id={idx.toString()}
              pos="relative"
              style={{ cursor: 'pointer', overflow: 'hidden' }}
              radius="md"
              onClick={() => goToSpecificPage(d.title)}
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
                    pagination.curPageLabels.some(t => t === d.title)
                      ? 'yellow'
                      : 'dark'
                  }
                >
                  {idx + 1}
                </Badge>
              </Tooltip>

              <ObserverImg
                src={getImagePath(curDoujinshi, d.title)}
                fit="contain"
                w={d.width}
                h={d.height}
              />
            </Paper>
          ))}
        </Stack>
      </ScrollArea>
    </Drawer>
  )
}
