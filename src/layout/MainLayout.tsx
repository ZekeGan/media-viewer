import { HeaderHeight, MainPadding } from '@/constants/style'
import { Box, Container, Flex, Group } from '@mantine/core'
import Link from 'next/link'
import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Container fluid p={0}>
      <Flex h={HeaderHeight} bg="gray" align="center" px="2rem">
        <Group gap="xl">
          <Link href="/">Home</Link>
          <Link href="/game">Game</Link>
          <Link href="/game/image">Pinterest介面 只展示圖片</Link>
          <Link href="/game/edit_tags">編輯TAG的介面</Link>
          <Link href="/doujinshi">Doujinshi</Link>
          <div>4.顯示遊戲使用的次數</div>
        </Group>
      </Flex>
      <Box p={MainPadding}>{children}</Box>
    </Container>
  )
}
