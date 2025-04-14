import { useEffect } from 'react'
import { Accordion, Stack } from '@mantine/core'
import { FilterContainer, GroupedFilterContainer } from '@/components/FilterContainer'
import { useCheckData } from '@/hooks/useCheckData'
import { useMainData } from '@/context/mainContext'
import { useSearchParamsFns } from '@/hooks/useSearchParamsFns'
import { defaultGameListOrder } from '@/constants'

export default function FilterListContainer() {
  const { gameList, setTempGameList } = useMainData()

  const { queryString, getParamsList } = useSearchParamsFns()

  const {
    checkedList: censoredList,
    setList: setCensoredList,
    filter: censoredFilter,
  } = useCheckData(
    'censored',
    gameList.map(i => i.data.isCensored)
  )

  const {
    checkedList: dynamicList,
    setList: setDynamicList,
    filter: dynamicFilter,
  } = useCheckData(
    'dynamic',
    gameList.map(i => i.data.isDynamic)
  )

  const {
    checkedList: authorList,
    setList: setAuthorList,
    filter: authorFilter,
  } = useCheckData(
    'author',
    gameList.map(i => i.data.author)
  )

  const {
    checkedList: authorFromList,
    setList: setAuthorFromList,
    filter: authorFromFilter,
  } = useCheckData(
    'author_from',
    gameList.map(i => i.data.author_from)
  )

  const {
    checkedList: tagsList,
    setList: setTagsList,
    arrayFilter: tagsArrayFilter,
  } = useCheckData('tags', gameList.map(i => i.data.tags.map(j => j)).flat())

  useEffect(() => {
    const orderList = getParamsList('order')
    const order = (
      orderList.length === 0 ? [defaultGameListOrder] : orderList
    ) as (keyof IGameData)[]
    let resultList: IGameMeta[] = gameList

    resultList = censoredFilter(resultList, ['data', 'isCensored'])
    resultList = dynamicFilter(resultList, ['data', 'isDynamic'])
    resultList = authorFilter(resultList, ['data', 'author'])
    resultList = authorFromFilter(resultList, ['data', 'author_from'])
    resultList = tagsArrayFilter(resultList, ['data', 'tags'])

    resultList = resultList.sort((a, b) => {
      const A = (a.data[order[0]] as string).toLowerCase()
      const B = (b.data[order[0]] as string).toLowerCase()
      return A < B ? -1 : A > B ? 1 : 0
    })
    setTempGameList(resultList)
  }, [
    authorFilter,
    authorFromFilter,
    censoredFilter,
    dynamicFilter,
    gameList,
    getParamsList,
    queryString,
    setTempGameList,
    tagsArrayFilter,
  ])

  const filterConfig = [
    {
      key: 'censored',
      isOpen: censoredList.some(i => i.checked),
      label: '有無碼',
      list: censoredList,
      setList: setCensoredList,
      isGroup: false,
    },
    {
      key: 'dynamic',
      isOpen: dynamicList.some(i => i.checked),
      label: '是否動態',
      list: dynamicList,
      setList: setDynamicList,
      isGroup: false,
    },
    {
      key: 'author',
      isOpen: authorList.some(i => i.checked),
      label: '作者',
      list: authorList,
      setList: setAuthorList,
      isGroup: false,
    },
    {
      key: 'author_from',
      isOpen: authorFromList.some(i => i.checked),
      label: '產地',
      list: authorFromList,
      setList: setAuthorFromList,
      isGroup: false,
    },
    {
      key: 'tags',
      isOpen: tagsList.some(i => i.checked),
      label: '標籤',
      list: tagsList,
      setList: setTagsList,
      isGroup: true,
    },
  ]

  return (
    <Stack>
      <Accordion
        multiple
        variant="contained"
        defaultValue={filterConfig.filter(i => i.isOpen).map(i => i.key)}
      >
        {filterConfig.map(i => (
          <Accordion.Item key={i.key} value={i.key}>
            <Accordion.Control>{i.label}</Accordion.Control>
            <Accordion.Panel>
              {i.isGroup ? (
                <GroupedFilterContainer list={i.list} setList={i.setList} withCount />
              ) : (
                <FilterContainer list={i.list} setList={i.setList} withCount />
              )}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  )
}
