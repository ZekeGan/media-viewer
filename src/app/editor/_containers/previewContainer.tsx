import { Button, Flex, Select, Switch } from '@mantine/core'
import { Controller, useForm, useFormContext, useWatch } from 'react-hook-form'
import { ValueType } from '../page'
import { LayoutItemRenderer } from '@/components/layoutItem'

export function PreviewContainer({
  setIsPreviewMode,
}: {
  setIsPreviewMode: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const methods = useFormContext<ValueType>()
  const columns = useWatch({ control: methods.control, name: 'columns' })
  const layoutItems = useWatch({
    control: methods.control,
    name: 'layout.layoutItems',
  })

  const { control } = useForm({
    defaultValues: {
      autoWidth: false,
      colCount: '3',
    },
  })
  const colCount = useWatch({ control, name: 'colCount' })
  const autoWidth = useWatch({ control, name: 'autoWidth' })

  if (!columns) return
  return (
    <>
      <nav className="p-2 border-b border-gray-700">
        <Flex gap="sm" justify="space-between">
          <Flex>
            <Button variant="default" onClick={() => setIsPreviewMode(false)}>
              返回
            </Button>
          </Flex>
          <Flex gap="sm" align="center">
            <Controller
              control={control}
              name="colCount"
              render={({ field }) => (
                <Select
                  {...field}
                  onChange={field.onChange}
                  data={['1', '2', '3', '4', '5']}
                />
              )}
            />
            <Controller
              control={control}
              name="autoWidth"
              render={({ field }) => (
                <Switch onChange={field.onChange} checked={field.value} />
              )}
            />
          </Flex>
        </Flex>
      </nav>

      <main
        className="w-full grid"
        style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: '20px' }}
      >
        {Array.from({ length: 10 }).map((i, idx) => {
          const maxW = Math.max(...layoutItems.map(i => i.grid.w))
          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxW}, ${autoWidth ? '1fr' : '50px'})`,
                gridAutoRows: '50px',
              }}
            >
              {layoutItems.map(i => (
                <div
                  key={i.id}
                  style={{
                    gridColumn: `${i.grid.x + 1}/ span ${i.grid.w}`,
                    gridRow: `${i.grid.y + 1}/ span ${i.grid.h}`,
                    height: `${i.grid.h * 50}px`,
                  }}
                >
                  <LayoutItemRenderer layoutItem={i} />
                </div>
              ))}
            </div>
          )
        })}
      </main>
    </>
  )
}
