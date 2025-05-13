'use client'

import { ReactNode, useEffect } from 'react'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { useParams } from 'next/navigation'
import { useHash } from '@mantine/hooks'
import { Box } from '@mantine/core'

export default function Layout({ children }: { children: ReactNode }) {
  const params = useParams()
  const [_, setHash] = useHash()
  const doujinshiList = useDoujinshiStore(s => s.doujinshiList)
  const fetchDoujinshiList = useDoujinshiStore(s => s.fetchDoujinshiList)
  const setCurDoujinshi = useDoujinshiStore(s => s.setCurDoujinshi)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const setPagination = useDoujinshiStore(s => s.setPagination)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)

  // 獲取doujinshiList
  useEffect(() => {
    fetchDoujinshiList()
  }, [fetchDoujinshiList])

  // 尋找當前doujinshi
  useEffect(() => {
    if (!params.name) return
    setCurDoujinshi((params.name as string) ?? '')
  }, [doujinshiList, params.name, setCurDoujinshi])

  // 監聽hash
  useEffect(() => {
    const syncFromHash = () => {
      if (!curPageLabel) {
        const hash = window.location.hash
        setCurPageLabel(hash.slice(1))
      } else {
        setHash(curPageLabel)
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [setCurPageLabel, curPageLabel, setHash])

  // 更新pagination
  useEffect(() => {
    if (!curDoujinshi) return
    console.log(pageCount)

    setPagination(curDoujinshi, curPageLabel, pageCount)
  }, [curDoujinshi, curPageLabel, pageCount, setPagination])

  return <Box>{children}</Box>
}
