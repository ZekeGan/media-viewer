import { Badge, Box, Center, Drawer, ScrollArea, Stack } from '@mantine/core'
import { Img } from '@/components/Img'
import { useHover, useMounted } from '@mantine/hooks'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMainData } from '@/context/mainContext'
import { useDoujinshi } from '@/context/doujinshiContext'

export default function SideBar() {
  const { curDoujinshi, imageList, goToSpecificPage, pagination } = useDoujinshi()

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { hovered: targetHover, ref: targetRef } = useHover()
  const { hovered: menuHovered, ref: menuRef } = useHover()

  // 自動滾動到指定Page位置
  useEffect(() => {
    if (!pagination) return
    requestAnimationFrame(() => {
      itemRefs.current[pagination.allPages[Math.min(...pagination.curPageIdxs)]]?.scrollIntoView({
        behavior: 'instant',
      })
    })
  }, [targetHover, pagination])

  if (!curDoujinshi || !imageList) return null
  // console.log('side')

  return (
    <>
      <Box ref={targetRef} pos="fixed" left={0} top={0} w="100px" h="100%" />

      <Drawer
        ref={menuRef}
        opened={targetHover || menuHovered}
        onClose={close}
        withCloseButton={false}
        withOverlay={false}
        padding={0}
        size="xs"
        keepMounted
      >
        <ScrollArea h="100vh">
          <Stack gap="md">
            {imageList.map((d, idx) => {
              return (
                <Center
                  key={d.label}
                  id={d.label}
                  ref={el => {
                    if (el) itemRefs.current[d.label] = el
                  }}
                  h="100%"
                  pos="relative"
                  style={{ cursor: 'pointer' }}
                  p={0}
                  onClick={() => goToSpecificPage(d.label)}
                >
                  <Badge
                    pos="absolute"
                    left={0}
                    top={0}
                    size="lg"
                    radius="lg"
                    color="dark"
                    opacity={0.8}
                    m="xs"
                  >
                    {idx + 1}
                  </Badge>
                  <Img w="100%" src={d.imageUrl} fit="contain" />
                </Center>
              )
            })}
          </Stack>
        </ScrollArea>
      </Drawer>
    </>
  )
}
