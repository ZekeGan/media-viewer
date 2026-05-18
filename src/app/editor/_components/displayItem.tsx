import { useEffect, useMemo } from 'react'
import {
  ColorInput,
  Flex,
  NumberInput,
  SegmentedControl,
  Select,
  Switch,
  Text,
} from '@mantine/core'
import { clsx } from 'clsx'
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { CellString, DataLayoutItem, Layout, TextLayoutItem } from 'shared/main'
import { colors } from '@/constants/editor'
import { useEditorContext } from '../_contexts/editorContext'
import { ValueType } from '../page'

const fontSizeMap: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
}

function CellText({
  cell,
  layoutItem: i,
}: {
  cell: CellString | undefined
  layoutItem: Extract<DataLayoutItem, { renderer: 'TEXT' }>
}) {
  const cfg = i.rendererConfig ?? {}

  const style: React.CSSProperties = {
    padding: cfg.padding ?? 0,
    fontSize: cfg.fontSize
      ? typeof cfg.fontSize === 'number'
        ? `${cfg.fontSize}px`
        : (fontSizeMap[cfg.fontSize] ?? '1rem')
      : '1rem',
    color: cfg.color ?? '#000000',
    fontWeight:
      cfg.fontWeight === 'medium'
        ? 500
        : cfg.fontWeight === 'semibold'
          ? 600
          : cfg.fontWeight === 'bold'
            ? 700
            : (cfg.fontWeight ?? 'normal'),
    textAlign: cfg.textAlign ?? 'left',
    ...(cfg.truncate && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
  }

  return (
    <div className="w-full h-full overflow-hidden flex items-center">
      {/* {!!i.rendererConfig.label && <Text>i.rendererConfig?.label</Text>} */}
      <div className="flex-1" style={style}>
        {cell ? cell.value : 'DEFAULT'}
      </div>
    </div>
  )
}

const fontSizeValues: Extract<
  TextLayoutItem['rendererConfig']['fontSize'],
  string
>[] = ['xs', 'sm', 'lg', 'xl', '2xl', '3xl']
const fontWeightValues: {
  label: string
  value: Extract<TextLayoutItem['rendererConfig']['fontWeight'], string>
}[] = [
  { value: 'normal', label: '正常' },
  { value: 'medium', label: '中等' },
  { value: 'semibold', label: '半粗' },
  { value: 'bold', label: '粗体' },
]

function CellTextConfig() {
  const { control } = useFormContext<ValueType>()
  const { currentEdittingItemId } = useEditorContext()
  const layoutItems = useWatch({ control, name: 'layout.layoutItems' })
  const itemIdx = useMemo(() => {
    if (!layoutItems) return -1
    return layoutItems.findIndex(i => i.id === currentEdittingItemId)
  }, [currentEdittingItemId, layoutItems])

  if (itemIdx === -1) return null

  return (
    <Flex key={layoutItems[itemIdx].id} direction="column" gap="md" p="sm">
      {/* 字體大小 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${itemIdx}.rendererConfig.fontSize`}
        render={({ field }) => (
          <Select
            {...field}
            value={field.value ?? 'md'}
            data={fontSizeValues}
          />
        )}
      />

      {/* 字體粗度 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${itemIdx}.rendererConfig.fontWeight`}
        render={({ field }) => (
          <Select
            {...field}
            value={field.value ?? 'normal'}
            data={fontWeightValues}
          />
        )}
      />

      {/* 字體顏色 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${itemIdx}.rendererConfig.color`}
        render={({ field }) => (
          <ColorInput
            {...field}
            value={field.value ?? '#ffffff'}
            format="hex"
            swatches={colors}
          />
        )}
      />

      {/* 超出截断（单行） */}
      <Controller
        control={control}
        name={`layout.layoutItems.${itemIdx}.rendererConfig.truncate`}
        render={({ field }) => (
          <Switch
            label=""
            checked={field.value || false}
            onChange={event => field.onChange(event.currentTarget.checked)}
          />
        )}
      />

      {/* 對其位置 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${itemIdx}.rendererConfig.textAlign`}
        render={({ field }) => (
          <SegmentedControl
            {...field}
            data={[
              { value: 'left', label: '左' },
              { value: 'center', label: '中' },
              { value: 'right', label: '右' },
            ]}
            value={field.value || 'left'}
          />
        )}
      />

      {/* 内边距 (px)  */}
      <Controller
        control={control}
        name={`layout.layoutItems.${itemIdx}.rendererConfig.padding`}
        render={({ field }) => (
          <NumberInput
            placeholder="例如 8"
            min={0}
            max={32}
            {...field}
            value={field.value || 0}
            onChange={val => field.onChange(val || 0)}
          />
        )}
      />
    </Flex>
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
