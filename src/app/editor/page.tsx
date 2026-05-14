'use client'

import React, {
  Fragment,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { Avatar, Button, Card, Container, Flex } from '@mantine/core'
import { format, parse } from 'date-fns'
import { nanoid } from 'nanoid'
import GridLayout, {
  Layout,
  LayoutItem,
  useContainerWidth,
} from 'react-grid-layout'
import { noCompactor } from 'react-grid-layout/core'

import MainLayout from '@/layout/MainLayout'

type BlockSupportType =
  | 'STRING'
  | 'NUMBER'
  | 'IMAGE'
  | 'BUTTON'
  | 'ARRAY_STRING'
  | 'DATE'
  | 'BOOLEAN'
  | 'NONE'

interface Block {
  id: string
  layout: LayoutItem
  config: {
    type: BlockSupportType
  }
}

// 定義每種類型對應的 Value 格式
interface DisplayBase {
  id: string
  target: string
  type: BlockSupportType
  label?: string
}

interface StringDisplay extends DisplayBase {
  type: 'STRING' | 'IMAGE'
  value: string
}
interface ButtonDisplay extends DisplayBase {
  type: 'BUTTON'
  config?: {
    buttonStr?: string
    command: 'OPEN_FOLDER' | 'RUN_EXE' | ''
  }
}

interface NumberDisplay extends DisplayBase {
  type: 'NUMBER'
  value: number
}

interface ArrayStringDisplay extends DisplayBase {
  type: 'ARRAY_STRING'
  value: string[]
}

interface DateDisplay extends DisplayBase {
  type: 'DATE'
  config: {
    formatStr: string
  }
  value: string
}

interface BooleanDisplay extends DisplayBase {
  type: 'BOOLEAN'
  config: {
    trueStr: string
    falseStr: string
  }
  value: boolean
}

interface NoneDisplay extends DisplayBase {
  type: 'NONE'
}

type Display =
  | StringDisplay
  | NumberDisplay
  | ArrayStringDisplay
  | DateDisplay
  | BooleanDisplay
  | ButtonDisplay
  | NoneDisplay

const initialLayout: Block[] = [
  {
    layout: {
      i: '1',
      x: 0,
      y: 0,
      w: 5,
      h: 3,
    },
    config: {
      type: 'STRING',
    },
    id: 'a',
  },
  {
    layout: {
      i: '2',
      x: 0,
      y: 3,
      w: 3,
      h: 1,
    },
    config: {
      type: 'NUMBER',
    },
    id: 'b',
  },
  {
    layout: {
      i: '3',
      x: 3,
      y: 3,
      w: 2,
      h: 1,
    },
    config: {
      type: 'DATE',
    },
    id: 'c',
  },
  {
    layout: {
      i: '4',
      x: 0,
      y: 4,
      w: 2,
      h: 1,
    },
    config: {
      type: 'BOOLEAN',
    },
    id: 'd',
  },
  {
    layout: {
      i: '5',
      x: 4,
      y: 4,
      w: 1,
      h: 1,
    },
    config: {
      type: 'STRING',
    },
    id: 'e',
  },
  {
    layout: {
      i: '6',
      x: 0,
      y: 4,
      w: 5,
      h: 1,
    },
    config: {
      type: 'BUTTON',
    },
    id: 'f',
  },
]

const displayData: Display[] = [
  {
    id: nanoid(),
    target: 'a',
    type: 'STRING',
    value: 'toom1',
    label: 'string',
  },
  {
    id: nanoid(),
    target: 'b',
    type: 'NUMBER',
    value: 512.665,
    label: 'number',
  },
  {
    id: nanoid(),
    target: 'c',
    type: 'DATE',
    label: 'date',

    config: {
      formatStr: 'yyyy/MM/dd',
    },
    value: new Date('2000/01/01').toString(),
  },
  {
    id: nanoid(),
    target: 'd',
    type: 'BOOLEAN',
    label: 'boolean',
    config: {
      trueStr: 'TRUE',
      falseStr: 'FALSE',
    },
    value: true,
  },
  {
    id: nanoid(),
    target: 'e',
    type: 'STRING',
    value: 'toom5',
  },
  {
    id: nanoid(),
    target: 'f',
    type: 'BUTTON',
    config: {
      buttonStr: 'run exe',
      command: 'RUN_EXE',
    },
  },
]

const cols = 20

const getDefaultDisplayData = (type: BlockSupportType, target: string) => {
  const id = nanoid()
  const data: Record<BlockSupportType, Display> = {
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

const ItemWrapper = ({
  children,
  idx,
}: {
  children: ReactNode
  idx: string
}) => {
  return (
    <main className="w-full h-full border relative">
      <div className=" absolute left-0 top-0 z-10">
        <Avatar size="sm">{idx}</Avatar>
      </div>
      {children}
    </main>
  )
}

const ItemString = ({ item }: { item: StringDisplay }) => {
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around ">
      {item.label && <div>{item.label}</div>}
      <div>{item.value}</div>
    </div>
  )
}
const ItemNumber = ({ item }: { item: NumberDisplay }) => {
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around">
      {item.label && <div>{item.label}</div>}
      <div>{item.value}</div>
    </div>
  )
}
const ItemDate = ({ item }: { item: DateDisplay }) => {
  const time = format(new Date(item.value), item.config.formatStr)
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around">
      {item.label && <div>{item.label}</div>}
      <div>{time}</div>
    </div>
  )
}
const ItemBoolean = ({ item }: { item: BooleanDisplay }) => {
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around">
      {item.label && <div>{item.label}</div>}
      <div>{item.value ? item.config.trueStr : item.config.falseStr}</div>
    </div>
  )
}
const ItemButton = ({ item }: { item: ButtonDisplay }) => {
  return (
    <div className="w-full h-full overflow-hidden flex items-center ">
      <Button variant="default" fullWidth>
        {item.config?.buttonStr}
      </Button>
    </div>
  )
}

