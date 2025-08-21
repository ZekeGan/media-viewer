'use client'

import { ReactNode, useEffect } from 'react'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function Layout({ children }: { children: ReactNode }) {
  const fetchDoujinshiList = useDoujinshiStore(s => s.fetchDoujinshiList)

  // 獲取doujinshiList
  useEffect(() => {
    fetchDoujinshiList()
  }, [fetchDoujinshiList])

  return children
}
