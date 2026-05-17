'use client'

import { useLoadInitialData } from '@/app/editor/_hooks/useLoadInitialData'
import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Flex } from '@mantine/core'
import { FormProvider, useForm } from 'react-hook-form'
import { Column, Layout } from 'shared/main'
import { useAppStore } from '@/stores/mainStore'
import { ColumnSideBar } from './_containers/columnSideBar'
import { ConfigSideBar } from './_containers/configSideBar'
import { EditArea } from './_containers/editArea'
import { PreviewContainer } from './_containers/previewContainer'

export type ValueType = {
  columns: Column[] | undefined
  layout: Layout | undefined
}

export default function GridEditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const layoutId = searchParams.get('id')
  const currentView = useAppStore(s => s.currentView)
  useLoadInitialData()

  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const methods = useForm<ValueType>()
  useEffect(() => {
    if (!currentView || !layoutId) return

    const currentLayout = currentView.layouts.find(l => l.id === layoutId)
    methods.reset({ columns: currentView.columns, layout: currentLayout })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, layoutId])

  if (!layoutId) router.prefetch('/')
  if (!currentView) return null

  return (
    <FormProvider {...methods}>
      {!isPreviewMode ? (
        <Flex className="h-full">
          <ColumnSideBar />

          <section className="flex-1 overflow-x-scroll">
            <div className="border-b border-gray-700">
              <Flex
                className="p-2"
                gap={5}
                align="center"
                justify="space-between"
              >
                <Flex gap="sm">
                  <Button
                    variant="default"
                    onClick={() => setIsPreviewMode(true)}
                  >
                    列表檢視
                  </Button>
                </Flex>
                <Flex gap="sm">
                  <Button variant="default">取消</Button>
                  <Button variant="default">儲存</Button>
                </Flex>
              </Flex>
            </div>
            <EditArea />
          </section>

          <ConfigSideBar />
        </Flex>
      ) : (
        <PreviewContainer setIsPreviewMode={setIsPreviewMode} />
      )}
    </FormProvider>
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
