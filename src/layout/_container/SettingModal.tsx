import { Fragment, SetStateAction } from 'react'
import {
  Divider,
  Flex,
  Grid,
  Modal,
  Select,
  Slider,
  Text,
  Title,
} from '@mantine/core'
import { useDoujinshiStore } from '@/store/doujinshiStore'

export default function SettingModal({
  openSetting,
  setOpenSetting,
}: {
  openSetting: boolean
  setOpenSetting: (value: SetStateAction<boolean>) => void
}) {
  const detailCountPerRows = useDoujinshiStore(s => s.detailCountPerRows)
  const setDetailCountPerRows = useDoujinshiStore(s => s.setDetailCountPerRows)
  const toolBarOpacity = useDoujinshiStore(s => s.toolBarOpacity)
  const setToolBarOpacity = useDoujinshiStore(s => s.setToolBarOpacity)

  return (
    <Modal
      title="全局設定"
      size="lg"
      opened={openSetting}
      onClose={() => setOpenSetting(false)}
    >
      <Title order={3}>同人誌</Title>
      <Divider size="xs" my="md" />
      <Grid mt="md" gutter="xl">
        <Grid.Col span={6}>
          <Flex h="100%" align="center">
            <Text size="sm">同人誌詳情頁每 Row 數量</Text>
          </Flex>
        </Grid.Col>
        <Grid.Col span={6}>
          <Select
            checkIconPosition="right"
            allowDeselect={false}
            data={['5', '6', '7', '8', '9', '10']}
            defaultValue={detailCountPerRows.toString()}
            onChange={e => setDetailCountPerRows(Number(e))}
          />
        </Grid.Col>

        <Divider size="xs" my="md" />

        <Grid.Col span={6}>
          <Flex h="100%" align="center">
            <Text size="sm">檢視頁工具列透明度</Text>
          </Flex>
        </Grid.Col>
        <Grid.Col span={6}>
          <Slider
            step={0.1}
            min={0.1}
            max={1}
            marks={[{ value: 0.5 }]}
            defaultValue={toolBarOpacity}
            onChange={val => setToolBarOpacity(val)}
          />
        </Grid.Col>
      </Grid>
    </Modal>
  )
}
