'use client'

import { useMemo } from 'react'
import { Stack } from '@mantine/core'
import { Flex, Grid, Paper } from '@mantine/core'
import { IGameMeta } from 'shared/type'
import { useGameData } from '@/context/gameContext'
import { Img } from '@/components/Img'
import { getMetaImagePath } from '@/utils/path'

export default function Page() {
  const len = 7

  const { gameList } = useGameData()

  const list = useMemo(() => {
    let temp: IGameMeta[][] = Array.from({ length: len }).map(() => [])
    gameList.forEach((e, idx) => {
      temp[idx % len].push(e)
    })
    return temp
  }, [gameList])

  const openFolder = async (folderPath: string) => {
    await window.electronApi.openFolder(folderPath)
  }

  return (
    <Stack p="md" flex={1}>
      <Grid>
        {list.map((arr, AIdx) => (
          <Grid.Col key={AIdx} span={12 / len}>
            <Flex direction="column" gap="lg">
              {arr.map(item => (
                <Paper
                  key={item.data.id}
                  shadow="md"
                  radius="lg"
                  onClick={() => openFolder(item.data.folder_path)}
                  style={{ cursor: 'pointer', overflow: 'hidden' }}
                >
                  <Img
                    src={getMetaImagePath(item)}
                    w="100%"
                    h="auto"
                    alt={item.data.game_name}
                  />
                </Paper>
              ))}
            </Flex>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  )
}
