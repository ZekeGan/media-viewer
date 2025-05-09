import {
  Badge,
  Box,
  Card,
  Center,
  Divider,
  Flex,
  Grid,
  Image,
  Paper,
  Pill,
  Text,
  Title,
} from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import Link from 'next/link'
import { Fragment } from 'react'
import { Img } from './Img'

export default function DoujinshiDetailCard({
  item,
  cardType,
}: {
  item: IDoujinshiMeta
  cardType: 'list' | 'single'
}) {
  const {
    data: { id, name, male, female, artist, group, misc, page, type },
  } = item

  const props = {
    list: { imageWRatio: '25%' },
    single: { imageWRatio: { base: '60%', md: '50%', lg: '40%' } },
  }[cardType]

  const detail = [
    { title: 'Group', data: group },
    { title: 'Artist', data: artist },
    { title: 'Male', data: male },
    { title: 'Female', data: female },
    { title: 'Misc', data: misc },
  ]

  return (
    <Card key={id} shadow="sm" p={0} radius="md" withBorder>
      <Flex flex={1}>
        <Center
          w={props.imageWRatio}
          p="sm"
          component={cardType === 'list' ? Link : undefined}
          className={cardType === 'list' ? 'hover-box' : undefined}
          href={`/doujinshi/${encodeURIComponent(name)}`}
        >
          <Img
            w="100%"
            h="100%"
            fit="contain"
            src={`/api/image/?path=${encodeURIComponent(`${item.meta.root}/_meta/${item.meta.coverName}`)}`}
            alt={name}
          />
        </Center>

        <Divider orientation="vertical" />

        <Flex flex={1} p="sm" direction="column" gap="sm">
          <Grid>
            <Grid.Col span={2}>
              <Badge size="lg" radius="sm">
                {type}
              </Badge>
            </Grid.Col>
            <Grid.Col span={10}>
              <Title order={5}>{name}</Title>
            </Grid.Col>

            <Grid.Col span={2}>
              <Text size="sm">Pages</Text>
            </Grid.Col>
            <Grid.Col span={10}>
              <Text size="sm" pl={5}>
                {page.length} 頁
              </Text>
            </Grid.Col>

            {detail.map(d => {
              if (d.data.length === 0) return null
              return (
                <Fragment key={d.title}>
                  <Grid.Col span={2}>
                    <Text size="sm">{d.title}</Text>
                  </Grid.Col>
                  <Grid.Col span={10}>
                    <Flex gap="sm">
                      {d.data.map(d => (
                        <Pill key={d}>{d}</Pill>
                      ))}
                    </Flex>
                  </Grid.Col>
                </Fragment>
              )
            })}
          </Grid>
        </Flex>
      </Flex>
    </Card>
  )
}
