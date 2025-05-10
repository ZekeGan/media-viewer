import {
  Badge,
  Card,
  Center,
  DefaultMantineColor,
  Divider,
  Flex,
  Grid,
  Pill,
  Skeleton,
  Text,
  Title,
} from '@mantine/core'
import Link from 'next/link'
import { Fragment } from 'react'
import { Img } from './Img'

export default function DoujinshiDetailCard({
  doujinshi,
  cardType,
}: {
  doujinshi: IDoujinshiMeta | undefined
  cardType: 'list' | 'single'
}) {
  if (!doujinshi) return <Skeleton height={200} radius="md" />

  const {
    data: { id, title, male, female, misc, groups, language, artists, types, pages, charactors },
  } = doujinshi

  const props = {
    list: { imageWRatio: '25%' },
    single: { imageWRatio: { base: '60%', md: '50%', lg: '40%' } },
  }[cardType]

  const detail = [
    { title: 'Language', data: language },
    { title: 'Group', data: groups },
    { title: 'Artist', data: artists },
    { title: 'Male', data: male },
    { title: 'Female', data: female },
    { title: 'Charactors', data: charactors },
    { title: 'Misc', data: misc },
  ]

  const typesColor: Record<IDoujinshiData['types'], DefaultMantineColor> = {
    doujinshi: 'blue',
    manga: 'orange',
    artistcg: 'yellow',
    gamecg: 'green',
  }

  return (
    <Card key={id} shadow="sm" p={0} radius="md" withBorder>
      <Flex flex={1}>
        <Center
          w={props.imageWRatio}
          p="sm"
          component={cardType === 'list' ? Link : undefined}
          className={cardType === 'list' ? 'hover-box' : undefined}
          href={`/doujinshi/${encodeURIComponent(title)}`}
        >
          <Img
            w="100%"
            h="100%"
            fit="contain"
            src={`/api/image/?path=${encodeURIComponent(`${doujinshi.meta.root}/_meta/${doujinshi.meta.coverName}`)}`}
            alt={title}
          />
        </Center>

        <Divider orientation="vertical" />

        <Flex flex={1} p="sm" direction="column" gap="sm">
          <Grid>
            <Grid.Col span={2}>
              <Badge size="lg" radius="sm" color={typesColor[types.toLocaleLowerCase()]}>
                {types}
              </Badge>
            </Grid.Col>
            <Grid.Col span={10}>
              <Title order={5}>{title}</Title>
            </Grid.Col>

            <Grid.Col span={2}>
              <Text size="sm">Pages</Text>
            </Grid.Col>
            <Grid.Col span={10}>
              <Text size="sm" pl={5}>
                {pages.length} 頁
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
                    <Flex flex={1} wrap="wrap" gap="sm">
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
