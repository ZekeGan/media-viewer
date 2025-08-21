'use client'

import { ReactNode, useEffect } from 'react'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function Layout({ children }: { children: ReactNode }) {
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const setPagination = useDoujinshiStore(s => s.setPagination)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)

  // 更新pagination
  useEffect(() => {
    if (!curDoujinshi) return
    // console.log(pageCount, curPageLabel, 'pagination')
    setPagination(curDoujinshi, curPageLabel, pageCount)
  }, [curDoujinshi, curPageLabel, pageCount, setPagination])

  return children
}
