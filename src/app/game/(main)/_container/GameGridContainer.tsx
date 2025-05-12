import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconSettings } from '@tabler/icons-react'
import {
  ActionIcon,
  Badge,
  Box,
  Card,
  Flex,
  Group,
  Pagination,
  Pill,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  Anchor,
} from '@mantine/core'
import OpenFolderBtn from '@/components/OpenFolderBtn'
import { useTranslate } from '@/hooks/useTranslate'
import { useGameData } from '@/context/gameContext'
import { Img } from '@/components/Img'

const len = 25

const cutString = (v: string) => {
  return v.length > len ? `${v.slice(0, len)}...` : v
}

export default function GameGridContainer() {
  const { tempGameList } = useGameData()
  const router = useRouter()
  const { t } = useTranslate()

  const maxNum = 120
  const [page, setPage] = useState(1)

  const goToEdit = (id: string) => {
    router.push(`/game/edit/${id}`)
  }

  return (
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
            <Card key={id} shadow="sm" padding="sm" radius="md" withBorder>
              <Card.Section>
                <Box
                  component={game_url ? Link : undefined}
                  href={game_url ? game_url : ''}
                  className={game_url && 'hover-box'}
                >
                  <Img
                    src={`/api/image/?path=${encodeURIComponent(`${item.meta.root}/_meta/${item.meta.coverName}`)}`}
                    h={{ md: 300, lg: 230, xl: 200 }}
                    alt={game_name}
                  />
                </Box>
              </Card.Section>

              <Stack gap="xs" mb="xl" mt="xs">
                {game_name.length > len ? (
                  <Tooltip label={game_name} openDelay={300}>
                    {GameName}
                  </Tooltip>
                ) : (
                  GameName
                )}

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
                    <Pill key={i}>{t(i)}</Pill>
                  ))}
                </Flex>

                <Group justify="space-between" gap="sm">
                  <OpenFolderBtn flex={1} folderPath={folder_path} />
                  <ActionIcon
                    size="lg"
                    variant="outline"
                    onClick={() => goToEdit(id)}
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
      {/* <Pagination
        total={Math.ceil(tempGameList.length / maxNum)}
        value={page}
        onChange={setPage}
        mt="sm"
      /> */}
    </Stack>
  )
}
