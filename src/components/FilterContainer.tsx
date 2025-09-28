'use client'

import { Dispatch, SetStateAction, useMemo } from 'react'
import { createKey } from 'next/dist/shared/lib/router/router'
import { Accordion, Checkbox, Stack } from '@mantine/core'
import { nanoid } from 'nanoid'
import { useTranslate } from '@/hooks/useTranslate'

interface IFilterContainer {
  list: CheckList
  setList: (...args: any) => void
  withCount?: boolean
}

export const GroupedFilterContainer = ({
  list,
  setList,
  withCount,
}: IFilterContainer) => {
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
                    onChange={() => setList(i.key)}
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

export const FilterContainer = ({
  list,
  setList,
  withCount = true,
}: IFilterContainer) => {
  return (
    <Stack gap="lg">
      {list.map(i => (
        <Checkbox
          key={nanoid()}
          checked={i.checked}
          label={withCount ? `${i.label}(${i.count})` : i.label}
          onChange={() => setList(i.key)}
        />
      ))}
    </Stack>
  )
}
