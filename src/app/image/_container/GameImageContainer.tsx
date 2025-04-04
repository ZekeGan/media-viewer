import { useMemo } from 'react'
import axios from 'axios'
import { notifications } from '@mantine/notifications'
import { useMainData } from '@/context/mainContext'
import noImg from '@/assets/no-image.jpg'
import { Flex, Grid, Image, Paper } from '@mantine/core'

const len = 7

export default function GameImageContainer() {
  const { gameList } = useMainData()

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
            {arr.map(item => {
              const {
                data: { game_name, folder_path, id },
                cover,
              } = item

              return (
                <Paper
                  key={id}
                  shadow="md"
                  radius="lg"
                  onClick={() => openFolder(folder_path)}
                  style={{ cursor: 'pointer', overflow: 'hidden' }}
                >
                  <Image src={cover || noImg.src} w="100%" h="auto" alt={game_name} />
                </Paper>
              )
            })}
          </Flex>
        </Grid.Col>
      ))}
    </Grid>
  )
}
