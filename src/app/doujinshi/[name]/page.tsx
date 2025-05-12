'use client'

import { Box, Card, Center, Flex, SimpleGrid, Skeleton } from '@mantine/core'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { useDoujinshi } from '@/context/doujinshiContext'
import { ObserverImg } from '@/components/ObserverImg'
import { useFetchInfiniteImages } from '@/hooks/useFetchInfiniteImages'
import { getImagePath } from '@/utils'

export default function EditPage() {
  const { curDoujinshi, goToSpecificPage, pagination } = useDoujinshi()
  const { visibleData, loaderRef } = useFetchInfiniteImages(
    curDoujinshi?.meta.pages
  )
  console.log('detail page', pagination)

  return (
    <Center>
      <Flex miw={600} w={1200} direction="column" gap="md">
        <DoujinshiDetailCard doujinshi={curDoujinshi} cardType="single" />
        {!curDoujinshi || !visibleData ? (
          <Skeleton height={500} radius="md" />
        ) : (
          <Card w="100%" shadow="sm" padding="sm" radius="md" withBorder>
            <SimpleGrid cols={5}>
              {visibleData.map(d => (
                <Box
                  key={d.title}
                  style={{ cursor: 'pointer' }}
                  onClick={() => goToSpecificPage(d.title)}
                >
                  <ObserverImg
                    src={getImagePath(curDoujinshi, d.title)}
                    alt={d.title}
                    w={d.width}
                    h={d.height}
                  />
                </Box>
              ))}
            </SimpleGrid>
            {visibleData.length !== 0 && <Box ref={loaderRef} />}
          </Card>
        )}
      </Flex>
    </Center>
  )
}
