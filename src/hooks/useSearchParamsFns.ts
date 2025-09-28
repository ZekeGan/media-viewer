import { useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const useSearchParamsFns = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryString = useMemo(() => searchParams.toString(), [searchParams])

  const getParamsList = useCallback(
    (key: string) => {
      const tagsParams = searchParams.get(key)
      if (tagsParams) return tagsParams.split(',')
      return []
    },
    [searchParams]
  )

  const updateQueryString = useCallback(
    (key: string, value: string) => {
      const currentParams = new URLSearchParams(queryString)
      if (!value) currentParams.delete(key)
      else currentParams.set(key, value)

      const str = currentParams.toString()
      console.log('go')

      router.push(str.endsWith('=') ? '/' : `?${str}`)
    },
    [queryString, router]
  )

  return { queryString, getParamsList, updateQueryString }
}
