import { Flex, Select } from '@mantine/core'
import { format } from 'date-fns'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { CellDate, DateTextLayoutItem } from 'shared/main'
import { ValueType } from '../../app/editor/page'
import { useLayoutItemIndex } from './useLayoutItemIndex'

// 日期显示组件
export function DateTextRenderer({
  cell,
  layoutItem,
}: {
  cell: CellDate | undefined
  layoutItem: DateTextLayoutItem
}) {
  const cfg = layoutItem.rendererConfig ?? {}
  const formatStr = cfg.format ?? '/MM/DD'

  let displayValue = ''
  if (true) {
    try {
      displayValue = format(new Date(2000, 1, 1), formatStr)
    } catch {
      displayValue = '無效日期'
    }
  } else {
    displayValue = '—'
  }

  return (
    <div className="w-full h-full overflow-hidden flex items-center gap-1">
      <span>{displayValue}</span>
    </div>
  )
}

export function DateTextConfigPanel() {
  const { control } = useFormContext<ValueType>()
  const layoutItems = useWatch({ control, name: 'layout.layoutItems' })
  const idx = useLayoutItemIndex()
  if (idx === -1) return null

  return (
    <Flex key={layoutItems[idx].id} direction="column" gap="md" p="sm">
      {/* 日期格式 */}
      <Controller
        control={control}
        name={`layout.layoutItems.${idx}.rendererConfig.format`}
        render={({ field }) => (
          <Select
            {...field}
            label="日期格式"
            placeholder="選擇或自訂格式"
            data={[
              { value: 'yyyy/MM/dd', label: '2025/01/01' },
              { value: 'yyyy-MM-dd', label: '2025-01-01' },
              { value: 'yyyy年MM月dd日', label: '2025年01月01日' },
              { value: 'MM/dd', label: '01/01' },
            ]}
            value={field.value ?? 'yyyy/MM/dd'}
          />
        )}
      />
    </Flex>
  )
}
