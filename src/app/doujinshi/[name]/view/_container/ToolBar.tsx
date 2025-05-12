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
import { useDoujinshi } from '@/context/doujinshiContext'
import { useMainData } from '@/context/mainContext'
import { getLabels } from '@/utils/doujinshiUtils'

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
  const { doujinshiPageSetting, setDoujinshiPageSetting } = useMainData()

  const setZoomRatio = (v: number) => {
    if (v > 5 || v < 0.1) return
    setDoujinshiPageSetting(prev => ({
      ...prev,
      isFullWidth: false,
      isFullHeight: false,
      zoomRatio: Number(v.toFixed(1)),
    }))
  }

  useHotkeys([
    ['=', () => setZoomRatio(doujinshiPageSetting.zoomRatio + 0.1)],
    ['-', () => setZoomRatio(doujinshiPageSetting.zoomRatio - 0.1)],
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
          onClick={() => setZoomRatio(doujinshiPageSetting.zoomRatio - 0.1)}
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
          {doujinshiPageSetting.zoomRatio.toFixed(1)}
        </ActionIcon.GroupSection>
        <ActionIcon
          variant="light"
          size="lg"
          onClick={() => setZoomRatio(doujinshiPageSetting.zoomRatio + 0.1)}
        >
          <IconCaretUpFilled />
        </ActionIcon>
      </ActionIcon.Group>
    </Tooltip>
  )
}

const FitWidthController = () => {
  const { doujinshiPageSetting, setDoujinshiPageSetting } = useMainData()

  const setFullWidth = () => {
    setDoujinshiPageSetting(prev => ({
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
  const { doujinshiPageSetting, setDoujinshiPageSetting } = useMainData()

  const setFullHeight = () => {
    setDoujinshiPageSetting(prev => ({
      ...prev,
      isFullWidth: false,
      isFullHeight: true,
      zoomRatio: 1,
    }))
  }

  useHotkeys([['H', () => setFullHeight()]])

  return (
    <IconBtn
      disabled={doujinshiPageSetting.isVertical}
      tooltip="圖片貼合裝置高度"
      onClick={() => setFullHeight()}
    >
      <IconArrowsVertical />
    </IconBtn>
  )
}

const ReadingDirectionController = () => {
  const { doujinshiPageSetting, setDoujinshiPageSetting } = useMainData()

  const setReadingDirection = () => {
    setDoujinshiPageSetting(prev => ({
      ...prev,
      isFullWidth: false,
      isFullHeight: false,
      zoomRatio: prev.isVertical ? 1 : 0.5,
      isVertical: !prev.isVertical,
    }))
  }

  useHotkeys([['R', () => setReadingDirection()]])

  return (
    <IconBtn tooltip="切換直/橫閱讀" onClick={() => setReadingDirection()}>
      {doujinshiPageSetting.isVertical ? (
        <IconCarouselHorizontal />
      ) : (
        <IconCarouselVertical />
      )}
    </IconBtn>
  )
}

const FullScreenController = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const setFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  useHotkeys([['F', () => setFullscreen()]])

  return (
    <IconBtn tooltip="全螢幕" onClick={() => setFullscreen()}>
      {!isFullscreen ? <IconWindowMaximize /> : <IconWindowMinimize />}
    </IconBtn>
  )
}

const SideBarController = () => {
  const { doujinshiPageSetting } = useMainData()
  const { openSideBar, setOpenSideBar } = useDoujinshi()

  return (
    <IconBtn
      tooltip="打開側邊欄"
      disabled={doujinshiPageSetting.isVertical}
      onClick={() => setOpenSideBar(!openSideBar)}
    >
      {openSideBar ? (
        <IconLayoutSidebarLeftCollapse />
      ) : (
        <IconLayoutSidebarLeftExpand />
      )}
    </IconBtn>
  )
}

const PageDisplayController = () => {
  const { doujinshiPageSetting, setDoujinshiPageSetting } = useMainData()

  const { curDoujinshi, curPageLabel, pagination, goToSpecificPage } =
    useDoujinshi()

  const setCurPageLabel = () => {
    if (!pagination || !curDoujinshi) return
    if (doujinshiPageSetting.pageCount === 1) {
      const labels = getLabels({
        doujin: curDoujinshi,
        pageCount: 2,
        curLabel: curPageLabel,
      }).labels
      goToSpecificPage(labels)
      setDoujinshiPageSetting(prev => ({ ...prev, pageCount: 2 }))
    } else {
      const labels = getLabels({
        doujin: curDoujinshi,
        pageCount: 1,
        curLabel: curPageLabel,
      }).labels
      goToSpecificPage(labels)
      setDoujinshiPageSetting(prev => ({ ...prev, pageCount: 1 }))
    }
  }

  useHotkeys([['D', () => setCurPageLabel()]])

  return (
    <IconBtn
      disabled={doujinshiPageSetting.isVertical}
      tooltip="切換單/雙畫面"
      onClick={() => setCurPageLabel()}
    >
      {curPageLabel.split('-').length === 1 ? (
        <IconSquareNumber1 />
      ) : (
        <IconSquareNumber2 />
      )}
    </IconBtn>
  )
}

export default function ToolBar() {
  const { doujinshiPageSetting } = useMainData()
  const { goToGallery, pagination, goToPage, goToSpecificPage, curPageLabel } =
    useDoujinshi()
  const { hovered: targetHover, ref: targetRef } = useHover()
  const { hovered: menuHovered, ref: menuRef } = useHover()
  const [pinToolBar, setPinToolBar] = useState(false)

  const [isOpenJumpToModal, setIsOpenJumpToModal] = useState(false)

  const curPageData = useMemo(() => {
    if (!pagination) return undefined
    return pagination.allPageList.find(d => curPageLabel.startsWith(d.value))
  }, [curPageLabel, pagination])

  const jumpToPage = (v: string) => {
    if (!pagination) return
    goToSpecificPage(v.split('-')[0])
    setIsOpenJumpToModal(false)
  }

  useHotkeys([
    ['Backspace', () => goToGallery()],
    ['ArrowLeft', () => goToPage(1)],
    ['ArrowRight', () => goToPage(-1)],
    ['M', () => setPinToolBar(!pinToolBar)],
    ['G', () => setIsOpenJumpToModal(!isOpenJumpToModal)],
  ])

  if (!pagination || !curPageData) return null

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

          <Button
            size="sm"
            variant="light"
            onClick={() => setIsOpenJumpToModal(true)}
          >
            <Text size="sm">{curPageData.label} 頁</Text>
          </Button>

          <Divider orientation="vertical" />

          <FullScreenController />

          <Divider orientation="vertical" />

          <IconBtn
            tooltip="固定菜單"
            onClick={() => setPinToolBar(!pinToolBar)}
          >
            {pinToolBar ? <IconPinFilled /> : <IconPinnedFilled />}
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
          defaultValue={curPageData.value}
          nothingFoundMessage="Nothing found..."
          onChange={e => jumpToPage(e ?? '1')}
        />
      </Modal>
    </>
  )
}
