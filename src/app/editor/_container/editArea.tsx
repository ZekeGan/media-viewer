'use client'

import { Column, DataType, Layout } from '@/types/main'
import React, { useEffect, useMemo, useState } from 'react'
import { Button, Flex } from '@mantine/core'
import { nanoid } from 'nanoid'
import GridLayout, {
  LayoutItem,
  Layout as ReactLayout,
} from 'react-grid-layout'
import { Control, useWatch } from 'react-hook-form'
import { columnIdKey, columnTypeKey } from '@/constants/editor'
import {
  ItemBoolean,
  ItemButton,
  ItemDate,
  ItemNumber,
  ItemString,
  ItemWrapper,
} from '../_component/displayItem'
import { ValueType } from '../page'

const cols = 20

export function EditArea({
  layouts,
  setLayouts,
  control,
}: {
  layouts: Layout[]
  setLayouts: React.Dispatch<React.SetStateAction<Layout[]>>
  control: Control<ValueType>
}) {
  const columns = useWatch({ control, name: 'columns' })

  const processedLayouts = useMemo(() => {
    const l = layouts.map(l => {
      const idx = columns.findIndex(c => c.id === l.targetColumn)
      return { ...l, idx }
    })

    return { renderLayout: l, componentLayout: l.map(s => s.layout) }
  }, [columns, layouts])

  const handleChange = (oriLayout: ReactLayout) => {
    const newLayout = layouts
      .map(l => {
        const item = oriLayout.find(o => o.i === l.layout.i)
        if (!item) return
        return { ...l, layout: item }
      })
      .filter(l => !!l)

    setLayouts(newLayout)
  }

  const handleDrop = (item: LayoutItem, e: DragEvent) => {
    const dataType = e.dataTransfer?.getData(columnTypeKey) as DataType
    const targetColumn = e.dataTransfer?.getData(columnIdKey) as DataType

    if (!dataType || !targetColumn) return
    const { x, y, w, h } = item
    const layoutId = nanoid()
    setLayouts(p => [
      ...p,
      {
        id: layoutId,
        targetColumn,
        config: { dataType },
        layout: { i: `${p.length + 1}`, w, h, x, y },
      },
    ])
  }

  useEffect(() => {
    const newLayout = layouts.map(l => {
      const c = columns.find(c => c.id === l.targetColumn)
      if (!c) return l
      return { ...l, config: { dataType: c.dataType } }
    })
    setLayouts(newLayout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns])

  return (
    <div className="p-5">
      <div className=" w-[1000px] h-[1000px] relative border border-gray-800">
        <a
          className="absolute left-0 top-0 h-full w-full  
                bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] 
                bg-[size:50px_50px]"
        />

        <GridLayout
          layout={processedLayouts.componentLayout}
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
          {processedLayouts.renderLayout.map(i => {
            if (i.config.dataType === 'STRING') {
              return (
                <div key={i.layout.i} className="w-full h-full">
                  <ItemWrapper idx={i.idx}>
                    <ItemString />
                  </ItemWrapper>
                </div>
              )
            }
            if (i.config.dataType === 'NUMBER') {
              return (
                <div key={i.layout.i} className="w-full h-full">
                  <ItemWrapper idx={i.idx}>
                    <ItemNumber />
                  </ItemWrapper>
                </div>
              )
            }
            if (i.config.dataType === 'DATE') {
              return (
                <div key={i.layout.i} className="w-full h-full">
                  <ItemWrapper idx={i.idx}>
                    <ItemDate />
                  </ItemWrapper>
                </div>
              )
            }
            if (i.config.dataType === 'BOOLEAN') {
              return (
                <div key={i.layout.i} className="w-full h-full">
                  <ItemWrapper idx={i.idx}>
                    <ItemBoolean />
                  </ItemWrapper>
                </div>
              )
            }
            if (i.config.dataType === 'BUTTON') {
              return (
                <div key={i.layout.i} className="w-full h-full">
                  <ItemWrapper idx={i.idx}>
                    <ItemButton />
                  </ItemWrapper>
                </div>
              )
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
