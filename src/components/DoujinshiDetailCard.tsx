import { Fragment, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Card,
  Center,
  Divider,
  Flex,
  Grid,
  Highlight,
  Pill,
  Skeleton,
  Text,
  Title,
} from '@mantine/core'
import { doujinshiTypesColor } from '@/constants/style'
import { Img } from './Img'
import OpenFolderBtn from './OpenFolderBtn'

export default function DoujinshiDetailCard({
  doujinshi,
  cardType,
}: {
  doujinshi: IDoujinshiMeta | undefined
  cardType: 'list' | 'single'
}) {
  const router = useRouter()
  const params = useSearchParams()

  const hightlight = useMemo(() => {
    const tags = params.get('tags')
    if (!tags) return []
    return params
      .get('tags')!
      .split(' ')
      .map(d => d.split(':').reverse()[0])
  }, [params])

  if (!doujinshi) return <Skeleton height={200} radius="md" />

  const {
    data: {
      id,
      title,
      male,
      female,
      misc,
      groups,
      language,
      artists,
      series,
      types,
      characters,
    },
    meta: { root, coverName, pages },
  } = doujinshi

  const props = {
    single: { imageWRatio: { base: '60%', md: '50%', lg: '40%' } },
    list: {
      imageWRatio: '25%',
      imageStyle: 'hover-box',
      imageOnClick: () => {
        router.push(`/doujinshi/${encodeURIComponent(title)}`)
      },
    },
  }[cardType]

  const detail: { key: keyof IDoujinshiData; data: string[] }[] = [
    { key: 'language', data: language },
    { key: 'series', data: series },
    { key: 'characters', data: characters },
    { key: 'groups', data: groups },
    { key: 'artists', data: artists },
    { key: 'male', data: male },
    { key: 'female', data: female },
    { key: 'misc', data: misc },
  ]

  const onTagsClick = (key: string, value: string) => {
    const params = new URLSearchParams()
    params.set(key, value)
    router.push(`/doujinshi?tags=${key}:${value}`)
  }

  return (
    <Card key={id} shadow="sm" p={0} radius="md" withBorder>
      <Flex flex={1}>
        <Center
          w={props.imageWRatio}
          p="sm"
          display={{ base: 'none', md: 'flex' }}
        >
          <Box
            className={props.imageStyle}
            onClick={props.imageOnClick}
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
        </Center>

        <Divider
          orientation="vertical"
          display={{ base: 'none', md: 'block' }}
        />

        <Flex flex={1} p="sm" direction="column" gap="sm">
          <Grid>
            <Grid.Col span={3}>
              <Badge
                classNames={{ label: 'capitalize' }}
                size="lg"
                radius="sm"
                color={doujinshiTypesColor[types]}
              >
                {types}
              </Badge>
            </Grid.Col>

            <Grid.Col span={9}>
              <Title order={5}>
                <Highlight inherit highlight={hightlight}>
                  {title}
                </Highlight>
              </Title>
            </Grid.Col>

            <Grid.Col span={3}>
              <Text size="sm">Pages</Text>
            </Grid.Col>

            <Grid.Col span={9}>
              <Flex pl={5}>
                <Text fw="bold" size="sm">
                  {pages.length} 頁
                </Text>
              </Flex>
            </Grid.Col>

            {detail.map(d => {
              if (d.data.length === 0) return null
              return (
                <Fragment key={d.key}>
                  <Grid.Col span={3}>
                    <Text className="capitalize" size="sm">
                      {d.key}
                    </Text>
                  </Grid.Col>

                  <Grid.Col span={9}>
                    <Flex flex={1} wrap="wrap" gap="sm">
                      {d.data.map(t => (
                        <Badge
                          classNames={{ label: 'capitalize' }}
                          key={t}
                          color="dark"
                          autoCapitalize="on"
                          className="hover-box"
                          style={{ cursor: 'pointer' }}
                          onClick={() => onTagsClick(d.key, t)}
                        >
                          <Highlight inherit highlight={hightlight ?? []}>
                            {t}
                          </Highlight>
                        </Badge>
                      ))}
                    </Flex>
                  </Grid.Col>
                </Fragment>
              )
            })}
          </Grid>
          <Flex justify="end" mt="auto">
            <OpenFolderBtn folderPath={root} />
          </Flex>
        </Flex>
      </Flex>
    </Card>
  )
}
