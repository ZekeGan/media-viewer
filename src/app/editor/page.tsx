'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Flex } from '@mantine/core'
import { useForm, useWatch } from 'react-hook-form'
import { Column } from 'shared/main'
import MainLayout from '@/layout/MainLayout'
import { useLoadInitialData } from '@/hooks/useLoadInitialData'
import { useAppStore } from '@/stores/mainStore'
import { CellRenderer } from './_component/displayItem'
import { ColumnSideBar } from './_container/columnSideBar'
import { ConfigSideBar } from './_container/configSideBar'
import { EditArea } from './_container/editArea'
import { PreviewContainer } from './_container/previewContainer'

export type ValueType = {
  columns: Column[]
}

export default function GridEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const layoutId = searchParams.get('id')
  useLoadInitialData()
  const currentView = useAppStore(s => s.currentView)
  // const folders = useAppStore(s => s.currentView?.folders)

  const layouts = useMemo(() => {
    if (!currentView || !layoutId) return
    return currentView.layouts.find(l => l.id === layoutId)
  }, [currentView, layoutId])

  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const { control, reset } = useForm<ValueType>()
  const columns = useWatch({ control, name: 'columns' })

  useEffect(() => {
    if (!currentView) return

    reset({ columns: currentView.columns })
  }, [currentView, reset])

  if (!layoutId) router.prefetch('/')
  if (!currentView || !layouts) return null

  return !isPreviewMode ? (
    <Flex className="h-full">
      <ColumnSideBar control={control} />

      <section className="flex-1 overflow-x-scroll">
        <div className="border-b border-gray-700">
          <Flex className="p-2" gap={5} align="center" justify="space-between">
            <Flex gap="sm">
              <Button variant="default" onClick={() => setIsPreviewMode(true)}>
                列表檢視
              </Button>
            </Flex>
            <Flex gap="sm">
              <Button variant="default">取消</Button>
              <Button variant="default">儲存</Button>
            </Flex>
          </Flex>
        </div>
        <EditArea columns={columns} layoutItems={layouts.layoutItems} />
      </section>

      {/* <ConfigSideBar layouts={layouts} /> */}
    </Flex>
  ) : (
    <PreviewContainer
      columns={columns}
      layoutItems={layouts.layoutItems}
      setIsPreviewMode={setIsPreviewMode}
    />
  )
}

// const getDefaultDisplayData = (type: DataType, target: string): Display => {
//   const id = nanoid()
//   const data: Record<DataType, Display> = {
//     STRING: {
//       id,
//       target,
//       type: 'STRING',
//       value: '',
//     },
//     NUMBER: {
//       id,
//       target,
//       type: 'NUMBER',
//       value: 0,
//     },
//     IMAGE: {
//       id,
//       target,
//       type: 'STRING',
//       value: 'toom1',
//     },
//     BUTTON: {
//       id: nanoid(),
//       target,
//       type: 'BUTTON',
//       config: {
//         buttonStr: 'run exe',
//         command: '',
//       },
//     },
//     ARRAY_STRING: {
//       target,
//       id,
//       type: 'STRING',
//       value: 'toom1',
//     },
//     DATE: {
//       id,
//       target,
//       type: 'DATE',
//       config: {
//         formatStr: 'yyyy/MM/dd',
//       },
//       value: new Date('2000/01/01').toString(),
//     },
//     BOOLEAN: {
//       id,
//       target,
//       type: 'BOOLEAN',
//       config: {
//         trueStr: '',
//         falseStr: '',
//       },
//       value: true,
//     },
//     NONE: {
//       id,
//       target,
//       type: 'NONE',
//     },
//   }
//   return data[type]
// }

// const displayData: Display[] = [
//   {
//     id: nanoid(),
//     target: 'a',
//     type: 'STRING',
//     value: 'toom1',
//     label: 'string',
//   },
//   {
//     id: nanoid(),
//     target: 'b',
//     type: 'NUMBER',
//     value: 512.665,
//     label: 'number',
//   },
//   {
//     id: nanoid(),
//     target: 'c',
//     type: 'DATE',
//     label: 'date',

//     config: {
//       formatStr: 'yyyy/MM/dd',
//     },
//     value: new Date('2000/01/01').toString(),
//   },
//   {
//     id: nanoid(),
//     target: 'd',
//     type: 'BOOLEAN',
//     label: 'boolean',
//     config: {
//       trueStr: 'TRUE',
//       falseStr: 'FALSE',
//     },
//     value: true,
//   },
//   {
//     id: nanoid(),
//     target: 'e',
//     type: 'STRING',
//     value: 'toom5',
//   },
//   {
//     id: nanoid(),
//     target: 'f',
//     type: 'BUTTON',
//     config: {
//       buttonStr: 'run exe',
//       command: 'RUN_EXE',
//     },
//   },
// ]

// <section className="absolute left-0 top-0 flex items-center gap-2">
//       <div className="flex flex-col items-center gap-2">
//         <div
//           className="bg-purple-900 opacity-20 transition-all"
//           style={{ width: container.w, height: container.h }}
//         />
//         <div
//           className="w-10 h-10 bg-white"
//           onClick={() => setContainer(p => ({ ...p, h: p.h + 50 }))}
//         />
//       </div>
//       <div className="w-10 h-10 -translate-y-12 flex gap-2">
//         <a
//           className="bg-yellow-300 w-5 h-10"
//           onClick={() => setContainer(p => ({ ...p, w: p.w - 50 }))}
//         />
//         <a
//           className="bg-red-200 w-5 h-10"
//           onClick={() => setContainer(p => ({ ...p, w: p.w + 50 }))}
//         />
//       </div>
//     </section>

//  {processedLayouts.renderLayout.map(i => {
//               const data = display.find(d => d.target === i.id)
//               if (!data) return null
//               if (
//                 data.type === 'STRING' &&
//                 i.config.dataType === 'STRING'
//               ) {
//                 return (
//                   <div key={i.layout.i} className="w-full h-full">
//                     <ItemWrapper idx={i.idx}>
//                       <ItemString item={data} />
//                     </ItemWrapper>
//                   </div>
//                 )
//               }
//               if (
//                 data.type === 'NUMBER' &&
//                 i.config.dataType === 'NUMBER'
//               ) {
//                 return (
//                   <div key={i.layout.i} className="w-full h-full">
//                     <ItemWrapper idx={i.idx}>
//                       <ItemNumber item={data} />
//                     </ItemWrapper>
//                   </div>
//                 )
//               }
//               if (data.type === 'DATE' && i.config.dataType === 'DATE') {
//                 return (
//                   <div key={i.layout.i} className="w-full h-full">
//                     <ItemWrapper idx={i.idx}>
//                       <ItemDate item={data} />
//                     </ItemWrapper>
//                   </div>
//                 )
//               }
//               if (
//                 data.type === 'BOOLEAN' &&
//                 i.config.dataType === 'BOOLEAN'
//               ) {
//                 return (
//                   <div key={i.layout.i} className="w-full h-full">
//                     <ItemWrapper idx={i.idx}>
//                       <ItemBoolean item={data} />
//                     </ItemWrapper>
//                   </div>
//                 )
//               }
//               if (
//                 data.type === 'BUTTON' &&
//                 i.config.dataType === 'BUTTON'
//               ) {
//                 return (
//                   <div key={i.layout.i} className="w-full h-full">
//                     <ItemWrapper idx={i.idx}>
//                       <ItemButton item={data} />
//                     </ItemWrapper>
//                   </div>
//                 )
//               }
//               return null
//             })}
