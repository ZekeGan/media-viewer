'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Card,
  Center,
  Divider,
  Flex,
  Grid,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconChevronRight, IconHome, IconSearch } from '@tabler/icons-react'
import { nanoid } from 'nanoid'
import { ContentWidth, doujinshiTypesColor } from '@/constants/style'
import MainLayout from '@/layout/MainLayout'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { Img } from '@/components/Img'
import LoadingContainer from '@/components/LoadingContainer'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import SearchBar from './_container/SearchBar'

export default function MainPage() {
  const params = useSearchParams()
  const doujinshiList = useDoujinshiStore(s => s.doujinshiList)
  const [displayMode, setDisplayMode] = useState('thumbnail')
  const router = useRouter()

  const search = useMemo(
    () => (params.get('tags') ? params.get('tags')!.split(',') : []),
    [params]
  )

  const data = useMemo(() => {
    if (!doujinshiList) return undefined
    const doujin = doujinshiList.sort((a, b) =>
      a.data.id > b.data.id ? -1 : 1
    )

    if (search.length === 0) return doujin

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

    let filteredDoujinshi: IDoujinshiMeta[] = doujin

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

  const items = [
    { title: <IconHome />, href: '/' },
    { title: '同人誌', href: '/doujinshi' },
  ].map((item, index) => (
    <Anchor href={item.href} key={index} size="sm" c="gray">
      {item.title}
    </Anchor>
  ))

  if (!data) return <LoadingContainer />

  return (
    <MainLayout>
      <Divider my="md" size="md" label={`總數量 ${data.length} 個`} />
      <Center>
        <Flex w={ContentWidth} justify="space-between">
          <Breadcrumbs separator={<IconChevronRight />}>{items}</Breadcrumbs>
          <Select
            checkIconPosition="right"
            allowDeselect={false}
            w="4rem"
            size="xs"
            data={['5', '6', '7', '8', '9', '10']}
            // defaultValue={detailCountPerRows.toString()}
            // onChange={e => setDetailCountPerRows(Number(e))}
          />
        </Flex>
      </Center>

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
              <>
                {displayMode === 'extended' && (
                  <Stack>
                    {data.map(item => (
                      <DoujinshiDetailCard
                        key={nanoid()}
                        doujinshi={item}
                        cardType="list"
                      />
                    ))}
                  </Stack>
                )}

                {displayMode === 'thumbnail' && (
                  <SimpleGrid cols={5}>
                    {data.map(item => {
                      const {
                        data: { title, types },
                        meta: { root, coverName, pages },
                      } = item
                      return (
                        <Card key={nanoid()} p="xs">
                          <Card.Section>
                            <Box
                              className="hover-box"
                              onClick={() =>
                                router.push(
                                  `/doujinshi/${encodeURIComponent(title)}`
                                )
                              }
                              style={{ cursor: 'pointer' }}
                            >
                              <Img
                                w="100%"
                                h="100%"
                                fit="contain"
                                src={`/api/image/?path=${encodeURIComponent(`${root}/_meta/${coverName}`)}`}
                                alt={title}
                              />
                            </Box>
                          </Card.Section>

                          <Stack flex={1} justify="space-between">
                            <Box />
                            <Box>
                              <Text size="sm">{title}</Text>

                              <Flex
                                justify="space-between"
                                align="center"
                                mt="lg"
                              >
                                <Badge
                                  classNames={{ label: 'capitalize' }}
                                  radius="sm"
                                  color={doujinshiTypesColor[types]}
                                >
                                  {types}
                                </Badge>

                                <Text size="sm">{pages.length} 頁</Text>
                              </Flex>
                            </Box>
                          </Stack>
                        </Card>
                      )
                    })}
                  </SimpleGrid>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Center>
    </MainLayout>
  )
}
