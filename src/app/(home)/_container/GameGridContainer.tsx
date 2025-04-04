import { useEffect, useState } from 'react'
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
  Image,
  Pagination,
  Pill,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  Anchor,
} from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import OpenFolderBtn from '@/components/OpenFolderBtn'
import { useTranslate } from '@/hooks/useTranslate'
import { useMainData } from '@/context/mainContext'

const len = 25

const cutString = (v: string) => {
  return v.length > len ? `${v.slice(0, len)}...` : v
}

export default function GameGridContainer() {
  const { _list } = useMainData()
  const router = useRouter()
  const { t } = useTranslate()

  const maxNum = 120
  const [page, setPage] = useState(1)

  const goToEdit = (id: string) => {
    router.push(`/edit/${id}`)
  }

  return (
    <Stack>
      <SimpleGrid cols={{ md: 2, lg: 4, xl: 6 }}>
        {_list.slice((page - 1) * maxNum, page * maxNum).map(item => {
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
            cover,
          } = item

          const GameName = (
            <Text
              component={game_url ? Link : undefined}
              href={game_url ?? undefined}
              fw="bold"
              size="md"
              c={game_url ? 'blue.8' : 'gray.9'}
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
                  <Image
                    src={cover || noImg.src}
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
                  <Text size="xs" c="gray.5">
                    {author_from}
                  </Text>
                  <Anchor size="sm" c="dark" href={`/?author=${author}`}>
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
                  <ActionIcon size="lg" variant="outline" onClick={() => goToEdit(id)}>
                    <IconSettings style={{ width: '70%', height: '70%' }} stroke={1.5} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          )
        })}
      </SimpleGrid>
      <Pagination
        total={Math.ceil(_list.length / maxNum)}
        value={page}
        onChange={setPage}
        mt="sm"
      />
    </Stack>
  )
}
