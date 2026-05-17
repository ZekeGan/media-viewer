import { Text } from '@mantine/core'
import { clsx } from 'clsx'
import { CellString, DataLayoutItem, Layout } from 'shared/main'

function getTextClasses(
  config: Extract<DataLayoutItem, { renderer: 'TEXT' }>['rendererConfig']
): string {
  // 字体大小
  const fontSize =
    typeof config.fontSize === 'number'
      ? `text-[${config.fontSize}px]`
      : config.fontSize
        ? `text-${config.fontSize}`
        : 'text-base'

  // 颜色
  const color = 'text-gray-900 dark:text-gray-900'

  // 加粗
  const fontWeight = config.fontWeight
    ? `font-${config.fontWeight}`
    : 'font-normal'

  // 对齐
  const textAlign = config.textAlign ? `text-${config.textAlign}` : 'text-left'

  return clsx(fontSize, color, fontWeight, textAlign)
}

function CellText({
  cell,
  layoutItem: i,
}: {
  cell: CellString | undefined
  layoutItem: Extract<DataLayoutItem, { renderer: 'TEXT' }>
}) {
  const valueClass = getTextClasses(i.rendererConfig)
  console.log(valueClass)

  return (
    <div className="w-full h-full overflow-hidden flex items-center justify-around">
      {/* {!!i.rendererConfig.label && <Text>i.rendererConfig?.label</Text>} */}
      <p className={valueClass}>{cell ? cell.value : 'DEFAULT'}</p>
    </div>
  )
}
function CellTextConfig() {
  return (
    <main>
      <div>調整大小 / select</div>
      <div>調整粗細 / select</div>
      <div>傾斜 / switch</div>
    </main>
  )
}

export function CellRenderer({
  layoutItem,
}: {
  layoutItem: Layout['layoutItems'][0]
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
}: {
  layoutItem: Layout['layoutItems'][0]
}) {
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
