'use client'

import { Box, Divider, Stack } from '@mantine/core'
import { useGameData } from '@/context/gameContext'
import GameImageContainer from './_container/GameImageContainer'

export default function Page() {
  const { gameList } = useGameData()

  return (
    <>
      <Divider my="md" size="md" label={`總遊戲數 ${gameList.length} 個`} />
      <Stack p="md" flex={1}>
        <GameImageContainer />
      </Stack>
    </>
  )
}
