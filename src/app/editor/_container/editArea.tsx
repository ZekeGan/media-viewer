'use client'

import React, { useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { nanoid } from 'nanoid'
import GridLayout, {
  LayoutItem,
  Layout as ReactLayout,
} from 'react-grid-layout'
import { Control, useWatch } from 'react-hook-form'
import {
  Column,
  DataLayoutItem,
  DataType,
  Layout,
  VisualLayoutItem,
} from 'shared/main'
import { columnIdKey, columnTypeKey } from '@/constants/editor'
import { useAppStore } from '@/stores/mainStore'
import {
  // ItemBoolean,
  // ItemButton,
  // ItemDate,
  // ItemNumber,
  CellText,
  ItemWrapper,
} from '../_component/displayItem'
import { ValueType } from '../page'

const cols = 20

export function EditArea({
  layouts,
  control,
}: {
  control: Control<ValueType>
  layouts: Layout
}) {
  const searchParams = useSearchParams()
  const layoutId = searchParams.get('id')
  const columns = useWatch({ control, name: 'columns' })
  const updateLayoutItems = useAppStore(s => s.updateLayoutItems)
  const grids = useMemo(() => {
    if (!layouts) return []
    return layouts.layoutItems.map(l => l.grid)
  }, [layouts])

  const handleChange = (grids: ReactLayout) => {
    if (!layoutId) return

    const newLayoutItems = layouts.layoutItems
      .map(l => {
        const item = grids.find(o => o.i === l.grid.i)
        if (!item) return l
        return { ...l, grid: item } satisfies DataLayoutItem | VisualLayoutItem
      })
      .filter(l => l)
    updateLayoutItems(layoutId, newLayoutItems)
  }

  const handleDrop = (item: LayoutItem, e: DragEvent) => {
    const dataType = e.dataTransfer?.getData(columnTypeKey) as DataType
    const columnId = e.dataTransfer?.getData(columnIdKey) as DataType
    console.log(item)

    if (!dataType || !columnId || !layoutId) return
    const newLayoutItems: Layout['layoutItems'] = [
      ...layouts.layoutItems,
      {
        id: nanoid(),
        layoutId: layoutId,
        columnId: columnId,
        grid: { ...item, i: nanoid() },
        renderer: 'TEXT',
      },
    ]
    updateLayoutItems(layoutId, newLayoutItems)
  }

  if (!columns) return null

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
          onDragStop={layouts => handleChange(layouts)}
          onResizeStop={layouts => handleChange(layouts)}
          width={1000}
          autoSize={false}
          style={{ minHeight: '1000px' }}
        >
          {layouts.layoutItems.map(l => {
            if ('columnId' in l) {
              const c = columns.find(c => c.id === l.columnId)
              if (l.renderer === 'TEXT') {
                return (
                  <div key={l.grid.i} className="w-full h-full">
                    <ItemWrapper label={c?.name}>
                      <CellText />
                    </ItemWrapper>
                  </div>
                )
              }
            }

            return null
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
