'use client'

import { useEffect } from 'react'
import { Box, Center, ScrollArea } from '@mantine/core'
import LoadingContainer from '@/components/LoadingContainer'
import { useDoujinshi } from '@/context/doujinshiContext'
import { Img } from '@/components/Img'
import SideBar from './_container/SideBar'
import ToolBar from './_container/ToolBar'

export type IImageAttrs = {
  isVertical: boolean
  isSinglePage: boolean
  isFullWidth: boolean
  isFullHeight: boolean
  zoomRatio: number
}

export default function EditPage() {
  const { curDoujinshi, imageList, pagination, imageAttrs, goToPage } = useDoujinshi()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!curDoujinshi || !imageList || !pagination) return <LoadingContainer />

  return (
    <ScrollArea h="100vh" w="100vw" type="always">
      {/* <ScreenController /> */}
      <SideBar />
      <ToolBar />
      <Center style={{ cursor: 'pointer' }}>
        <Box w="max-content" h="max-content" onClick={() => goToPage(1)}>
          <Box
            {...(imageAttrs.isVertical ? { display: 'block' } : { display: 'flex' })}
            {...(imageAttrs.isFullHeight && { h: '100vh' })}
            {...(imageAttrs.isFullWidth && { w: '100vw' })}
            {...(!imageAttrs.isFullHeight &&
              !imageAttrs.isFullWidth && { w: `${imageAttrs.zoomRatio * 100}vw` })}
          >
            {imageAttrs.isVertical
              ? imageList.map(d => (
                  <Box key={d.label} flex={1}>
                    <Img w="100%" h="100%" fit="contain" src={d.imageUrl} />
                  </Box>
                ))
              : pagination.curPageIdxs.map(d => (
                  <Box key={d} flex={1}>
                    <Img w="100%" h="100%" fit="contain" src={imageList[d].imageUrl} />
                  </Box>
                ))}
          </Box>
        </Box>
      </Center>
    </ScrollArea>
  )
}
