'use client'

import { Box, Card, Center, Flex, SimpleGrid } from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { Img } from '@/components/Img'
import { useDoujinshi } from '@/context/doujinshiContext'
import { useEffect } from 'react'
import LoadingContainer from '@/components/LoadingContainer'

export default function EditPage() {
  const { curDoujinshi, goToSpecificPage, imageList } = useDoujinshi()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (!curDoujinshi || !imageList) return <LoadingContainer />

  return (
    <Center>
      <Flex miw={600} w={1200} direction="column" gap="md">
        <DoujinshiDetailCard item={curDoujinshi} cardType="single" />

        <Card w="100%" shadow="sm" padding="sm" radius="md" withBorder>
          <SimpleGrid cols={5}>
            {imageList.map(d => (
              <Box
                key={d.label}
                style={{ cursor: 'pointer' }}
                onClick={() => goToSpecificPage(d.label)}
              >
                <Img
                  src={d.imageUrl}
                  alt={d.label}
                  loading="lazy"
                  onError={e => {
                    e.currentTarget.src = noImg.src
                  }}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Card>
      </Flex>
    </Center>
  )
}
