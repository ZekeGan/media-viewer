import { ActionIcon, Box, Button, Dialog, Divider, Flex, Modal, Select, Text } from '@mantine/core'
import { useHover } from '@mantine/hooks'
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
  IconPinFilled,
  IconPinnedFilled,
  IconSquareNumber1,
  IconSquareNumber2,
  IconWindowMaximize,
  IconWindowMinimize,
} from '@tabler/icons-react'
import { useDoujinshi } from '@/context/doujinshiContext'

export default function ToolBar() {
  const {
    goToGallery,
    pagination,
    goToSpecificPage,
    goToPage,
    pageCount,
    setPageCount,
    curPageLabel,
    imageAttrs,
    setImageAttrs,
  } = useDoujinshi()
  const [isOpenJumpToModal, setIsOpenJumpToModal] = useState(false)
  const { hovered: targetHover, ref: targetRef } = useHover()
  const { hovered: menuHovered, ref: menuRef } = useHover()
  const [pinToolBar, setPinToolBar] = useState(false)

  const curPageData = useMemo(() => {
    if (!pagination) return undefined
    return pagination.allPageList.find(d => curPageLabel.startsWith(d.value))
  }, [curPageLabel, pagination])

  // 設定全螢幕
  const [isFullscreen, setIsFullscreen] = useState(false)
  const setFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const setFullWidth = () => {
    setImageAttrs(prev => ({ ...prev, isFullWidth: true, isFullHeight: false, zoomRatio: 1 }))
  }

  const setFullHeight = () => {
    setImageAttrs(prev => ({ ...prev, isFullWidth: false, isFullHeight: true, zoomRatio: 1 }))
  }

  const setZoomRatio = (v: number) => {
    if (v > 5 || v < 0.1) return
    setImageAttrs(prev => ({
      ...prev,
      isFullWidth: false,
      isFullHeight: false,
      zoomRatio: Number(v.toFixed(1)),
    }))
  }

  const setReadingDirection = () => {
    setFullHeight()
    setImageAttrs(prev => ({
      ...prev,
      isSinglePage: true,
      isVertical: !prev.isVertical,
    }))
  }

  const jumpToPage = (v: string) => {
    if (!pagination) return
    goToSpecificPage(v.split('-')[0])
    setIsOpenJumpToModal(false)
  }

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
        style={{ zIndex: 99999 }}
      />
      <Dialog
        position={{ bottom: 20, right: 20 }}
        keepMounted
        w="fit-content"
        ref={menuRef}
        size="lg"
        p="lg"
        radius="lg"
        opened={pinToolBar || targetHover || menuHovered}
      >
        <Flex gap="md">
          {/* 返回首頁 */}
          <ActionIcon size="lg" variant="light" onClick={() => goToGallery()}>
            <IconArrowBackUp />
          </ActionIcon>

          <Divider orientation="vertical" />

          {/* 下一頁 */}
          <ActionIcon size="lg" variant="light" onClick={() => goToPage(1)}>
            <IconCaretLeftFilled />
          </ActionIcon>

          {/* 上一頁 */}
          <ActionIcon size="lg" variant="light" onClick={() => goToPage(-1)}>
            <IconCaretRightFilled />
          </ActionIcon>

          <Divider orientation="vertical" />

          {/* 適應寬 */}
          <ActionIcon size="lg" variant="light" onClick={() => setFullWidth()}>
            <IconArrowsHorizontal />
          </ActionIcon>

          {/* 適應高 */}
          <ActionIcon size="lg" variant="light" onClick={() => setFullHeight()}>
            <IconArrowsVertical />
          </ActionIcon>

          {/* 比例縮放 */}
          <ActionIcon.Group>
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => setZoomRatio(imageAttrs.zoomRatio - 0.1)}
            >
              <IconCaretDownFilled />
            </ActionIcon>
            <ActionIcon.GroupSection
              variant="default"
              p={0}
              size="lg"
              miw={60}
              onClick={() => {
                setFullHeight()
                setZoomRatio(1)
              }}
              style={{ userSelect: 'none', cursor: 'pointer' }}
            >
              {imageAttrs.zoomRatio.toFixed(1)}
            </ActionIcon.GroupSection>
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => setZoomRatio(imageAttrs.zoomRatio + 0.1)}
            >
              <IconCaretUpFilled />
            </ActionIcon>
          </ActionIcon.Group>

          <Divider orientation="vertical" />

          {/* 直橫閱讀 */}
          <ActionIcon size="lg" variant="light" onClick={() => setReadingDirection()}>
            {imageAttrs.isVertical ? <IconCarouselHorizontal /> : <IconCarouselVertical />}
          </ActionIcon>

          {/* 單雙畫面 */}
          {!imageAttrs.isVertical && (
            <ActionIcon
              size="lg"
              variant="light"
              onClick={() => {
                setPageCount(pageCount === 1 ? 2 : 1)
              }}
            >
              {pageCount === 1 ? <IconSquareNumber1 /> : <IconSquareNumber2 />}
            </ActionIcon>
          )}

          <Divider orientation="vertical" />

          {/* 全螢幕 */}
          <ActionIcon size="lg" variant="light" onClick={() => setFullscreen()}>
            {!isFullscreen ? <IconWindowMaximize /> : <IconWindowMinimize />}
          </ActionIcon>

          {/* 跳轉至 */}
          <Button w="150px" size="sm" variant="light" onClick={() => setIsOpenJumpToModal(true)}>
            <Text size="sm">{curPageData.label} 頁</Text>
          </Button>

          <Divider orientation="vertical" />

          <ActionIcon size="lg" variant="transparent" onClick={() => setPinToolBar(!pinToolBar)}>
            {pinToolBar ? <IconPinFilled /> : <IconPinnedFilled />}
          </ActionIcon>
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
