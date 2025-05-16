'use client'

import { Box, Divider, Stack } from '@mantine/core'
import { useGameData } from '@/context/gameContext'
import GameImageContainer from './_container/GameImageContainer'

export default function Page() {
  const { gameList } = useGameData()

  return (
    <Box>
      <Divider mb="md" size="md" label={`總遊戲數 ${gameList.length} 個`} />
      <Stack>
        <GameImageContainer />
      </Stack>
    </Box>
  )
}
