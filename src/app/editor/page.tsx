'use client'

import { Display } from '@/types/editor'
import { Column, DataType, Layout } from '@/types/main'
import React, { useState } from 'react'
import { Button, Flex } from '@mantine/core'
import { nanoid } from 'nanoid'
import { useForm } from 'react-hook-form'
import MainLayout from '@/layout/MainLayout'
import { ColumnSideBar } from './_container/columnSideBar'
import { ConfigSideBar } from './_container/configSideBar'
import { EditArea } from './_container/editArea'

const getDefaultDisplayData = (type: DataType, target: string): Display => {
  const id = nanoid()
  const data: Record<DataType, Display> = {
    STRING: {
      id,
      target,
      type: 'STRING',
      value: '',
    },
    NUMBER: {
      id,
      target,
      type: 'NUMBER',
      value: 0,
    },
    IMAGE: {
      id,
      target,
      type: 'STRING',
      value: 'toom1',
    },
    BUTTON: {
      id: nanoid(),
      target,
      type: 'BUTTON',
      config: {
        buttonStr: 'run exe',
        command: '',
      },
    },
    ARRAY_STRING: {
      target,
      id,
      type: 'STRING',
      value: 'toom1',
    },
    DATE: {
      id,
      target,
      type: 'DATE',
      config: {
        formatStr: 'yyyy/MM/dd',
      },
      value: new Date('2000/01/01').toString(),
    },
    BOOLEAN: {
      id,
      target,
      type: 'BOOLEAN',
      config: {
        trueStr: '',
        falseStr: '',
      },
      value: true,
    },
    NONE: {
      id,
      target,
      type: 'NONE',
    },
  }
  return data[type]
}

const initialLayout: Layout[] = [
  {
    layout: {
      i: 'a',
      x: 0,
      y: 0,
      w: 5,
      h: 3,
    },
    config: {
      dataType: 'STRING',
    },
    id: 'a',
    targetColumn: '',
  },
  {
    layout: {
      i: 'b',
      x: 0,
      y: 3,
      w: 3,
      h: 1,
    },
    config: {
      dataType: 'NUMBER',
    },
    id: 'b',
    targetColumn: '',
  },
  {
    layout: {
      i: 'c',
      x: 3,
      y: 3,
      w: 2,
      h: 1,
    },
    config: {
      dataType: 'DATE',
    },
    id: 'c',
    targetColumn: '',
  },
  {
    layout: {
      i: 'd',
      x: 0,
      y: 4,
      w: 2,
      h: 1,
    },
    config: {
      dataType: 'BOOLEAN',
    },
    id: 'd',
    targetColumn: '',
  },
  {
    layout: {
      i: 'e',
      x: 4,
      y: 4,
      w: 1,
      h: 1,
    },
    config: {
      dataType: 'STRING',
    },
    id: 'e',
    targetColumn: '',
  },
  {
    layout: {
      i: 'f',
      x: 0,
      y: 4,
      w: 5,
      h: 1,
    },
    config: {
      dataType: 'BUTTON',
    },
    id: 'f',
    targetColumn: '',
  },
]

const defaultColumn: Column[] = [
  {
    id: nanoid(),
    name: '',
    dataType: 'STRING',
  },
]

export type ValueType = {
  columns: Column[]
}

export default function GridEditorPage() {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [layouts, setLayouts] = useState<Layout[]>(initialLayout)

  const { control } = useForm<ValueType>({
    defaultValues: {
      columns: defaultColumn,
    },
  })

  return !isPreviewMode ? (
    <MainLayout>
      <Flex className="h-full">
        <ColumnSideBar control={control} />

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
          <EditArea
            control={control}
            layouts={layouts}
            setLayouts={setLayouts}
          />
        </section>

        <ConfigSideBar layouts={layouts} />
      </Flex>
    </MainLayout>
  ) : (
    <MainLayout>
      <nav className="p-2 border-b border-gray-700">
        <Flex gap="sm" justify="space-between">
          <Flex>
            <Button variant="default" onClick={() => setIsPreviewMode(false)}>
              返回
            </Button>
          </Flex>
          <Flex gap="sm">
            <Button variant="default">間距距離</Button>
            <Button variant="default">自由寬度</Button>
          </Flex>
        </Flex>
      </nav>
    </MainLayout>
  )
}

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

// <div className="w-full mt-5">
//   <div
//     className="grid gap-0 mb-5 w-full"
//     style={{
//       gridColumn: cols,
//     }}
//   >
//     <div style={{ gridColumn: '3 / 5', gridRow: '2' }}>
//       {/* 指定在第 3 欄開始，寬度佔 2 格，第 2 列 */}
//     </div>
//     {initialLayout.map(i => (
//       <div
//         key={i.id}
//         className="bg-gradient-to-br from-blue-500 to-cyan-400"
//         style={{
//           gridColumn: `${i.layout.x + 1}/ span ${i.layout.w}`,
//           gridRow: `${i.layout.y + 1}/ span ${i.layout.h}`,
//           height: `${i.layout.h * 100}px`,
//         }}
//       >
//         <div className="w-full  " />
//       </div>
//     ))}
//   </div>
// </div>

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
