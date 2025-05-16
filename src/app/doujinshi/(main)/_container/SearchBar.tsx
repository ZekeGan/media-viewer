import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  Card,
  Center,
  Flex,
  Pill,
  PillsInput,
  Stack,
} from '@mantine/core'
import { doujinshiTypes } from '@/constants'
import { doujinshiTypesColor } from '@/constants/style'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function SearchBar({}: {}) {
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

  const [inputData, setInputData] = useState<string[]>([])

  const toggleSearch = () => {
    const typesParams = types.every(d => d.isSelected)
      ? []
      : types.filter(d => d.isSelected).map(d => `types:${d.value}`)
    router.push(`/doujinshi?tags=${[...typesParams, ...inputData].join(',')}`)
  }

  useEffect(() => {
    setInputData(params.get('tags') ? params.get('tags')!.split(',') : [])
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

  console.log('searchbar')

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
            <PillsInput flex={1}>
              <Pill.Group>
                {inputData.map(d => (
                  <Pill
                    key={d}
                    withRemoveButton
                    onRemove={() => {
                      setInputData(p => p.filter(p => p !== d))
                    }}
                  >
                    {d}
                  </Pill>
                ))}
                <PillsInput.Field
                  placeholder="Enter tags"
                  onChange={e => {
                    const [value, ...rest] = e.currentTarget.value.split(' ')
                    if (rest.length > 0) {
                      setInputData(p =>
                        Array.from(new Set<string>([...p, value]))
                      )
                      e.currentTarget.value = rest.join('')
                    }
                  }}
                />
              </Pill.Group>
            </PillsInput>
            <Button
              variant="filled"
              color="gray"
              onClick={() => toggleSearch()}
            >
              搜尋
            </Button>
          </Flex>
        </Stack>
      </Center>
    </Card>
  )
}
