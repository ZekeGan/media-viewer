'use client'

import { Box, Container, ScrollArea } from '@mantine/core'

import VerticalReadingContainer from './_container/VerticalReadingContainer'
import ToolBar from './_container/ToolBar'
import SideBar from './_container/SideBar'
import HorizonReadingContainer from './_container/HorizonReadingContainer'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function Page() {
  const isVertical = useDoujinshiStore(s => s.pageSetting.isVertical)
  console.log('view page')

  return (
    <Container fluid w="100vw" h="100vh" bg="dark" p={0}>
      {isVertical && <VerticalReadingContainer />}
      {!isVertical && <HorizonReadingContainer />}
      <Box style={{ zIndex: 10 }}>
        <SideBar />
        <ToolBar />
      </Box>
    </Container>
  )
}
