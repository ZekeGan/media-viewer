'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Accordion,
  ActionIcon,
  Autocomplete,
  Button,
  Card,
  Center,
  Flex,
  Grid,
  Group,
  Popover,
  ScrollArea,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import axios from 'axios'
import { uniq } from 'ramda'
import { useGameData } from '@/context/gameContext'
import { HeaderHeight, MainPadding } from '@/constants/style'
import { GroupedFilterContainer } from '@/components/FilterContainer'
import OpenFolderBtn from '@/components/OpenFolderBtn'
import { useTranslate } from '@/hooks/useTranslate'
import useWindowSize from '@/hooks/useWindowSize'

export default function EditPage({ params }: { params: { id: string } }) {
  const { gameList } = useGameData()
  const metaData = gameList.find(i => i.data.id === params.id)
  if (!metaData) return <div>Error</div>

  return <EditCurGameClient list={gameList} metaData={metaData} />
}

function EditCurGameClient({
  list,
  metaData,
}: {
  list: IGameMeta[]
  metaData: IGameMeta
}) {
  const { t } = useTranslate()
  const { gameTags, updateGameList } = useGameData()
  const {
    data: {
      game_name,
      game_url,
      author: _author,
      author_from,
      isCensored: _isCensored,
      isDynamic: _isDynamic,
      tags: _tags,
      folder_path,
    },
    meta: { coverName },
  } = metaData

  const router = useRouter()
  const { height } = useWindowSize()

  const [gameUrl, setGameUrl] = useState(game_url)
  const [coverUrl, setCoverUrl] = useState('')
  const [gameName, setGameName] = useState(game_name)
  const [author, setAuthor] = useState(_author)
  const [authorFrom, setAuthorFrom] = useState(author_from)
  const [tagsList, setTagsList] = useState(() => {
    return Object.keys(gameTags).map(i => ({
      key: i,
      label: t(i),
      checked: _tags.includes(i),
      count: 0,
    }))
  })
  const [isUncensored, setIsUncensored] = useState(_isCensored === 'uncensored')
  const [isDynamic, setIsDynamic] = useState(_isDynamic === 'dynamic')

  const [newTag, setNewTag] = useState('')
  const [newTagStatus, setNewTagStatus] = useState(false)
  const [search, setSearch] = useState('')

  const filterTags = useMemo(() => {
    if (search === '') return tagsList
    return tagsList.filter(
      i =>
        i.label.toUpperCase().includes(search.toUpperCase()) ||
        i.key.toUpperCase().includes(search.toUpperCase())
    )
  }, [search, tagsList])

  const contentHeight = useMemo(
    () => height - HeaderHeight - MainPadding * 2,
    [height]
  )

  const inputNewTag = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value
    if (tagsList.some(i => i.key.toLowerCase() === v.toLowerCase()))
      setNewTagStatus(true)
    else setNewTagStatus(false)
    setNewTag(v)
  }

  const addNewTag = () => {
    if (newTagStatus) return
    setTagsList([
      { key: newTag, label: newTag, checked: true, count: 0 },
      ...tagsList,
    ])
    setNewTag('')
  }

  const saveData = async () => {
    const filteredTag = tagsList.filter(i => i.checked).map(i => i.key)
    const data = {
      data: {
        ...metaData.data,
        game_name: gameName.trim(),
        game_url: gameUrl.trim(),
        tags: filteredTag,
        author: author.trim(),
        author_from: authorFrom.trim(),
        isDynamic: isDynamic ? 'dynamic' : 'static',
        isCensored: isUncensored ? 'uncensored' : 'censored',
      },
      cover: coverUrl,
    }

    await axios.post('/api/save_game', data)
    await updateGameList()
    router.push('/game')
  }

  return (
    <Grid p={0} m={0}>
      <Grid.Col span={5} h={contentHeight}>
        {gameUrl ? (
          <iframe src={gameUrl} width="100%" height={contentHeight} />
        ) : (
          <Card withBorder h={contentHeight}>
            <Center h="100%">
              <Text>請填入遊戲的網址</Text>
            </Center>
          </Card>
        )}
      </Grid.Col>
      <Grid.Col span={7}>
        <Stack>
          <ScrollArea offsetScrollbars="y" type="hover" h={contentHeight - 50}>
            <Stack gap="sm">
              <TextInput
                label="遊戲網址"
                onChange={e => setGameUrl(e.currentTarget.value)}
                value={gameUrl}
              />
              <TextInput
                placeholder={coverName ? '封面已存在' : ''}
                disabled={!!coverName}
                label="封面網址"
                onChange={e => setCoverUrl(e.currentTarget.value)}
                value={coverUrl}
              />

              <TextInput
                label="遊戲名稱"
                onChange={e => setGameName(e.currentTarget.value)}
                value={gameName}
              />
              <Autocomplete
                data={uniq(list.map(i => i.data.author).filter(i => !!i))}
                label="作者"
                placeholder="選擇或新增作者"
                value={author}
                onChange={v => setAuthor(v)}
              />
              <Autocomplete
                data={uniq(list.map(i => i.data.author_from).filter(i => !!i))}
                label="產地"
                placeholder="選擇或新增產地"
                value={authorFrom}
                onChange={v => setAuthorFrom(v)}
              />
              <Switch
                label={isUncensored ? '無碼' : '有碼'}
                checked={isUncensored}
                onChange={e => setIsUncensored(e.currentTarget.checked)}
              />
              <Switch
                label={isDynamic ? '動態' : '靜態'}
                checked={isDynamic}
                onChange={e => setIsDynamic(e.currentTarget.checked)}
              />

              <Accordion multiple variant="contained" defaultValue={['tags']}>
                <Accordion.Item value="tags">
                  <Accordion.Control>標籤</Accordion.Control>
                  <Accordion.Panel>
                    <Stack>
                      <TextInput
                        placeholder="搜尋標籤"
                        value={search}
                        onChange={e => setSearch(e.currentTarget.value)}
                      />

                      <Flex align="center" gap="sm">
                        <Popover
                          position="top"
                          withArrow
                          shadow="md"
                          opened={newTagStatus}
                        >
                          <Popover.Target>
                            <TextInput
                              placeholder="新增標籤(英文)"
                              onChange={inputNewTag}
                              value={newTag}
                            />
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Text size="xs">標籤名稱重複</Text>
                          </Popover.Dropdown>
                        </Popover>
                        <ActionIcon variant="outline" onClick={addNewTag}>
                          <IconPlus
                            style={{ width: '70%', height: '70%' }}
                            stroke={1.5}
                          />
                        </ActionIcon>
                      </Flex>
                      <GroupedFilterContainer
                        list={filterTags}
                        setList={(val: string) => {
                          setTagsList(prev =>
                            prev.map(i =>
                              i.key === val ? { ...i, checked: !i.checked } : i
                            )
                          )
                        }}
                      />
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </Stack>
          </ScrollArea>
          <Group>
            <Button variant="outline" onClick={saveData}>
              儲存
            </Button>
            <OpenFolderBtn folderPath={folder_path} flex={1} />
          </Group>
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
