import axios from 'axios'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export const useDoujinshiData = () => {
  const params = useParams()

  const [doujinshiList, setDoujinshiList] = useState<IDoujinshiMeta[] | undefined>()
  const [curDoujinshi, setCurDoujinshi] = useState<IDoujinshiMeta | undefined>()

  // 獲取doujinshiList
  useEffect(() => {
    const fetchDoujinshiList = async () => {
      const res = await axios.get('/api/doujinshi')
      setDoujinshiList(res.data.data)
    }
    fetchDoujinshiList()
  }, [])

  // 尋找當前doujinshi
  useEffect(() => {
    if (!doujinshiList || !params.name) return
    const doujinshiName = decodeURIComponent(params.name as string)
    setCurDoujinshi(doujinshiList.find(d => d.data.title === doujinshiName))

    // return () => {
    //   setCurDoujinshi(undefined)
    // }
  }, [doujinshiList, params.name])

  return { doujinshiList, curDoujinshi }
}
