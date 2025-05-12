import { doujinshiTypes } from '@/constants'
import { doujinshiTypesColor } from '@/constants/style'
import {
  Button,
  Card,
  Center,
  Flex,
  Input,
  Pill,
  PillsInput,
  Stack,
  Text,
} from '@mantine/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

export default function SearchBar({}: {}) {
  const router = useRouter()
  const params = useSearchParams()
  const [types, setTypes] = useState(
    doujinshiTypes.map(d => ({ value: d, label: d, isSelected: true }))
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
                onClick={() =>
                  setTypes(prev =>
                    prev.map(p =>
                      p.value === d.value
                        ? { ...p, isSelected: !d.isSelected }
                        : p
                    )
                  )
                }
              >
                {d.label}
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
