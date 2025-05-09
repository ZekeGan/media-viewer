'use client'

import { useMainData } from '@/context/mainContext'
import { Center, Divider, Flex, Stack } from '@mantine/core'
import DoujinshiDetailCard from '@/components/DoujinshiDetailCard'
import { nanoid } from 'nanoid'
import { ContentWidth } from '@/constants/style'

export default function EditPage() {
  const { doujinshiList } = useMainData()

  return (
    <Flex direction="column">
      <Divider mb="md" size="md" label={`總數量 ${doujinshiList.length} 個`} />
      <Center>
        <Stack w={ContentWidth}>
          {doujinshiList.map(item => (
            <DoujinshiDetailCard key={nanoid()} item={item} cardType="list" />
          ))}
        </Stack>
      </Center>
    </Flex>
  )
}
