'use client'

import { Layout } from '@/types/main'
import { useState } from 'react'
import { ActionIcon, Avatar, Box, Card, Flex } from '@mantine/core'
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react'
import clsx from 'clsx'
import { Control, useFieldArray, useWatch } from 'react-hook-form'
import { ValueType } from '../page'

export function ConfigSideBar({ layouts }: { layouts: Layout[] }) {
  const [isOpen, setIsOpenSide] = useState(true)

  return (
    <section className="h-full border-l border-gray-700 ">
      <Flex gap={1}>
        <Box
          className={clsx(
            'overflow-hidden transition-all',
            isOpen ? 'w-100' : 'w-11'
          )}
        >
          <Flex className="p-2" justify="space-between">
            <ActionIcon
              size="sm"
              variant="default"
              onClick={() => setIsOpenSide(!isOpen)}
            >
              {isOpen ? <IconArrowRight /> : <IconArrowLeft />}
            </ActionIcon>
          </Flex>
          <Box>
            {layouts.map(l => (
              <Card key={l.id} p={0} radius={0} withBorder>
                <Flex className="p-2" align="center" gap="md">
                  <Avatar size="sm">{l.id}</Avatar>
                </Flex>
              </Card>
            ))}
          </Box>
        </Box>
      </Flex>
    </section>
  )
}
