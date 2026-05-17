import { useState } from 'react'
import { Button, Flex, Select, Switch } from '@mantine/core'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Column, Layout } from 'shared/main'
import { CellRenderer } from '../_component/displayItem'

export function PreviewContainer({
  layoutItems,
  columns,
  setIsPreviewMode,
}: {
  layoutItems: Layout['layoutItems']
  columns: Column[]
  setIsPreviewMode: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { control } = useForm({
    defaultValues: {
      autoWidth: false,
      rowCount: '3',
    },
  })
  const rowCount = useWatch({ control, name: 'rowCount' })
  const autoWidth = useWatch({ control, name: 'autoWidth' })
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
              name="rowCount"
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
        style={{ gridTemplateColumns: `repeat(${rowCount}, 1fr)`, gap: '20px' }}
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
                  <CellRenderer columns={columns} layoutItem={i} />
                </div>
              ))}
            </div>
          )
        })}
      </main>
    </>
  )
}
