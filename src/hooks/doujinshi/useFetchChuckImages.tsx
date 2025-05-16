import { useEffect, useState } from 'react'
import axios from 'axios'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'

/**
 * 根據當前index往前後載入輸入單位的資料
 * @param curDoujinshi
 * @param pagination
 * @param offset
 * @returns
 */
export default function useFetchChuckImages(offset: number = 5) {
  const doujin = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const [loaded, setLoaded] = useState(false)
  const [imagesList, setImageList] = useState<
    (IImageData & { imageUrl: string | undefined })[] | undefined
  >(undefined)

  // 初始化imageList
  useEffect(() => {
    if (!doujin) return
    setImageList(
      doujin.meta.pages.map(d => ({
        ...d,
        imageUrl: undefined,
      }))
    )
    setLoaded(true)
  }, [doujin])

  useEffect(() => {
    if (!doujin || !imagesList) return
    const curIdx = doujin.meta.pages.findIndex(
      d => d.title === curPageLabel.split('-')[0]
    )

    const fetchImages = async () => {
      try {
        const images = await Promise.all(
          imagesList.map(async (d, idx) => {
            if (curIdx + offset < idx || idx < curIdx - offset) return d
            if (d.imageUrl) return d

            const res = await axios.get(getImagePath(doujin, d.title), {
              responseType: 'blob',
            })

            return {
              ...d,
              imageUrl: URL.createObjectURL(res.data),
            }
          })
        )
        setImageList(images)
      } catch (err) {
        console.error('圖片載入失敗', err)
      }
    }

    fetchImages()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curPageLabel, doujin, loaded])

  return { imagesList }
}