export default function GridEditorPage() {
  const [layout, setLayout] = useState<Block[]>(initialLayout)
  const [display, setDisplay] = useState<Display[]>(displayData)

  const gridLayout = useMemo(() => {
    return layout.map(i => i.layout)
  }, [layout])

  const handleDrag = (type: BlockSupportType, { x, y, w, h }: LayoutItem) => {
    const layoutId = nanoid()
    setDisplay(p => [...p, getDefaultDisplayData(type, layoutId)])
    setLayout(p => [
      ...p,
      {
        id: layoutId,
        config: { type },
        layout: { i: `${p.length + 1}`, w, h, x, y },
      },
    ])
  }

  return (
    <MainLayout>
      <main className="w-full h-full flex flex-col ">
        <Card radius={0} p={0}>
          <Flex className="p-2" gap={5}>
            <div
              draggable
              onDragStart={e => e.dataTransfer.setData('blockType', 'STRING')}
            >
              STRING
            </div>
            <div
              draggable
              onDragStart={e => e.dataTransfer.setData('blockType', 'NUMBER')}
            >
              NUMBER
            </div>
            <div
              draggable
              onDragStart={e => e.dataTransfer.setData('blockType', 'DATE')}
            >
              DATE
            </div>
            <div
              draggable
              onDragStart={e => e.dataTransfer.setData('blockType', 'BUTTON')}
            >
              BUTTON
            </div>
            <div
              draggable
              onDragStart={e => e.dataTransfer.setData('blockType', 'BOOLEAN')}
            >
              BOOLEAN
            </div>
          </Flex>
        </Card>

        <section className="flex-1 p-5 ">
          <div className=" w-[1000px] h-[1000px] relative border border-gray-800 ">
            <a
              className="absolute left-0 top-0 h-full w-full  
            bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] 
            bg-[size:50px_50px]"
            />

            <GridLayout
              layout={[
                { i: '0', w: 10, h: 15, x: 0, y: 0, isDraggable: false },
              ]}
              gridConfig={{
                // maxRows: 10,
                cols: cols,
                rowHeight: 50,
                margin: [0, 0],
                containerPadding: [0, 0],
              }}
              width={1000}
              autoSize={false}
            >
              <div key={'0'} className="bg-purple-950 opacity-15" />
            </GridLayout>

            <GridLayout
              dropConfig={{
                enabled: true,
                defaultItem: { w: 2, h: 1 },
              }}
              onDrop={(_, layoutItem, e) => {
                const blockType = (e as DragEvent).dataTransfer?.getData(
                  'blockType'
                ) as BlockSupportType

                if (!blockType || !layoutItem) return
                console.log(blockType)

                handleDrag(blockType, layoutItem)
              }}
              layout={gridLayout}
              gridConfig={{
                // maxRows: 10,
                cols: cols,
                rowHeight: 50,
                margin: [0, 0],
                containerPadding: [0, 0],
              }}
              width={1000}
              autoSize={false}
              style={{ minHeight: '1000px' }}
            >
              {layout.map(i => {
                const data = display.find(d => d.target === i.id)
                if (!data) return null
                if (data.type === 'STRING' && i.config.type === 'STRING') {
                  return (
                    <div key={i.layout.i} className="w-full h-full">
                      <ItemWrapper idx={i.layout.i}>
                        <ItemString item={data} />
                      </ItemWrapper>
                    </div>
                  )
                }
                if (data.type === 'NUMBER' && i.config.type === 'NUMBER') {
                  return (
                    <div key={i.layout.i} className="w-full h-full">
                      <ItemWrapper idx={i.layout.i}>
                        <ItemNumber item={data} />
                      </ItemWrapper>
                    </div>
                  )
                }
                if (data.type === 'DATE' && i.config.type === 'DATE') {
                  return (
                    <div key={i.layout.i} className="w-full h-full">
                      <ItemWrapper idx={i.layout.i}>
                        <ItemDate item={data} />
                      </ItemWrapper>
                    </div>
                  )
                }
                if (data.type === 'BOOLEAN' && i.config.type === 'BOOLEAN') {
                  return (
                    <div key={i.layout.i} className="w-full h-full">
                      <ItemWrapper idx={i.layout.i}>
                        <ItemBoolean item={data} />
                      </ItemWrapper>
                    </div>
                  )
                }
                if (data.type === 'BUTTON' && i.config.type === 'BUTTON') {
                  return (
                    <div key={i.layout.i} className="w-full h-full">
                      <ItemWrapper idx={i.layout.i}>
                        <ItemButton item={data} />
                      </ItemWrapper>
                    </div>
                  )
                }
                return null
              })}
            </GridLayout>
          </div>
        </section>
      </main>
    </MainLayout>
  )
}

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
