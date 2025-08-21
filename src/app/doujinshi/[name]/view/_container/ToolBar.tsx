import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  ActionIconProps,
  Box,
  Divider,
  Flex,
  Menu,
  Modal,
  PolymorphicComponentProps,
  ScrollArea,
  Select,
  Stack,
  Tooltip,
} from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import {
  IconArrowBackUp,
  IconArrowsHorizontal,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconArrowsVertical,
  IconBounceLeft,
  IconCaretDownFilled,
  IconCaretLeftFilled,
  IconCaretRightFilled,
  IconCaretUpFilled,
  IconCarouselHorizontal,
  IconCarouselVertical,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSquareNumber1,
  IconSquareNumber2,
  IconTool,
} from '@tabler/icons-react'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getLabels } from '@/utils/doujinshiUtils'

const IconBtn = ({
  toggleStyle,
  tooltip,
  children,
  ...rest
}: { tooltip: string; toggleStyle?: boolean } & PolymorphicComponentProps<
  'button',
  ActionIconProps
>) => {
  return (
    <Tooltip
      floatingStrategy="absolute"
      label={tooltip}
      openDelay={500}
      transitionProps={{ duration: 200 }}
    >
      <ActionIcon
        color={toggleStyle ? 'yellow' : 'gray'}
        variant="subtle"
        {...rest}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  )
}

const ImageRatioController = () => {
  const zoomRatio = useDoujinshiStore(s => s.pageSetting.zoomRatio)
  const setPageSetting = useDoujinshiStore(s => s.setPageSetting)

  const setZoomRatio = (v: number) => {
    if (v > 5 || v < 0.1) return
    setPageSetting(prev => ({
      ...prev,
      isFullWidth: false,
      isFullHeight: false,
      zoomRatio: Number(v.toFixed(1)),
    }))
  }

  useHotkeys([
    ['=', () => setZoomRatio(zoomRatio + 0.1)],
    ['-', () => setZoomRatio(zoomRatio - 0.1)],
  ])

  return (
    <Tooltip
      label="圖片放大縮小 / -  +"
      openDelay={400}
      transitionProps={{ duration: 400 }}
    >
      <ActionIcon.Group>
        <ActionIcon
          variant="light"
          color="gray"
          size="lg"
          onClick={() => setZoomRatio(zoomRatio - 0.1)}
        >
          <IconCaretDownFilled />
        </ActionIcon>
        <ActionIcon.GroupSection
          p={0}
          variant="default"
          size="lg"
          miw={60}
          onClick={() => setZoomRatio(1)}
          style={{ userSelect: 'none', cursor: 'pointer' }}
        >
          {zoomRatio.toFixed(1)}
        </ActionIcon.GroupSection>
        <ActionIcon
          variant="light"
          size="lg"
          color="gray"
          onClick={() => setZoomRatio(zoomRatio + 0.1)}
        >
          <IconCaretUpFilled />
        </ActionIcon>
      </ActionIcon.Group>
    </Tooltip>
  )
}

const FitWidthController = () => {
  const setPageSetting = useDoujinshiStore(s => s.setPageSetting)

  const setFullWidth = () => {
    setPageSetting(prev => ({
      ...prev,
      isFullWidth: true,
      isFullHeight: false,
      zoomRatio: 1,
    }))
  }

  useHotkeys([['W', () => setFullWidth()]])

  return (
    <IconBtn tooltip="圖片貼合裝置寬度 / W" onClick={() => setFullWidth()}>
      <IconArrowsHorizontal />
    </IconBtn>
  )
}

const FitHeightController = () => {
  const isVertical = useDoujinshiStore(s => s.pageSetting.isVertical)
  const setPageSetting = useDoujinshiStore(s => s.setPageSetting)

  const setFullHeight = () => {
    setPageSetting(prev => ({
      ...prev,
      isFullWidth: false,
      isFullHeight: true,
      zoomRatio: 1,
    }))
  }

  useHotkeys([['H', () => setFullHeight()]])

  return (
    <IconBtn
      disabled={isVertical}
      tooltip="圖片貼合裝置高度 / H"
      onClick={() => setFullHeight()}
    >
      <IconArrowsVertical />
    </IconBtn>
  )
}

const ReadingDirectionController = () => {
  const isVertical = useDoujinshiStore(state => state.pageSetting.isVertical)
  const setPageSetting = useDoujinshiStore(state => state.setPageSetting)

  const setReadingDirection = useCallback(() => {
    if (isVertical) {
      setPageSetting(prev => ({
        ...prev,
        zoomRatio: 1,
        isVertical: false,
      }))
    } else {
      setPageSetting(prev => ({
        ...prev,
        isVertical: true,
        zoomRatio: 0.5,
      }))
    }
  }, [isVertical, setPageSetting])

  useHotkeys([['R', () => setReadingDirection()]])

  return (
    <IconBtn tooltip="切換直(橫)閱讀 / R" onClick={() => setReadingDirection()}>
      {isVertical ? <IconCarouselHorizontal /> : <IconCarouselVertical />}
    </IconBtn>
  )
}

