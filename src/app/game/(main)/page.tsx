'use client'

import { Divider, Flex, Grid, Group, Select, Stack, Text } from '@mantine/core'
import { useGameData } from '@/context/gameContext'
import { defaultGameListOrder } from '@/constants'
import { useSearchParamsFns } from '@/hooks/useSearchParamsFns'
import FilterListContainer from './_container/FilterListContainer'
import GameGridContainer from './_container/GameGridContainer'

const OrderSelectConfig: { value: keyof IGameData; label: string }[] = [
  { value: 'author', label: '照作者排序' },
  { value: 'game_name', label: '照遊戲名稱排序' },
  { value: 'author_from', label: '照產地排序' },
]

export default function HomeClientPage() {
  const { tempGameList } = useGameData()

  const { updateQueryString, getParamsList } = useSearchParamsFns()

  const orderBy = getParamsList('order')?.[0] || defaultGameListOrder

  const onSelectChange = (label: string) => {
    const value = OrderSelectConfig.find(i => i.label === label)?.value!
    updateQueryString('order', value)
  }

  return (
    <Grid p="md">
      <Grid.Col span={2}>
        <FilterListContainer />
      </Grid.Col>

      <Grid.Col span={10}>
        <Divider
          mb="md"
          size="md"
          label={`總遊戲數 ${tempGameList.length} 個`}
        />
        <Stack>
          <Flex justify="space-between">
            <Group gap="sm">
              <Text>排序方式</Text>
              <Select
                checkIconPosition="right"
                defaultValue={orderBy}
                onSearchChange={onSelectChange}
                data={OrderSelectConfig}
                allowDeselect={false}
              />
            </Group>
          </Flex>
          <GameGridContainer />
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
