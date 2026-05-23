'use client'

import React, { ReactNode, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@mantine/core'
import clsx from 'clsx'
import { nanoid } from 'nanoid'
import GridLayout, {
  Layout as ReactGridLayout,
  LayoutItem as ReactGridLayoutItem,
} from 'react-grid-layout'
import {
  Control,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import {
  DataLayoutItem,
  DataType,
  VisualLayoutItem,
} from 'shared/main'
import { columnIdKey, columnTypeKey } from '@/constants/editor'
import { useAppStore } from '@/stores/mainStore'
import { LayoutItemRenderer } from '../../../components/layoutItem'
import { useEditorContext } from '../_contexts/editorContext'
import { ValueType } from '../page'

const cols = 20

const ItemWrapper = ({
  children,
  label,
  isEditting,
}: {
  children: ReactNode
  label?: string
  isEditting: boolean
}) => {
  return (
    <main
      className={clsx(
        'w-full h-full relative',
        isEditting
          ? 'shadow-[inset_0_0_0_2px] shadow-gray-400' // 利用 shadow-gray-500
          : 'shadow-[inset_0_0_0_1px] shadow-gray-700' // 利用 shadow-gray-700
      )}
    >
      <div className=" absolute left-0 top-0 z-10">
        <Badge className=" opacity-30" variant="default" size="sm">
          {label}
        </Badge>
      </div>
      {children}
    </main>
  )
}

export function EditArea() {
  const { currentEdittingItemId, setCurrentEdittingItemId } = useEditorContext()
  const { control, setValue } = useFormContext<ValueType>()
  const columns = useWatch({ control, name: 'columns' })
  const layout = useWatch({ control, name: 'layout' })
  const { append: appendLayoutItem } = useFieldArray({
    control,
    name: 'layout.layoutItems',
  })

  const layoutId = useSearchParams().get('id')
  const grids = useMemo(() => {
    if (!layout) return []
    return layout.layoutItems.map(l => l.grid)
  }, [layout])

  const handleChange = (grids: ReactGridLayout) => {
    if (!layoutId || !layout) return
    const newLayoutItems = layout.layoutItems
      .map(l => {
        const item = grids.find(o => o.i === l.grid.i)
        if (!item) return l
        return { ...l, grid: item } satisfies DataLayoutItem | VisualLayoutItem
      })
      .filter(l => l)
    setValue('layout.layoutItems', newLayoutItems, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  const handleDrop = (item: ReactGridLayoutItem, e: DragEvent) => {
    if (!layout) return
    const dataType = e.dataTransfer?.getData(columnTypeKey) as DataType
    const columnId = e.dataTransfer?.getData(columnIdKey) as DataType
    if (!dataType || !columnId || !layoutId) return
    appendLayoutItem({
      id: nanoid(),
      layoutId: layoutId,
      columnId: columnId,
      grid: { ...item, i: nanoid() },
      renderer: 'TEXT',
      rendererConfig: {},
    })
  }

  if (!columns || !layout) return null

  return (
    <div className="p-5">
      <div className=" w-[1000px] h-[1000px] relative border border-gray-800">
        <a
          className="absolute left-0 top-0 h-full w-full  
                bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] 
                bg-[size:50px_50px]"
        />

        <GridLayout
          layout={grids}
          dropConfig={{
            enabled: true,
            defaultItem: { w: 2, h: 1 },
          }}
          onDrop={(_, item, e) => {
            if (!item) return
            handleDrop(item, e as DragEvent)
          }}
          gridConfig={{
            // maxRows: 10,
            cols: cols,
            rowHeight: 50,
            margin: [0, 0],
            containerPadding: [0, 0],
          }}
          onDragStop={grids => handleChange(grids)}
          onResizeStop={grids => handleChange(grids)}
          width={1000}
          autoSize={false}
          style={{ minHeight: '1000px' }}
        >
          {layout.layoutItems.map(l => {
            let label: string | undefined
            if ('columnId' in l) {
              label = columns.find(c => c.id === l.columnId)?.name
            }

            return (
              <div
                key={l.grid.i}
                className="w-full h-full"
                onClick={() => setCurrentEdittingItemId(l.id)}
              >
                <ItemWrapper
                  label={label}
                  isEditting={currentEdittingItemId === l.id}
                >
                  <LayoutItemRenderer layoutItem={l} />
                </ItemWrapper>
              </div>
            )
          })}
        </GridLayout>
      </div>
    </div>
  )
}

//    <GridLayout
//         layout={[{ i: '0', w: 10, h: 15, x: 0, y: 0, isDraggable: false }]}
//         gridConfig={{
//           // maxRows: 10,
//           cols: cols,
//           rowHeight: 50,
//           margin: [0, 0],
//           containerPadding: [0, 0],
//         }}
//         width={1000}
//         autoSize={false}
//       >
//         <div key={'0'} className="bg-purple-950 opacity-15" />
//       </GridLayout>
