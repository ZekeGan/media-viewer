'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, Center, Divider, Flex, Stack, Text } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { nanoid } from 'nanoid'
import { ContentWidth } from '@/constants/style'
import MainLayout from '@/layout/MainLayout'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import LoadingContainer from '@/components/LoadingContainer'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import SearchBar from './_container/SearchBar'

export default function MainPage() {
  const params = useSearchParams()
  const doujinshiList = useDoujinshiStore(s => s.doujinshiList)

  const search = useMemo(
    () => (params.get('tags') ? params.get('tags')!.split(',') : []),
    [params]
  )

  const data = useMemo(() => {
    if (!doujinshiList) return undefined
    if (search.length === 0) return doujinshiList

    const map = new Map<string, string[]>()
    search.forEach(d => {
      const [key, value] = d.split(':')
      if (!value) {
        map.set(
          'general',
          map.has('general') ? [...map.get('general')!, key] : [key]
        )
      } else {
        map.set(key, map.has(key) ? [...map.get(key)!, value] : [value])
      }
    })

    let filteredDoujinshi: IDoujinshiMeta[] = doujinshiList

    // 先把types給過濾出來
    if (map.has('types')) {
      filteredDoujinshi = filteredDoujinshi.filter(doujin => {
        return map.get('types')!.includes(doujin.data.types.toLowerCase())
      })
      map.delete('types')
    }

    if (map.has('general')) {
      map.get('general')!.forEach(mapValue => {
        filteredDoujinshi = filteredDoujinshi.filter(d => {
          for (const tagKey in d.data) {
            const bannedKeyList = ['pages', 'id', 'fullTitle']
            if (bannedKeyList.includes(tagKey.toLowerCase())) continue

            const tagValue = d.data[tagKey as keyof IDoujinshiData]
            if (
              (typeof tagValue === 'string' &&
                tagValue.toLowerCase().includes(mapValue.toLowerCase())) ||
              (typeof tagValue === 'object' &&
                tagValue.some(_v => _v.includes(mapValue.toLowerCase())))
            ) {
              return true
            }
          }
        })
      })
      map.delete('general')
    }

    map.keys().forEach(key => {
      filteredDoujinshi = filteredDoujinshi.filter(doujin => {
        if (!(key in doujin.data)) return false
        const values = map.get(key) ?? []
        return values.some(mapValue => {
          const tagsValue = doujin.data[key as keyof IDoujinshiData]
          if (typeof tagsValue === 'string') {
            return tagsValue.toLowerCase().includes(mapValue.toLowerCase())
          } else {
            return tagsValue.some(tag =>
              tag.toLowerCase().includes(mapValue.toLowerCase())
            )
          }
        })
      })
    })

    return filteredDoujinshi
  }, [doujinshiList, search])

  if (!data) return <LoadingContainer />
  console.log('main')

  return (
    <MainLayout>
      <Divider my="md" size="md" label={`總數量 ${data.length} 個`} />
      <Center p="md">
        <Box w={ContentWidth}>
          <SearchBar />
        </Box>
      </Center>
      <Center flex={1}>
        <Stack w={ContentWidth}>
          <Stack flex={1}>
            {data.length === 0 ? (
              <Center h="100%">
                <Flex gap="sm" mt="md">
                  <IconSearch />
                  <Text>沒有找到任何作品</Text>
                </Flex>
              </Center>
            ) : (
              data.map(item => (
                <DoujinshiDetailCard
                  key={nanoid()}
                  doujinshi={item}
                  cardType="list"
                />
              ))
            )}
          </Stack>
        </Stack>
      </Center>
    </MainLayout>
  )
}
