'use client'

import { Column, DataType } from '@/types/main'
import { useState } from 'react'
import {
  ActionIcon,
  Avatar,
  Box,
  Card,
  Flex,
  Select,
  TextInput,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconArrowRight,
  IconGripVertical,
  IconPlus,
} from '@tabler/icons-react'
import clsx from 'clsx'
import { nanoid } from 'nanoid'
import { Control, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { columnIdKey, columnTypeKey } from '@/constants/editor'
import { ValueType } from '../page'

const ValidColumnTypes: DataType[] = [
  'STRING',
  'NUMBER',
  'IMAGE',
  'BUTTON',
  'ARRAY_STRING',
  'DATE',
  'BOOLEAN',
  'NONE',
]

export function ColumnSideBar({ control }: { control: Control<ValueType> }) {
  const [openColumn, setOpenColumn] = useState(true)

  const { fields, append } = useFieldArray({
    control,
    name: 'columns',
  })
  const columns = useWatch({ control, name: 'columns' })

  const handleDrag = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    const { dataType, id } = columns[idx]
    e.dataTransfer.setData(columnTypeKey, dataType)
    e.dataTransfer.setData(columnIdKey, id)
  }

  return (
    <section className="h-full border-r border-gray-700 ">
      <Flex gap={1}>
        <Box
          className={clsx(
            'overflow-hidden transition-all',
            openColumn ? 'w-70' : 'w-11'
          )}
        >
          <Flex className="p-2" justify="space-between">
            {openColumn && (
              <ActionIcon
                size="sm"
                variant="default"
                onClick={() =>
                  append({
                    id: nanoid(),
                    name: '',
                    dataType: 'STRING',
                  })
                }
              >
                <IconPlus />
              </ActionIcon>
            )}

            <ActionIcon
              size="sm"
              variant="default"
              onClick={() => setOpenColumn(!openColumn)}
            >
              {openColumn ? <IconArrowLeft /> : <IconArrowRight />}
            </ActionIcon>
          </Flex>

          <Box>
            {fields.map((field, idx) => (
              <Card
                key={field.id}
                p={0}
                radius={0}
                withBorder
                draggable={openColumn}
                onDragStart={e => handleDrag(e, idx)}
              >
                <Flex className="p-2" align="center" gap="md">
                  <Avatar size="sm">{idx + 1}</Avatar>

                  <Controller
                    control={control}
                    name={`columns.${idx}.name`}
                    render={({ field }) => (
                      <TextInput
                        placeholder="欄位名稱"
                        defaultValue={field.value}
                        onBlur={e => field.onChange(e.target.value)}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name={`columns.${idx}.dataType`}
                    render={({ field }) => (
                      <Select
                        placeholder="資料類型"
                        data={ValidColumnTypes}
                        defaultValue={field.value}
                        onChange={value => field.onChange(value as DataType)}
                      />
                    )}
                  />

                  <Box
                    style={{
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <IconGripVertical size={18} />
                  </Box>
                </Flex>
              </Card>
            ))}
          </Box>
        </Box>
      </Flex>
    </section>
  )
}
