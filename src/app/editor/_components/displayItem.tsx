// import {
//   DisplayBoolean,
//   DisplayButton,
//   DisplayDate,
//   DisplayNumber,
//   DisplayString,
// } from '@/types/editor'
import { ReactNode } from 'react'
import { Avatar, Badge, Button, Text } from '@mantine/core'
import { format } from 'date-fns'
import { useFormContext } from 'react-hook-form'
import { Cell, CellString, Column, DataLayoutItem, Layout } from 'shared/main'

function CellText({
  cell,
  layoutItem,
}: {
  cell: CellString | undefined
  layoutItem: DataLayoutItem
}) {
  const { control } = useFormContext()
  // if (!item)
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around">
      <Text>
        {layoutItem.rendererConfig?.name
          ? layoutItem.rendererConfig?.name
          : 'STRING'}
      </Text>
      <Text size="lg">{cell ? cell.value : 'DEFAULT'}</Text>
    </div>
  )
  // return (
  //   <div className="w-full h-full overflow-hidden flex items-center justify-around ">
  //     {item.label && <div>{item.label}</div>}
  //     <div>{item.value}</div>
  //   </div>
  // )
}
function CellTextConfig() {
  return <main></main>
}

export function CellRenderer({
  layoutItem,
  columns,
}: {
  layoutItem: Layout['layoutItems'][0]
  columns: Column[]
}) {
  //  DataLayoutItem
  if ('columnId' in layoutItem) {
    if (layoutItem.renderer === 'TEXT') {
      return <CellText layoutItem={layoutItem} cell={undefined} />
    }
  }
}

export function CellConfigRenderer({
  layoutItem,
  columns,
}: {
  layoutItem: Layout['layoutItems'][0]
  columns: Column[]
}) {
  //  DataLayoutItem
  if ('columnId' in layoutItem) {
    if (layoutItem.renderer === 'TEXT') {
      return <CellTextConfig />
    }
  }
}

// export const ItemNumber = ({ item }: { item?: DisplayNumber }) => {
//   if (!item)
//     return (
//       <div className="w-full h-full overflow-hidden flex items-center justify-around">
//         <Text>數字</Text>
//         <div>0</div>
//       </div>
//     )

//   return (
//     <div className="w-full h-full overflow-hidden flex items-center justify-around">
//       {item.label && <div>{item.label}</div>}
//       <div>{item.value}</div>
//     </div>
//   )
// }

// export const ItemDate = ({ item }: { item?: DisplayDate }) => {
//   if (!item)
//     return (
//       <div className="w-full h-full overflow-hidden flex items-center justify-around">
//         <Text>時間</Text>
//         <div>2000/01/01</div>
//       </div>
//     )

//   const time = format(new Date(item.value), item.config.formatStr)
//   return (
//     <div className="w-full h-full overflow-hidden flex items-center justify-around">
//       {item.label && <div>{item.label}</div>}
//       <div>{time}</div>
//     </div>
//   )
// }

// export const ItemBoolean = ({ item }: { item?: DisplayBoolean }) => {
//   if (!item)
//     return (
//       <div>
//         <div className="w-full h-full overflow-hidden flex items-center justify-around">
//           <Text>TEST</Text>
//           <div>False</div>
//         </div>
//       </div>
//     )

//   return (
//     <div className="w-full h-full overflow-hidden flex items-center justify-around">
//       {item.label && <Text>{item.label}</Text>}
//       <div>{item.value ? item.config.trueStr : item.config.falseStr}</div>
//     </div>
//   )
// }

// export const ItemButton = ({ item }: { item?: DisplayButton }) => {
//   if (!item)
//     return (
//       <div className="w-full h-full overflow-hidden flex items-center ">
//         <Button variant="default" fullWidth>
//           預設文字
//         </Button>
//       </div>
//     )
//   return (
//     <div className="w-full h-full overflow-hidden flex items-center ">
//       <Button variant="default" fullWidth>
//         {item.config?.buttonStr}
//       </Button>
//     </div>
//   )
// }
