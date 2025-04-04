import { HeaderHeight, MainPadding } from '@/constants/style'
import { Box, Container, Flex, Group } from '@mantine/core'
import Link from 'next/link'
import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Container fluid p={0}>
      <Flex h={HeaderHeight} bg="gray.2" align="center" px="2rem">
        <Group gap="xl">
          <Link href="/">Home</Link>
          <Link href="/image">1.Pinterest介面 只展示圖片</Link>
          <div>2.可隨機抽取任一遊戲</div>
          <Link href="/tags">3.編輯TAG的介面</Link>
          <div>4.顯示遊戲使用的次數</div>
          <div>5.隱藏NAV</div>
        </Group>
      </Flex>
      <Box p={MainPadding}>{children}</Box>
    </Container>
  )
}
