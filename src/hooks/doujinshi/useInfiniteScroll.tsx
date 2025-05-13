import { maxDoujinshiPagesLength } from '@/constants'
import { useEffect, useRef, useState } from 'react'

const count = (target: number, ref: any[]) => {
  return target > ref.length ? ref.length : target < 0 ? 0 : target
}

export const useInfiniteScroll = (
  pages: IImageData[] | undefined,
  curLabelIdx: number | undefined
) => {
  const loaderRef = useRef<HTMLDivElement[]>([])
  const [loaded, setLoaded] = useState(false)
  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(0)
  const [visibleData, setVisibleData] = useState<IImageData[]>([])
  //   console.log('page', pages, start, end)

  useEffect(() => {
    if (!pages || !curLabelIdx || loaded) return
    setStart(count(curLabelIdx - maxDoujinshiPagesLength / 2, pages))
    setEnd(count(curLabelIdx + maxDoujinshiPagesLength / 2, pages))
    setLoaded(true)
  }, [pages, curLabelIdx, loaded])

  useEffect(() => {
    if (!pages) return
    console.log('loop')
    console.log(start, end, 'start end')

    setVisibleData(pages.slice(start, end))
  }, [end, pages, start])

  useEffect(() => {
    if (!pages) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const type = entry.target.getAttribute('id')
        if (type === 'up') {
          setStart(prev => count(prev - maxDoujinshiPagesLength, pages))
        } else if (type === 'down') {
          setEnd(prev => count(prev + maxDoujinshiPagesLength, pages))
        }
      }
    })

    if (loaderRef.current) {
      loaderRef.current.forEach(el => {
        observer.observe(el)
      })
    }

    return () => observer.disconnect()
  }, [pages])

  return {
    visibleData,
    loaderRef,
  }
}
