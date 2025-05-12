import { useGameData } from '@/context/gameContext'
import { useCallback } from 'react'

export const useTranslate = () => {
  const { gameParent, gameTags } = useGameData()

  const t = useCallback(
    (k: string) => {
      return gameTags[k]?.['tw'] || gameParent[k]?.['tw'] || k
    },
    [gameParent, gameTags]
  )

  const getParent = useCallback(
    (k: string) => {
      return gameTags[k]?.['parent'] || '未分類'
    },
    [gameTags]
  )

  return { t, getParent }
}
