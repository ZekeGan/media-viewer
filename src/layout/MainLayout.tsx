'use client'

import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ActionIcon,
  AnchorProps,
  Box,
  Card,
  Container,
  Flex,
  Group,
  HoverCard,
  Stack,
  Text,
} from '@mantine/core'
import { useHover } from '@mantine/hooks'
import {
  IconEdit,
  IconPhoto,
  IconSettings,
  IconSquare,
} from '@tabler/icons-react'
import SettingModal from './_container/SettingModal'

const HoverAnchor = ({
  href,
  children,
}: {
  href: string
  children: ReactNode
} & AnchorProps) => {
  const { hovered, ref } = useHover()

  const router = useRouter()

  return (
    <Box
      ref={ref}
      p="md"
      bg={hovered ? 'dark' : ''}
      onClick={() => router.push(href)}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </Box>
  )
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const [openSetting, setOpenSetting] = useState(false)

  const gameList = [
    { icon: <IconSquare />, label: '詳細檢視', href: '/game' },
    { icon: <IconPhoto />, label: '圖片檢視', href: '/game/image' },
    { icon: <IconEdit />, label: '編輯標籤', href: '/game/edit_meta' },
  ]

  return (
    <Container fluid p={0} w="100vw" h="100vh">
      <Card radius={0} p={0}>
        <Flex justify="space-between" align="center" px="md">
          <Box />

          <Group gap="xl">
            <HoverAnchor href="/">
              <Text>首頁</Text>
            </HoverAnchor>
            <HoverCard>
              <HoverCard.Target>
                <Text>遊戲</Text>
              </HoverCard.Target>
              <HoverCard.Dropdown p={0}>
                <Stack miw={200}>
                  {gameList.map(d => (
                    <HoverAnchor key={d.href} href={d.href}>
                      <Flex gap="md">
                        {d.icon}
                        <Text>{d.label}</Text>
                      </Flex>
                    </HoverAnchor>
                  ))}
                </Stack>
              </HoverCard.Dropdown>
            </HoverCard>
            <HoverAnchor href="/doujinshi">
              <Text>同人誌</Text>
            </HoverAnchor>
          </Group>

          <Flex>
            <ActionIcon
              variant="transparent"
              onClick={() => setOpenSetting(true)}
            >
              <IconSettings />
            </ActionIcon>
          </Flex>
        </Flex>
      </Card>

      <Box>{children}</Box>

      <SettingModal openSetting={openSetting} setOpenSetting={setOpenSetting} />
    </Container>
  )
}
