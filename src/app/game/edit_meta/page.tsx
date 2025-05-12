'use client'

import { useGameData } from '@/context/gameContext'
import {
  Autocomplete,
  Button,
  Divider,
  Flex,
  Grid,
  Input,
  Text,
  Title,
} from '@mantine/core'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

export default function Page() {
  const router = useRouter()
  const { gameList, gameTags, gameParent, updateSystemData } = useGameData()
  const {
    getValues: tagsGetValue,
    setValue: tagsSetValue,
    control: tagsControl,
  } = useForm<ISystem['game_tags']>()
  const {
    getValues: parentGetValue,
    setValue: parentSetValue,
    control: parentControl,
  } = useForm<ISystem['game_parent']>()

  const parents = useMemo(() => {
    const set = new Set<string>()
    Object.keys(gameTags).map(k => set.add(gameTags[k].parent))
    return Array.from(set)
  }, [gameTags])

  const allGameTags = useMemo(() => {
    const set = new Set<string>()

    gameList.forEach(d => {
      d.data.tags.forEach(tag => {
        set.add(tag)
      })
    })

    return Array.from(set)
      .map(d => {
        let data = { _key: d, tw: '', parent: '' }
        if (!(d in gameTags)) {
          tagsSetValue(d, data)
          return data
        }
        data = { ...gameTags[d], _key: d }
        tagsSetValue(d, data)
        return data
      })
      .sort((a, b) =>
        a.parent === b.parent ? 0 : a.parent > b.parent ? -1 : 1
      )
  }, [gameList, gameTags, tagsSetValue])

  const allGameParent = useMemo(() => {
    return parents.map(d => {
      parentSetValue(d, { tw: gameParent[d].tw })
      return { _key: d, tw: gameParent[d].tw }
    })
  }, [gameParent, parentSetValue, parents])

  const saveTags = async () => {
    let _tags = tagsGetValue()
    let _parent = parentGetValue()

    await axios.post('/api/tags', { game_tags: _tags, game_parent: _parent })
    await updateSystemData()
    router.push('/')
  }

  return (
    <div>
      <Flex justify="end">
        <Button onClick={saveTags}>儲存</Button>
      </Flex>
      <Divider my="md" size="md" />

      <Title order={3} mt="lg">
        遊戲父層
      </Title>
      <Flex direction="column">
        <Grid align="center" p="sm">
          <Grid.Col span={2}>
            <Title order={5}>Tag Key</Title>
          </Grid.Col>
          <Grid.Col span={2}>
            <Title order={5}>中文名稱</Title>
          </Grid.Col>
        </Grid>
        {allGameParent.map((d, idx) => (
          <Grid
            key={d._key}
            align="center"
            bg={idx % 2 === 0 ? '#eee' : ''}
            p="sm"
          >
            <Grid.Col span={2}>
              <Text>{d._key}</Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Controller
                name={`${d._key}.tw`}
                control={parentControl}
                render={({ field }) => <Input {...field} />}
              />
            </Grid.Col>
          </Grid>
        ))}
      </Flex>

      <Divider />

      <Title order={3} mt="lg">
        遊戲標籤
      </Title>
      <Flex direction="column">
        <Grid align="center" p="sm">
          <Grid.Col span={2}>
            <Title order={5}>Tag Key</Title>
          </Grid.Col>
          <Grid.Col span={2}>
            <Title order={5}>父層名稱</Title>
          </Grid.Col>
          <Grid.Col span={2}>
            <Title order={5}>中文名稱</Title>
          </Grid.Col>
        </Grid>
        {allGameTags.map((d, idx) => (
          <Grid
            key={d._key}
            align="center"
            bg={idx % 2 === 0 ? '#eee' : ''}
            p="sm"
          >
            <Grid.Col span={2}>
              <Text>{d._key}</Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Controller
                name={`${d._key}.parent`}
                control={tagsControl}
                render={({ field }) => (
                  <Autocomplete {...field} data={parents} />
                )}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <Controller
                name={`${d._key}.tw`}
                control={tagsControl}
                render={({ field }) => <Input {...field} />}
              />
            </Grid.Col>
          </Grid>
        ))}
      </Flex>
    </div>
  )
}
