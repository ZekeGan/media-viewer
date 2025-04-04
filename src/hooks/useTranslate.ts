import { useMainData } from '@/context/mainContext'
import { useCallback } from 'react'

export const useTranslate = () => {
  const { system, tags } = useMainData()

  const t = useCallback((k: string) => {
    return tags[k]?.['tw'] || system[k]?.['tw'] || k
  }, [])

  const getParent = useCallback((k: string) => {
    return tags[k]?.['parent'] || '未分類'
  }, [])

  return { t, getParent }
}
