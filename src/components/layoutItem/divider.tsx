import { Divider, Flex, Input, SegmentedControl, Select } from '@mantine/core'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { DividerLayoutItem, VisualLayoutItem } from 'shared/main'
import { ValueType } from '../../app/editor/page'
import { useLayoutItemIndex } from './useLayoutItemIndex'

export function DividerRenderer({
  layoutItem: i,
}: {
  layoutItem: Extract<VisualLayoutItem, { renderer: 'DIVIDER' }>
}) {
  return (
    <div
      className=" w-full h-full flex justify-center"
      style={{
        flexDirection: i.rendererConfig.orientation
          ? i.rendererConfig.orientation === 'horizontal'
            ? 'column'
            : 'row'
          : 'column',
      }}
    >
      <Divider
        size={i.rendererConfig.size ?? 'sm'}
        orientation={i.rendererConfig.orientation ?? 'horizontal'}
        label={i.rendererConfig.label}
        labelPosition={i.rendererConfig.labelPosition}
      />
    </div>
  )
}

export function DividerConfigPanel() {
  const { control } = useFormContext<ValueType>()
  const layoutItems = useWatch({ control, name: 'layout.layoutItems' })
  const idx = useLayoutItemIndex()
  if (idx === -1) return null

  return (
    <Flex key={layoutItems[idx].id} direction="column" gap="md" p="sm">
      {/* 寬度 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${idx}.rendererConfig.size`}
        render={({ field }) => (
          <Select
            {...field}
            value={field.value ?? 'md'}
            data={
              [
                'lg',
                'md',
                'sm',
                'xl',
                'xs',
              ] satisfies DividerLayoutItem['rendererConfig']['size'][]
            }
          />
        )}
      />

      {/* 標籤 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${idx}.rendererConfig.label`}
        render={({ field }) => <Input {...field} />}
      />

      {/* 標籤位置 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${idx}.rendererConfig.labelPosition`}
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

      {/* 方向 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${idx}.rendererConfig.orientation`}
        render={({ field }) => (
          <SegmentedControl
            {...field}
            data={[
              { value: 'horizontal', label: '水平' },
              { value: 'vertical', label: '垂直' },
            ]}
            value={field.value || 'left'}
          />
        )}
      />
    </Flex>
  )
}
