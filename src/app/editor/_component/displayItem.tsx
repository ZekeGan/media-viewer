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
import { Column, Layout } from 'shared/main'

export const ItemWrapper = ({
  children,
  label,
}: {
  children: ReactNode
  label?: string
}) => {
  return (
    <main className="w-full h-full border border-gray-600 relative">
      <div className=" absolute left-0 top-0 z-10">
        <Badge className=" opacity-30" variant="default" size="sm">
          {label}
        </Badge>
      </div>
      {children}
    </main>
  )
}

export const CellText = () => {
  // if (!item)
  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around bg-gray-900">
      <Text>字串</Text>
      <div>Test</div>
    </div>
  )
  // return (
  //   <div className="w-full h-full overflow-hidden flex items-center justify-around ">
  //     {item.label && <div>{item.label}</div>}
  //     <div>{item.value}</div>
  //   </div>
  // )
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
      return <CellText />
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
