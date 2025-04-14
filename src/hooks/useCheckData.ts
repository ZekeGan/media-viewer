import { useCallback, useEffect, useMemo, useState } from 'react'
import { path, uniq } from 'ramda'
import { useSearchParamsFns } from './useSearchParamsFns'
import { useTranslate } from './useTranslate'

export const useCheckData = (key: string, list: string[]) => {
  const [flag, setFlag] = useState(false)
  const { t } = useTranslate()
  const { getParamsList, updateQueryString } = useSearchParamsFns()

  const map = new Map(list.map(i => [i, 0]))

  const [_list, setList] = useState<CheckList>(() => {
    const authorParamsList = getParamsList(key)
    list.forEach(i => map.set(i, map.get(i)! + 1))
    return uniq(list.map(i => i)).map(i =>
      authorParamsList.includes(i)
        ? { key: i, label: t(i), checked: true, count: map.get(i)! }
        : { key: i, label: t(i), checked: false, count: map.get(i)! }
    )
  })

  const filterList = useMemo(() => _list.filter(i => i.checked).map(i => i.key), [_list])

  const filter = useCallback(
    <T>(dataList: T[], key: string[]) => {
      if (filterList.length === 0) return dataList
      return dataList.filter(data => filterList.includes(path(key, data) || ''))
    },
    [filterList]
  )

  const arrayFilter = useCallback(
    <T>(dataList: T[], key: string[]) => {
      if (filterList.length === 0) return dataList
      return dataList.filter(data => {
        return filterList.some(i => path<string[]>(key, data)?.includes(i) || false)
      })
    },
    [filterList]
  )

  useEffect(() => {
    if (!flag) {
      setFlag(true)
      return
    }
    updateQueryString(key, filterList.toString())
  }, [filterList, flag, key, updateQueryString])

  return {
    checkedList: _list,
    setList,
    filter,
    arrayFilter,
  }
}
