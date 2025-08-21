import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Card, Center, Flex, Input, Stack } from '@mantine/core'
import { doujinshiTypes } from '@/constants'
import { doujinshiTypesColor } from '@/constants/style'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function SearchBar() {
  const router = useRouter()
  const params = useSearchParams()
  const searchTypes = useDoujinshiStore(state => state.searchTypes)
  const setSearchTypes = useDoujinshiStore(state => state.setSearchTypes)

  const [types, setTypes] = useState<
    { value: IDoujinshiData['types']; isSelected: boolean }[]
  >(
    doujinshiTypes.map(d => ({
      value: d,
      isSelected: searchTypes.includes(d),
    }))
  )
  const [inputData, setInputData] = useState<string>('')

  // get tags from url
  useEffect(() => {
    if (!params.get('tags')) return

    const str = params
      .get('tags')!
      .split(',')
      .filter(s => !s.startsWith('types:'))
      .join(',')

    setInputData(str)
  }, [params])

  const onChangeSearchTypes = (val: string) => {
    const newTypes = types.map(p =>
      p.value === val ? { ...p, isSelected: !p.isSelected } : p
    )
    setTypes(newTypes)
    setSearchTypes(
      newTypes
        .map(d => d.isSelected && d.value)
        .filter(Boolean) as IDoujinshiData['types'][]
    )
  }

  const onSearch = () => {
    console.log('search')

    const typesParams = types.every(d => d.isSelected)
      ? []
      : types.filter(d => d.isSelected).map(d => `types:${d.value}`)

    router.push(
      `/doujinshi?tags=${[...typesParams, ...inputData.split(',')].join(',')}`
    )
  }

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Center>
        <Stack>
          <Flex gap="md">
            {types.map(d => (
              <Button
                classNames={{ label: 'capitalize' }}
                key={d.value}
                color={d.isSelected ? doujinshiTypesColor[d.value] : 'gray'}
                variant={d.isSelected ? 'filled' : 'light'}
                size="sm"
                onClick={() => onChangeSearchTypes(d.value)}
              >
                {d.value}
              </Button>
            ))}
          </Flex>

          <Flex gap="md">
            <Input
              flex={1}
              value={inputData}
              placeholder="使用 , 區分"
              onChange={e => setInputData(e.currentTarget.value)}
              onKeyDown={e => e.key === 'Enter' && onSearch()}
            />

            <Button variant="filled" color="gray" onClick={() => onSearch()}>
              搜尋
            </Button>
          </Flex>
        </Stack>
      </Center>
    </Card>
  )
}
