'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Flex,
  Input,
  Modal,
  NumberInput,
  Text,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { Controller, useForm } from 'react-hook-form'
import { useAppStore } from '@/stores/mainStore'

type ValueType = {
  dataSearchDepth: number
  targetFolderPath: string
}

export function Navbar() {
  const router = useRouter()
  const { colors } = useMantineTheme()
  const [opened, { open, close }] = useDisclosure(false)

  const views = useAppStore(s => s.views)
  const activeViewId = useAppStore(s => s.activeViewId)
  const setActiveViewId = useAppStore(s => s.setActiveViewId)

  const { control, reset, handleSubmit } = useForm<ValueType>({
    defaultValues: { targetFolderPath: '', dataSearchDepth: 2 },
  })

  const selectFolder = async () => {
    const path = await window.electronApi.selectFolder()
    if (!path) return
    reset({ targetFolderPath: path })
  }

  const onSubmit = async ({ dataSearchDepth, targetFolderPath }: ValueType) => {
    await window.electronApi.createView(targetFolderPath, dataSearchDepth)
    close()
  }

  return (
    <>
      <nav
        className="flex justify-between border-b"
        style={{
          backgroundColor: colors.dark[8],
          borderBottomColor: colors.dark[4],
        }}
      >
        {Object.keys(views).map(k => (
          <div
            key={views[k].id}
            className="relatove h-full p-2 -mb-px cursor-pointer hover:bg-[#2e2e2e]"
            style={{
              backgroundColor:
                activeViewId === views[k].id ? colors.dark[7] : '',
            }}
            onClick={() => setActiveViewId(views[k].id)}
          >
            <Text className=" select-none">{views[k].name}</Text>
          </div>
        ))}
        <div className="ml-auto flex items-center">
          <button className="h-full px-2 hover:bg-[#2e2e2e]" onClick={open}>
            <IconPlus size={14} />
          </button>
          <button
            className="h-full px-2 hover:bg-[#2e2e2e]"
            onClick={() => router.push('/editor')}
          >
            <IconPencil size={14} />
          </button>
        </div>
      </nav>

      <Modal opened={opened} onClose={close} title="創建新視圖" centered>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="md">
            <Flex align="center" gap="md">
              <Controller
                control={control}
                name="targetFolderPath"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="目標資料夾位置"
                    className="flex-1"
                    rightSectionPointerEvents="all"
                    rightSection={
                      field.value ? (
                        <Input.ClearButton onClick={() => field.onChange('')} />
                      ) : null
                    }
                  />
                )}
              />

              <Button variant="default" onClick={() => selectFolder()}>
                選擇資料夾
              </Button>
            </Flex>

            <Controller
              control={control}
              name="dataSearchDepth"
              render={({ field }) => (
                <NumberInput {...field} label="資料搜尋深度" min={1} max={10} />
              )}
            />

            <Flex justify="end">
              <Button type="submit" color="dark">
                送出
              </Button>
            </Flex>
          </Flex>
        </form>
      </Modal>
    </>
  )
}
