import { maxDoujinshiPagesLength } from '@/constants'
import { useEffect, useRef, useState } from 'react'

export const useFetchInfiniteImages = (pages: IImageData[] | undefined) => {
  const loaderRef = useRef<HTMLDivElement>(null)
  const [visibleData, setVisibleData] = useState<IImageData[] | undefined>(
    undefined
  )

  // 初始化先載入一批圖片
  useEffect(() => {
    if (!pages) return
    setVisibleData(pages.slice(0, maxDoujinshiPagesLength))
  }, [pages])

  useEffect(() => {
    if (!pages || !visibleData) return

    const loadMore = (start: number, end: number) => {
      if (!pages) return
      setVisibleData(prev => {
        if (!prev) return
        const nextImages = pages.slice(start, end)
        return [...prev, ...nextImages]
      })
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore(
            visibleData.length,
            visibleData.length + maxDoujinshiPagesLength
          )
        }
      },
      { threshold: 0.1 }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    if (loaderRef.current && visibleData.length >= pages.length) {
      observer.unobserve(loaderRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [pages, visibleData])

  return { visibleData, loaderRef }
}
