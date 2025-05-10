'use client'

import { useEffect } from 'react'
import { Box, Center, Flex, ScrollArea } from '@mantine/core'
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
  console.log(imageAttrs)

  const ImageContainer = () => {
    return (
      <Box w="max-content" h="max-content">
        <Flex
          onClick={() => goToPage(1)}
          style={{ cursor: 'pointer' }}
          {...(imageAttrs.isVertical && { direction: 'column' })}
          {...(imageAttrs.isFullHeight && { h: '100vh' })}
          {...(imageAttrs.isFullWidth && { w: '100vw' })}
          {...(!imageAttrs.isFullHeight &&
            !imageAttrs.isFullWidth && { w: `${imageAttrs.zoomRatio * 100}rem` })}
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
        </Flex>
      </Box>
    )
  }

  return (
    <Box h="100vh" w="100vw" style={{ overflowY: 'scroll' }}>
      {/* <ScreenController /> */}
      <SideBar />
      <ToolBar />
      {imageAttrs.isFullHeight || imageAttrs.isFullWidth || imageAttrs.isVertical ? (
        <Center>{ImageContainer()}</Center>
      ) : (
        <Box
          w="100vw"
          h="100vh"
          {...(imageAttrs.zoomRatio < 1 && {
            display: 'flex',
            style: {
              justifyContent: 'center',
              alignItems: 'center',
            },
          })}
        >
          {ImageContainer()}
        </Box>
      )}
    </Box>
  )
}
