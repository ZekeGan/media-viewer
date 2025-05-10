import { maxDoujinshiPagesLength } from '@/constants'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { useEffect, useLayoutEffect, useState } from 'react'

type IImagessList = { label: string; imageUrl: string }[] | undefined

// 獲取當前doujinshi圖片資源
export const useImagessList = (curDoujinshi: IDoujinshiMeta | undefined) => {
  const searchParams = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const [imageList, setImageList] = useState<IImagessList>(undefined)

  useLayoutEffect(() => {
    async function fetchAllImage() {
      if (!curDoujinshi) return

      const images = await Promise.all(
        curDoujinshi.data.pages
          .slice(maxDoujinshiPagesLength * (page - 1), maxDoujinshiPagesLength * page)
          .map(async d => {
            const buffer = await axios.get(
              `/api/image?path=${encodeURIComponent(`${curDoujinshi.meta.root}/${d}`)}`,
              { responseType: 'blob' }
            )
            return {
              label: d,
              imageUrl: URL.createObjectURL(buffer.data),
            }
          })
      )
      setImageList(images)
    }

    setImageList(undefined)
    fetchAllImage()
  }, [curDoujinshi, page])

  return {
    imageList,
  }
}
