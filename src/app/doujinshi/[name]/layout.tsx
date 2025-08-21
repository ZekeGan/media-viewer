'use client'

import { ReactNode, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Box } from '@mantine/core'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function Layout({ children }: { children: ReactNode }) {
  const params = useParams()
  const doujinshiList = useDoujinshiStore(s => s.doujinshiList)
  const setCurDoujinshi = useDoujinshiStore(s => s.setCurDoujinshi)

  // 尋找當前doujinshi
  useEffect(() => {
    if (!params.name) return
    setCurDoujinshi((params.name as string) ?? '')
  }, [doujinshiList, params.name, setCurDoujinshi])

  return children
}
