'use client'

import EditCurGameClient from './_client'
import { useMainData } from '@/context/mainContext'

export default function EditPage({ params }: { params: { id: string } }) {
  const { gameList } = useMainData()
  const metaData = gameList.find(i => i.data.id === params.id)

  if (!metaData) return <div>Error</div>

  return <EditCurGameClient list={gameList} metaData={metaData} />
}
