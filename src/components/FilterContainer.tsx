'use client'

import { useTranslate } from '@/hooks/useTranslate'
import { Accordion, Checkbox, Stack, Text } from '@mantine/core'
import { nanoid } from 'nanoid'
import { Dispatch, SetStateAction, useMemo } from 'react'

interface IFilterContainer {
  list: CheckList
  setList: Dispatch<SetStateAction<CheckList>>
  withCount?: boolean
}

export const GroupedFilterContainer = ({ list, setList, withCount }: IFilterContainer) => {
  const { t, getParent } = useTranslate()

  const groupList = useMemo(() => {
    return list.reduce(
      (acc, cur) => {
        const parent = getParent(cur.key)
        if (!(parent in acc)) acc[parent] = []
        acc[parent].push(cur)
        return acc
      },
      {} as Record<string, CheckList>
    )
  }, [getParent, list])

  const handleChange = (check: CheckList[0], checked: boolean) => {
    setList(prev => {
      return prev.map(i => {
        if (i.key === check.key) return { ...i, checked }
        return i
      })
    })
  }

  return (
    <Stack>
      <Accordion multiple defaultValue={Object.keys(groupList)}>
        {Object.keys(groupList).map(k => (
          <Accordion.Item key={k} value={k}>
            <Accordion.Control>{t(k)}</Accordion.Control>
            <Accordion.Panel>
              <Stack gap="lg">
                {groupList[k].map(i => (
                  <Checkbox
                    key={nanoid()}
                    checked={i.checked}
                    label={withCount ? `${i.label}(${i.count})` : i.label}
                    ml="sm"
                    onChange={e => handleChange(i, e.currentTarget.checked)}
                  />
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  )
}

export const FilterContainer = ({ list, setList, withCount = true }: IFilterContainer) => {
  const handleChange = (check: CheckList[0], checked: boolean) => {
    setList(prev => {
      return prev.map(i => {
        if (i.key === check.key) return { ...i, checked }
        return i
      })
    })
  }

  return (
    <Stack gap="lg">
      {list.map(i => (
        <Checkbox
          key={nanoid()}
          checked={i.checked}
          label={withCount ? `${i.label}(${i.count})` : i.label}
          onChange={e => handleChange(i, e.currentTarget.checked)}
        />
      ))}
    </Stack>
  )
}
