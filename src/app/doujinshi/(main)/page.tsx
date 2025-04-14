'use client'

import { useMainData } from '@/context/mainContext'
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Flex,
  Grid,
  Group,
  Image,
  Pill,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import { Fragment } from 'react'
import Link from 'next/link'

export default function EditPage() {
  const { doujinshiList } = useMainData()

  return (
    <Grid>
      <Grid.Col span={12}>
        <Divider mb="md" size="md" label={`總數量 ${doujinshiList.length} 個`} />
        <Stack>
          <Flex justify="space-between">
            <Group gap="sm">
              {/* <Text>排序方式</Text> */}
              {/* <Select
                checkIconPosition="right"
                defaultValue={orderBy}
                onSearchChange={onSelectChange}
                data={OrderSelectConfig}
                allowDeselect={false}
              /> */}
            </Group>
          </Flex>

          <Stack>
            <SimpleGrid cols={{ base: 1 }}>
              {doujinshiList.map(item => {
                const {
                  data: { id, name, male, female, artist, group, misc, page, type },
                  cover,
                } = item

                const detail = [
                  { title: 'Group', data: group },
                  { title: 'Artist', data: artist },
                  { title: 'Male', data: male },
                  { title: 'Female', data: female },
                  { title: 'Misc', data: misc },
                ]

                return (
                  <Card key={id} shadow="sm" padding="sm" radius="md" withBorder>
                    <Card.Section>
                      <Flex>
                        <Box
                          component={Link}
                          href={`/doujinshi/view/${name}`}
                          className={'hover-box'}
                        >
                          <Image src={cover || noImg.src} h={300} alt={name} />
                        </Box>

                        <Flex
                          direction="column"
                          align="center"
                          justify="space-between"
                          gap="sm"
                          p="sm"
                        >
                          <Badge w="100%" size="lg">
                            {type}
                          </Badge>
                          <Text size="sm">{page} 頁</Text>
                        </Flex>

                        <Divider orientation="vertical" />

                        <Flex p="sm" direction="column" gap="sm" flex={1}>
                          <Title order={5}>{name}</Title>

                          <Grid>
                            {detail.map(d => {
                              if (d.data.length === 0) return
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
                    </Card.Section>
                  </Card>
                )
              })}
            </SimpleGrid>
            {/* <Pagination
              total={Math.ceil(tempGameList.length / maxNum)}
              value={page}
              onChange={setPage}
              mt="sm"
            /> */}
          </Stack>
        </Stack>
      </Grid.Col>
    </Grid>
  )
}
