'use client'

import { useEffect } from 'react'
import {
  Anchor,
  Box,
  Breadcrumbs,
  Card,
  Center,
  Flex,
  Paper,
  SimpleGrid,
  Skeleton,
  Text,
} from '@mantine/core'
import { IconChevronRight, IconHome } from '@tabler/icons-react'
import MainLayout from '@/layout/MainLayout'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { ObserverImg } from '@/components/ObserverImg'
import { useFetchInfiniteImages } from '@/hooks/doujinshi/useFetchInfiniteImages'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'
import { getLabels } from '@/utils/doujinshiUtils'

export default function DetailPage() {
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const detailCountPerRows = useDoujinshiStore(s => s.detailCountPerRows)
  const { visibleData, loaderRef } = useFetchInfiniteImages()
  const { goTo, setHash } = useGoTo()

  const goToPage = (label: string) => {
    if (!curDoujinshi) return
    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount: pageCount,
      curLabel: label,
    }).labels
    goTo(labels)
  }

  const items = [
    { title: <IconHome />, href: '/' },
    { title: '同人誌', href: '/doujinshi' },
  ]
    .map((item, index) => (
      <Anchor href={item.href} key={index} c="gray">
        {item.title}
      </Anchor>
    ))
    .concat(<Text key="current">{curDoujinshi?.data.title}</Text>)

  useEffect(() => {
    setCurPageLabel('')
    setHash('')
  }, [setCurPageLabel, setHash])

  return (
    <MainLayout>
      <Center>
        <Flex miw={600} w={1200} direction="column" gap="xs" my="lg">
          <Breadcrumbs separator={<IconChevronRight />}>{items}</Breadcrumbs>
          <DoujinshiDetailCard doujinshi={curDoujinshi} cardType="single" />
          {!curDoujinshi || !visibleData ? (
            <Skeleton height={500} radius="md" />
          ) : (
            <Card w="100%" shadow="sm" padding="sm" radius="md" withBorder>
              <SimpleGrid cols={detailCountPerRows}>
                {visibleData.map(d => (
                  <Paper
                    key={d.title}
                    withBorder
                    radius="md"
                    onClick={() => goToPage(d.title)}
                    style={{
                      aspectRatio: d.width / d.height,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    <ObserverImg
                      src={getImagePath(curDoujinshi, d.title)}
                      alt={d.title}
                      w={d.width}
                      h={d.height}
                    />
                  </Paper>
                ))}
              </SimpleGrid>
              {visibleData.length !== 0 && <Box ref={loaderRef} />}
            </Card>
          )}
        </Flex>
      </Center>
    </MainLayout>
  )
}
