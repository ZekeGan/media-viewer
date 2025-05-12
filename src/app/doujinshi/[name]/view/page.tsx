'use client'

import { Box, Container, ScrollArea } from '@mantine/core'
import { useDoujinshi } from '@/context/doujinshiContext'

import VerticalReadingContainer from './_container/VerticalReadingContainer'
import ToolBar from './_container/ToolBar'
import SideBar from './_container/SideBar'
import HorizonReadingContainer from './_container/HorizonReadingContainer'
import { useMainData } from '@/context/mainContext'

export default function Page() {
  const { doujinshiPageSetting } = useMainData()
  console.log('view page')

  return (
    <Container
      fluid
      pos="fixed"
      left={0}
      top={0}
      w="100vw"
      h="100vh"
      bg="dark"
      p={0}
    >
      <ScrollArea w="100vw" h="100vh" type="always">
        {doujinshiPageSetting.isVertical && <VerticalReadingContainer />}
        {!doujinshiPageSetting.isVertical && <HorizonReadingContainer />}
      </ScrollArea>
      <Box style={{ zIndex: 10 }}>
        <SideBar />
        <ToolBar />
      </Box>
    </Container>
  )
}
