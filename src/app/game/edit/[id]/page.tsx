'use client'

import { useGameData } from '@/context/gameContext'
import EditCurGameClient from './_client'

export default function EditPage({ params }: { params: { id: string } }) {
  const { gameList } = useGameData()
  const metaData = gameList.find(i => i.data.id === params.id)

  if (!metaData) return <div>Error</div>

  return <EditCurGameClient list={gameList} metaData={metaData} />
}
