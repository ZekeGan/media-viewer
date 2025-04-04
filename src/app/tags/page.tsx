'use client'

import { useMainData } from '@/context/mainContext'
import { Autocomplete, Button, Divider, Flex, Grid, Input, Text, Title } from '@mantine/core'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

export default function Page() {
  const router = useRouter()
  const { gameList, tags, system, updateSystemData } = useMainData()
  const { setValue, control, handleSubmit } = useForm<ISystem['tags']>()

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
        if (!(d in tags)) {
          setValue(d, data)
          return data
        }
        data = { ...tags[d], _key: d }
        setValue(d, data)
        return data
      })
      .sort((a, b) => (a.parent === b.parent ? 0 : a.parent > b.parent ? -1 : 1))
  }, [gameList])

  const parents = useMemo(() => {
    const set = new Set<string>()
    Object.keys(tags).map(k => set.add(tags[k].parent))
    return Array.from(set)
  }, [tags])

  const saveTags = handleSubmit(async d => {
    await axios.post('/api/tags', { tags: d, system })
    await updateSystemData()
    router.push('/')
  })

  return (
    <div>
      <Flex justify="end">
        <Button onClick={saveTags}>儲存</Button>
      </Flex>
      <Divider my="md" size="md" />
      <Flex direction="column">
        <Grid align="center" p="sm">
          <Grid.Col span={2}>
            <Title order={4}>Tag Key</Title>
          </Grid.Col>
          <Grid.Col span={2}>
            <Title order={4}>父層名稱</Title>
          </Grid.Col>
          <Grid.Col span={2}>
            <Title order={4}>中文名稱</Title>
          </Grid.Col>
        </Grid>
        {allGameTags.map((d, idx) => (
          <Grid key={d._key} align="center" bg={idx % 2 === 0 ? '#eee' : ''} p="sm">
            <Grid.Col span={2}>
              <Text>{d._key}</Text>
            </Grid.Col>
            <Grid.Col span={2}>
              <Controller
                name={`${d._key}.parent`}
                control={control}
                render={({ field }) => <Autocomplete {...field} data={parents} />}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <Controller
                name={`${d._key}.tw`}
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </Grid.Col>
          </Grid>
        ))}
      </Flex>
    </div>
  )
}
