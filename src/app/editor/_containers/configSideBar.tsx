'use client'

import { useMemo, useState } from 'react'
import { ActionIcon, Box, Card, Flex } from '@mantine/core'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import clsx from 'clsx'
import {
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { useEditorContext } from '../_contexts/editorContext'
import { ValueType } from '../page'

export function ConfigSideBar() {
  const { currentEdittingItemId } = useEditorContext()
  const { control } = useFormContext<ValueType>()
  // const column = useWatch({ control, name: 'columns' })
  const layout = useWatch({ control, name: 'layout' })

  const currentLayoutItem = useMemo(() => {
    if (!layout) return
    return layout.layoutItems.find(i => i.id === currentEdittingItemId)
  }, [currentEdittingItemId, layout])
  const [isOpen, setIsOpenSide] = useState(false)

  return (
    <section className="h-full border-l border-gray-700 ">
      <Flex gap={1}>
        <Box
          className={clsx(
            'overflow-hidden transition-all',
            isOpen ? 'w-100' : 'w-11'
          )}
        >
          <Flex className="p-2" justify="space-between">
            <ActionIcon
              size="sm"
              variant="default"
              onClick={() => setIsOpenSide(!isOpen)}
            >
              {isOpen ? <IconArrowRight /> : <IconArrowLeft />}
            </ActionIcon>
          </Flex>
          <main>
            {currentLayoutItem && <div>{currentLayoutItem.renderer}</div>}
          </main>
        </Box>
      </Flex>
    </section>
  )
}
