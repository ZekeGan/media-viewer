'use client'

import { Box, Card, Center, Flex, Pagination, SimpleGrid, Skeleton, Tooltip } from '@mantine/core'
import noImg from '@/assets/no-image.jpg'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { Img } from '@/components/Img'
import { useDoujinshi } from '@/context/doujinshiContext'
import { useEffect, useState } from 'react'
import LoadingContainer from '@/components/LoadingContainer'
import { maxDoujinshiPagesLength } from '@/constants'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export default function EditPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { curDoujinshi, goToSpecificPage, imageList } = useDoujinshi()
  const [activePage, setPage] = useState(1)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    if (searchParams.get('page')) {
      router.replace(pathname)
    }

    if (activePage > 1) {
      params.set('page', activePage.toString())
      router.replace(`${pathname}?${params.toString()}`)
    }
  }, [activePage, pathname, router, searchParams])

  const ImageListContainer = () => {
    if (!curDoujinshi || !imageList) return <Skeleton height={500} radius="md" />

    return (
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
        {curDoujinshi.data.pages.length > maxDoujinshiPagesLength && (
          <Center>
            <Pagination
              total={Math.floor(curDoujinshi.data.pages.length / maxDoujinshiPagesLength)}
              value={activePage}
              onChange={setPage}
              mt="lg"
            />
          </Center>
        )}
      </Card>
    )
  }

  return (
    <Center>
      <Flex miw={600} w={1200} direction="column" gap="md">
        <DoujinshiDetailCard doujinshi={curDoujinshi} cardType="single" />
        <ImageListContainer />
      </Flex>
    </Center>
  )
}