const FullScreenController = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [isFullscreen])

  const setFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  useHotkeys([['F', () => setFullscreen()]])

  return (
    <IconBtn
      tooltip="全螢幕 / F"
      toggleStyle={isFullscreen}
      onClick={() => setFullscreen()}
    >
      {!isFullscreen ? <IconArrowsMaximize /> : <IconArrowsMinimize />}
    </IconBtn>
  )
}

const PageDisplayController = () => {
  const pageCount = useDoujinshiStore(state => state.pageSetting.pageCount)
  const isVertical = useDoujinshiStore(state => state.pageSetting.isVertical)
  const setPageSetting = useDoujinshiStore(state => state.setPageSetting)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const pagination = useDoujinshiStore(s => s.pagination)
  const { setHash } = useGoTo()

  const onChagePageDisplay = () => {
    if (!pagination || !curDoujinshi) return
    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount: pageCount === 1 ? 2 : 1,
      curLabel: curPageLabel.split('-')[0],
    }).labels
    setPageSetting(prev => ({ ...prev, pageCount: pageCount === 1 ? 2 : 1 }))
    setHash(labels)
  }

  useHotkeys([['D', () => onChagePageDisplay()]])

  return (
    <IconBtn
      disabled={isVertical}
      tooltip="切換單(雙)畫面 / D"
      onClick={() => onChagePageDisplay()}
    >
      {pageCount === 1 ? <IconSquareNumber1 /> : <IconSquareNumber2 />}
    </IconBtn>
  )
}

const JumpToController = () => {
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const pagination = useDoujinshiStore(s => s.pagination)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const { setHash } = useGoTo()

  const [isOpenJumpToModal, setIsOpenJumpToModal] = useState(false)

  const curPageData = useMemo(() => {
    if (!pagination || !isOpenJumpToModal) return undefined
    return pagination.allPageList.find(d => curPageLabel.startsWith(d.value))
  }, [curPageLabel, pagination, isOpenJumpToModal])

  const jumpToPage = (v: string) => {
    if (!curDoujinshi) return
    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount,
      curLabel: v,
    }).labels
    setHash(labels)
    setIsOpenJumpToModal(false)
  }

  useHotkeys([['G', () => setIsOpenJumpToModal(!isOpenJumpToModal)]])

  if (!pagination) return null

  return (
    <>
      <IconBtn
        tooltip="前往頁數 / G"
        onClick={() => setIsOpenJumpToModal(true)}
      >
        <IconBounceLeft />
      </IconBtn>

      <Modal
        opened={isOpenJumpToModal}
        onClose={() => setIsOpenJumpToModal(false)}
        centered
        title="前往頁數"
      >
        <Select
          checkIconPosition="right"
          data={pagination.allPageList}
          defaultValue={curPageData?.value ?? ''}
          nothingFoundMessage="Nothing found..."
          onChange={e => jumpToPage(e ?? '1')}
        />
      </Modal>
    </>
  )
}

export default function ToolBar() {
  const pagination = useDoujinshiStore(s => s.pagination)
  const { goToGallery, goToPage } = useGoTo()

  const [opened, setOpened] = useState(false)

  useHotkeys([
    ['Backspace', () => goToGallery()],
    ['ArrowLeft', () => goToPage(1)],
    ['ArrowRight', () => goToPage(-1)],
  ])

  if (!pagination) return null

  return (
    <>
      <Menu
        opened={opened}
        onChange={setOpened}
        position="top-end"
        trigger="hover"
        keepMounted
        transitionProps={{ duration: 300, transition: 'slide-down' }}
      >
        <Menu.Target>
          <Box h="10vh" w="50vw" pos="fixed" right="0" bottom="0" />
        </Menu.Target>

        <Menu.Dropdown mt="10vh">
          <Flex align="center" gap="md" px="xs" py="5px">
            {/* 返回首頁 */}
            <IconBtn
              tooltip="返回首頁 / Backspace"
              onClick={() => goToGallery()}
            >
              <IconArrowBackUp />
            </IconBtn>

            <Divider orientation="vertical" />

            {/* 下一頁 */}
            <IconBtn tooltip="下一頁 / ←" onClick={() => goToPage(1)}>
              <IconCaretLeftFilled />
            </IconBtn>

            {/* 上一頁 */}
            <IconBtn tooltip="上一頁 / →" onClick={() => goToPage(-1)}>
              <IconCaretRightFilled />
            </IconBtn>

            <Divider orientation="vertical" />

            <FitWidthController />

            <FitHeightController />

            <ImageRatioController />

            <Divider orientation="vertical" />

            <ReadingDirectionController />

            <PageDisplayController />

            <Divider orientation="vertical" />

            <JumpToController />

            <Divider orientation="vertical" />

            <FullScreenController />
          </Flex>
        </Menu.Dropdown>
      </Menu>
    </>
  )
}
