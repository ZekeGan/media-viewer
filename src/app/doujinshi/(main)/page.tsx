'use client'

import { nanoid } from 'nanoid'
import { Center, Divider, Flex, Stack } from '@mantine/core'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { ContentWidth } from '@/constants/style'
import { useDoujinshi } from '@/context/doujinshiContext'
import LoadingContainer from '@/components/LoadingContainer'

export default function EditPage() {
  const { doujinshiList } = useDoujinshi()

  if (!doujinshiList) return <LoadingContainer />

  return (
    <Flex direction="column">
      <Divider mb="md" size="md" label={`總數量 ${doujinshiList.length} 個`} />
      <Center>
        <Stack w={ContentWidth}>
          {doujinshiList.map(item => (
            <DoujinshiDetailCard key={nanoid()} doujinshi={item} cardType="list" />
          ))}
        </Stack>
      </Center>
    </Flex>
  )
}
