import { useMemo } from 'react'
import { Flex, Grid, Paper } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { useGameData } from '@/context/gameContext'
import { Img } from '@/components/Img'

const len = 7

export default function GameImageContainer() {
  const { gameList } = useGameData()

  const list = useMemo(() => {
    let temp: IGameMeta[][] = Array.from({ length: len }).map(() => [])
    gameList.forEach((e, idx) => {
      temp[idx % len].push(e)
    })
    return temp
  }, [gameList])

  const openFolder = async (folderPath: string) => {
    const res = await axios.post('/api/exec', { folderPath })
    if (res.status === 200) {
      notifications.show({
        title: '成功打開資料夾',
        message: '',
        position: 'top-right',
      })
    }
  }

  return (
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
                  src={`/api/image/?path=${encodeURIComponent(`${item.meta.root}/_meta/${item.meta.coverName}`)}`}
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
  )
}
