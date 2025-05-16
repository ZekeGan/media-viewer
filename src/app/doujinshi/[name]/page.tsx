'use client'

import {
  Box,
  Card,
  Center,
  Flex,
  Paper,
  SimpleGrid,
  Skeleton,
} from '@mantine/core'
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
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)
  const { visibleData, loaderRef } = useFetchInfiniteImages()
  const { goToSpecificPage } = useGoTo()

  const goToPage = (label: string) => {
    if (!curDoujinshi) return
    console.log(label, 'goto')

    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount: pageCount,
      curLabel: label,
    }).labels
    setCurPageLabel(labels)
    goToSpecificPage(labels)
  }

  return (
    <MainLayout>
      <Center>
        <Flex miw={600} w={1200} direction="column" gap="md">
          <DoujinshiDetailCard doujinshi={curDoujinshi} cardType="single" />
          {!curDoujinshi || !visibleData ? (
            <Skeleton height={500} radius="md" />
          ) : (
            <Card w="100%" shadow="sm" padding="sm" radius="md" withBorder>
              <SimpleGrid cols={5}>
                {visibleData.map(d => (
                  <Paper
                    withBorder
                    radius="md"
                    key={d.title}
                    style={{
                      aspectRatio: d.width / d.height,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onClick={() => goToPage(d.title)}
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
