import {
  ActionIcon,
  ActionIconProps,
  Box,
  Button,
  Dialog,
  Divider,
  Flex,
  Modal,
  PolymorphicComponentProps,
  Select,
  Text,
  Tooltip,
} from '@mantine/core'
import { useHotkeys, useHover } from '@mantine/hooks'
import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowBackUp,
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconBike,
  IconCaretDownFilled,
  IconCaretLeftFilled,
  IconCaretRightFilled,
  IconCaretUpFilled,
  IconCarouselHorizontal,
  IconCarouselVertical,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPinFilled,
  IconPinnedFilled,
  IconSquareNumber1,
  IconSquareNumber2,
  IconWindowMaximize,
  IconWindowMinimize,
} from '@tabler/icons-react'
import { getLabels } from '@/utils/doujinshiUtils'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'

const IconBtn = ({
  tooltip,
  children,
  ...rest
}: { tooltip: string } & PolymorphicComponentProps<
  'button',
  ActionIconProps
>) => {
  return (
    <Tooltip
      floatingStrategy="absolute"
      label={tooltip}
      openDelay={1000}
      transitionProps={{ duration: 300 }}
    >
      <ActionIcon size="lg" variant="light" {...rest}>
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
      label="圖片放大縮小"
      openDelay={400}
      transitionProps={{ duration: 400 }}
    >
      <ActionIcon.Group>
        <ActionIcon
          variant="light"
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
    <IconBtn tooltip="圖片貼合裝置寬度" onClick={() => setFullWidth()}>
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
      tooltip="圖片貼合裝置高度"
      onClick={() => setFullHeight()}
    >
      <IconArrowsVertical />
    </IconBtn>
  )
}

const ReadingDirectionController = () => {
  const isVertical = useDoujinshiStore(state => state.pageSetting.isVertical)
  const setPageSetting = useDoujinshiStore(state => state.setPageSetting)
  const toggleSideBar = useDoujinshiStore(state => state.toggleSideBar)

  const setReadingDirection = () => {
    if (isVertical) {
      setPageSetting(prev => ({
        ...prev,
        zoomRatio: 1,
        isVertical: false,
      }))
    } else {
      toggleSideBar(false)
      setPageSetting(prev => ({
        ...prev,
        zoomRatio: 0.5,
        isVertical: true,
      }))
    }
  }

  useHotkeys([['R', () => setReadingDirection()]])

  return (
    <IconBtn tooltip="切換直/橫閱讀" onClick={() => setReadingDirection()}>
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
      tooltip="全螢幕"
      color={isFullscreen ? 'yellow' : ''}
      onClick={() => setFullscreen()}
    >
      {!isFullscreen ? <IconWindowMinimize /> : <IconWindowMaximize />}
    </IconBtn>
  )
}

const SideBarController = () => {
  const isVertical = useDoujinshiStore(state => state.pageSetting.isVertical)
  const sideBarOpen = useDoujinshiStore(state => state.sideBarOpen)
  const toggleSideBar = useDoujinshiStore(state => state.toggleSideBar)

  return (
    <IconBtn
      tooltip="打開側邊欄"
      disabled={isVertical}
      onClick={() => toggleSideBar()}
      color={sideBarOpen ? 'yellow' : ''}
    >
      {sideBarOpen ? (
        <IconLayoutSidebarLeftExpand />
      ) : (
        <IconLayoutSidebarLeftCollapse />
      )}
    </IconBtn>
  )
}

const PageDisplayController = () => {
  const pageCount = useDoujinshiStore(state => state.pageSetting.pageCount)
  const isVertical = useDoujinshiStore(state => state.pageSetting.isVertical)
  const setPageSetting = useDoujinshiStore(state => state.setPageSetting)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const setCurPageLabel = useDoujinshiStore(s => s.setCurPageLabel)
  const pagination = useDoujinshiStore(s => s.pagination)
  const { goToSpecificPage } = useGoTo()

  const onChagePageDisplay = () => {
    if (!pagination || !curDoujinshi) return
    const labels = getLabels({
      doujin: curDoujinshi,
      pageCount: pageCount === 1 ? 2 : 1,
      curLabel: curPageLabel.split('-')[0],
    }).labels
    setCurPageLabel(labels)
    setPageSetting(prev => ({ ...prev, pageCount: pageCount === 1 ? 2 : 1 }))
    goToSpecificPage(labels)
  }

  useHotkeys([['D', () => onChagePageDisplay()]])

  return (
    <IconBtn
      disabled={isVertical}
      tooltip="切換單/雙畫面"
      onClick={() => onChagePageDisplay()}
    >
      {pageCount === 1 ? <IconSquareNumber1 /> : <IconSquareNumber2 />}
    </IconBtn>
  )
}

export default function ToolBar() {
  const pagination = useDoujinshiStore(s => s.pagination)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const { goToGallery, goToPage, goToSpecificPage } = useGoTo()
  const { hovered: targetHover, ref: targetRef } = useHover()
  const { hovered: menuHovered, ref: menuRef } = useHover()
  const [pinToolBar, setPinToolBar] = useState(false)

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
    goToSpecificPage(labels)
    setIsOpenJumpToModal(false)
  }

  useHotkeys([
    ['Backspace', () => goToGallery()],
    ['ArrowLeft', () => goToPage(1)],
    ['ArrowRight', () => goToPage(-1)],
    ['M', () => setPinToolBar(!pinToolBar)],
    ['G', () => setIsOpenJumpToModal(!isOpenJumpToModal)],
  ])

  if (!pagination) return null

  return (
    <>
      <Box
        ref={targetRef}
        pos="fixed"
        right={0}
        bottom="20px"
        w="100%"
        h="10%"
      />

      <Dialog
        position={{ bottom: 20, right: 20 }}
        w="fit-content"
        ref={menuRef}
        size="lg"
        p="lg"
        radius="lg"
        opened={pinToolBar || targetHover || menuHovered}
        // keepMounted
        // opacity={0.5}
      >
        <Flex gap="md">
          {/* 返回首頁 */}
          <IconBtn tooltip="返回首頁" onClick={() => goToGallery()}>
            <IconArrowBackUp />
          </IconBtn>

          <Divider orientation="vertical" />

          {/* 下一頁 */}
          <IconBtn tooltip="下一頁" onClick={() => goToPage(1)}>
            <IconCaretLeftFilled />
          </IconBtn>

          {/* 上一頁 */}
          <IconBtn tooltip="上一頁" onClick={() => goToPage(-1)}>
            <IconCaretRightFilled />
          </IconBtn>

          <Divider orientation="vertical" />

          <FitWidthController />

          <FitHeightController />

          <ImageRatioController />

          <Divider orientation="vertical" />

          <ReadingDirectionController />

          {/* 單雙畫面 */}
          <PageDisplayController />

          <Divider orientation="vertical" />

          <SideBarController />

          <IconBtn tooltip="" onClick={() => setIsOpenJumpToModal(!pinToolBar)}>
            <IconBike />
          </IconBtn>

          <Divider orientation="vertical" />

          <FullScreenController />

          <Divider orientation="vertical" />

          <IconBtn
            tooltip="固定菜單"
            color={pinToolBar ? 'yellow' : ''}
            onClick={() => setPinToolBar(!pinToolBar)}
          >
            {pinToolBar ? <IconPinnedFilled /> : <IconPinFilled />}
          </IconBtn>
        </Flex>
      </Dialog>

      <Modal
        opened={isOpenJumpToModal}
        onClose={() => setIsOpenJumpToModal(false)}
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
