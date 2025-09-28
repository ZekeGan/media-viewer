'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Accordion,
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Card,
  Divider,
  Flex,
  Grid,
  Group,
  Pill,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconSettings } from '@tabler/icons-react'
import { nanoid } from 'nanoid'
import * as R from 'ramda'
import { useGameData } from '@/context/gameContext'
import { defaultGameListOrder } from '@/constants'
import {
  FilterContainer,
  GroupedFilterContainer,
} from '@/components/FilterContainer'
import { Img } from '@/components/Img'
import OpenFolderBtn from '@/components/OpenFolderBtn'
import { useSearchParamsFns } from '@/hooks/useSearchParamsFns'
import { useTranslate } from '@/hooks/useTranslate'

const OrderSelectConfig: { value: keyof IGameData; label: string }[] = [
  { value: 'author', label: '照作者排序' },
  { value: 'game_name', label: '照遊戲名稱排序' },
  { value: 'author_from', label: '照產地排序' },
]

const cutString = (v: string) => {
  const len = 25
  return v.length > len ? `${v.slice(0, len)}...` : v
}

export default function HomeClientPage() {
  const router = useRouter()
  const { t } = useTranslate()
  const { gameList } = useGameData()
  const { getParamsList, updateQueryString, queryString } = useSearchParamsFns()

  const [tempGameList, setTempGameList] = useState<IGameMeta[]>([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setParams = (paramsKey: string, val: string) => {
    const params = getParamsList(paramsKey)
    const toggleVal = R.curry((val, arr) =>
      R.includes(val, arr) ? R.without([val], arr) : R.append(val, arr)
    )
    updateQueryString(paramsKey, toggleVal(val, params).toString())
  }

  const paramsList = useMemo(() => {
    return {
      isCensored: getParamsList('isCensored'),
      isDynamic: getParamsList('isDynamic'),
      author: getParamsList('author'),
      author_from: getParamsList('author_from'),
      tags: getParamsList('tags'),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getParamsList, queryString])

  const filterConfig = useMemo(() => {
    const getFilterList = (keys: string[], params: string[]) => {
      const map = new Map(keys.map(i => [i, 0]))
      keys.forEach(i => map.set(i, map.get(i)! + 1))
      return R.uniq(keys.map(i => i)).map(i => ({
        key: i,
        label: t(i),
        checked: params.includes(i),
        count: map.get(i)!,
      }))
    }

    const censoredList = getFilterList(
      gameList.map(i => i.data.isCensored),
      getParamsList('isCensored')
    )

    const dynamicList = getFilterList(
      gameList.map(i => i.data.isDynamic),
      getParamsList('isDynamic')
    )

    const authorList = getFilterList(
      gameList.map(i => i.data.author),
      getParamsList('author')
    )

    const authorFromList = getFilterList(
      gameList.map(i => i.data.author_from),
      getParamsList('author_from')
    )

    const tagsList = getFilterList(
      gameList.map(i => i.data.tags).flat(),
      getParamsList('tags')
    )

    return [
      {
        key: 'isCensored',
        isOpen: censoredList.some(i => i.checked),
        label: '有無碼',
        list: censoredList,
        setList: (val: string) => setParams('isCensored', val),
        isGroup: false,
      },
      {
        key: 'isDynamic',
        isOpen: dynamicList.some(i => i.checked),
        label: '是否動態',
        list: dynamicList,
        setList: (val: string) => setParams('isDynamic', val),
        isGroup: false,
      },
      {
        key: 'author',
        isOpen: authorList.some(i => i.checked),
        label: '作者',
        list: authorList,
        setList: (val: string) => setParams('author', val),
        isGroup: false,
      },
      {
        key: 'author_from',
        isOpen: authorFromList.some(i => i.checked),
        label: '產地',
        list: authorFromList,
        setList: (val: string) => setParams('author_from', val),
        isGroup: false,
      },
      {
        key: 'tags',
        isOpen: tagsList.some(i => i.checked),
        label: '標籤',
        list: tagsList,
        setList: (val: string) => setParams('tags', val),
        isGroup: true,
      },
    ]
  }, [gameList, getParamsList, setParams, t])

  useEffect(() => {
    const filtGameLsit = (list: IGameMeta[], path: string[]) => {
      return list.filter(i => {
        const obj = R.path(path, i)
        return !R.isEmpty(
          R.intersection(
            Array.isArray(obj) ? obj : [obj],
            paramsList[path.at(-1) as keyof typeof paramsList]
          )
        )
      })
    }

    let resultList: IGameMeta[] = gameList

    if (paramsList['isCensored'].length !== 0) {
      resultList = filtGameLsit(resultList, ['data', 'isCensored'])
    }

    if (paramsList['isDynamic'].length !== 0) {
      resultList = filtGameLsit(resultList, ['data', 'isDynamic'])
    }

    if (paramsList['author'].length !== 0) {
      resultList = filtGameLsit(resultList, ['data', 'author'])
    }

    if (paramsList['author_from'].length !== 0) {
      resultList = filtGameLsit(resultList, ['data', 'author_from'])
    }

    if (paramsList['tags'].length !== 0) {
      resultList = filtGameLsit(resultList, ['data', 'tags'])
    }

    const order = (
      getParamsList('order').length === 0
        ? [defaultGameListOrder]
        : getParamsList('order')
    ) as (keyof IGameData)[]

    resultList = resultList.sort((a, b) => {
      const A = (a.data[order[0]] as string).toLowerCase()
      const B = (b.data[order[0]] as string).toLowerCase()
      return A < B ? -1 : A > B ? 1 : 0
    })

    setTempGameList(resultList)
  }, [gameList, getParamsList, paramsList])

  const onSelectChange = (label: string) => {
    const value = OrderSelectConfig.find(i => i.label === label)?.value!
    updateQueryString('order', value)
  }

  return (
    <Grid p="md">
      <Grid.Col span={2}>
        <Stack>
          <Accordion
            multiple
            variant="contained"
            defaultValue={filterConfig.filter(i => i.isOpen).map(i => i.key)}
          >
            {filterConfig.map(i => (
              <Accordion.Item key={i.key} value={i.key}>
                <Accordion.Control>{i.label}</Accordion.Control>
                <Accordion.Panel>
                  {i.isGroup ? (
                    <GroupedFilterContainer
                      list={i.list}
                      setList={i.setList}
                      withCount
                    />
                  ) : (
                    <FilterContainer
                      list={i.list}
                      setList={i.setList}
                      withCount
                    />
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Grid.Col>

      <Grid.Col span={10}>
        <Divider
          mb="md"
          size="md"
          label={`總遊戲數 ${tempGameList.length} 個`}
        />

        <Stack>
          <Flex gap="xs">
            {Object.keys(paramsList).map(k =>
              paramsList[k as keyof typeof paramsList].map(i => (
                <Pill
                  key={nanoid()}
                  size="md"
                  withRemoveButton
                  onRemove={() => setParams(k, i)}
                  styles={{
                    root: { backgroundColor: 'var(--mantine-color-dark-9)' },
                  }}
                >
                  {t(i)}
                </Pill>
              ))
            )}
          </Flex>

          <Flex justify="space-between">
            <Group gap="sm">
              <Text size="sm">排序方式</Text>
              <Select
                checkIconPosition="right"
                defaultValue={
                  getParamsList('order')?.[0] || defaultGameListOrder
                }
                onSearchChange={onSelectChange}
                data={OrderSelectConfig}
                allowDeselect={false}
              />
            </Group>
          </Flex>

          <Stack>
            <SimpleGrid cols={{ md: 2, lg: 4, xl: 6 }}>
              {tempGameList.map(item => {
                const {
                  data: {
                    author,
                    author_from,
                    game_name,
                    game_url,
                    isCensored,
                    isDynamic,
                    tags,
                    folder_path,
                    id,
                  },
                  meta,
                } = item

                const GameName = (
                  <Text
                    component={game_url ? Link : undefined}
                    href={game_url ?? undefined}
                    fw="bold"
                    size="md"
                    c={game_url ? 'blue' : 'gray'}
                  >
                    {cutString(game_name)}
                  </Text>
                )

                return (
                  <Card
                    key={id}
                    shadow="sm"
                    padding="sm"
                    radius="md"
                    withBorder
                  >
                    <Card.Section>
                      <Box
                        component={game_url ? Link : undefined}
                        href={game_url ? game_url : ''}
                        className={game_url && 'hover-box'}
                      >
                        <Img
                          src={`/api/image/?path=${encodeURIComponent(meta.root)}/_meta/${meta.coverName}`}
                          h={{ md: 300, lg: 230, xl: 200 }}
                          alt={game_name}
                        />
                      </Box>
                    </Card.Section>

                    <Stack gap="xs" mb="xl" mt="xs">
                      <Tooltip label={game_name} openDelay={300} p="3">
                        {GameName}
                      </Tooltip>

                      <Flex align="center" gap={5}>
                        <Text size="xs" c="gray">
                          {author_from}
                        </Text>
                        <Anchor size="sm" c="" href={`/game?author=${author}`}>
                          {author}
                        </Anchor>
                      </Flex>

                      <Flex gap="md">
                        {isCensored === 'uncensored' && (
                          <Badge color="pink" size="lg">
                            無碼
                          </Badge>
                        )}

                        {isDynamic === 'dynamic' && (
                          <Badge color="blue" size="lg">
                            動態
                          </Badge>
                        )}
                      </Flex>
                    </Stack>

                    <Stack mt="auto">
                      <Flex gap="xs" wrap="wrap-reverse">
                        {tags.map(i => (
                          <Badge
                            key={i}
                            color="dark"
                            onClick={() => setParams('tags', i)}
                            className="hover-box "
                            style={{ cursor: 'pointer' }}
                          >
                            {t(i)}
                          </Badge>
                        ))}
                      </Flex>

                      <Group justify="space-between" gap="sm">
                        <OpenFolderBtn flex={1} folderPath={folder_path} />
                        <ActionIcon
                          size="lg"
                          variant="outline"
                          onClick={() => {
                            router.push(`/game/edit/${id}`)
                          }}
                        >
                          <IconSettings
                            style={{ width: '70%', height: '70%' }}
                            stroke={1.5}
                          />
                        </ActionIcon>
                      </Group>
                    </Stack>
                  </Card>
                )
              })}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
