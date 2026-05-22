import {
  ColorInput,
  Flex,
  NumberInput,
  SegmentedControl,
  Select,
  Switch,
} from '@mantine/core'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { CellString, DataLayoutItem, TextLayoutItem } from 'shared/main'
import { colors } from '@/constants/editor'
import { ValueType } from '../../app/editor/page'
import { useLayoutItemIndex } from './useLayoutItemIndex'

// Text
const fontSizeMap: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
}

export function TextRenderer({
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

export function TextConfigPanel() {
  const { control } = useFormContext<ValueType>()
  const layoutItems = useWatch({ control, name: 'layout.layoutItems' })
  const idx = useLayoutItemIndex()
  if (idx === -1) return null

  return (
    <Flex key={layoutItems[idx].id} direction="column" gap="md" p="sm">
      {/* 字體大小 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${idx}.rendererConfig.fontSize`}
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
        name={`layout.layoutItems.${idx}.rendererConfig.fontWeight`}
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
        name={`layout.layoutItems.${idx}.rendererConfig.color`}
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
        name={`layout.layoutItems.${idx}.rendererConfig.truncate`}
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
        name={`layout.layoutItems.${idx}.rendererConfig.textAlign`}
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
        name={`layout.layoutItems.${idx}.rendererConfig.padding`}
        render={({ field }) => (
          <NumberInput
            placeholder=""
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
