import { Box, Center, Flex, ScrollArea } from '@mantine/core'
import { Img } from '@/components/Img'
import LoadingContainer from '@/components/LoadingContainer'
import useFetchChuckImages from '@/hooks/doujinshi/useFetchChuckImages'
import { useGoTo } from '@/hooks/doujinshi/useGoTo'
import { useDoujinshiStore } from '@/store/doujinshiStore'
import { getImagePath } from '@/utils'

export default function HorizonReadingContainer() {
  const isFullWidth = useDoujinshiStore(s => s.pageSetting.isFullWidth)
  const isFullHeight = useDoujinshiStore(s => s.pageSetting.isFullHeight)
  const zoomRatio = useDoujinshiStore(s => s.pageSetting.zoomRatio)
  const pageCount = useDoujinshiStore(s => s.pageSetting.pageCount)
  const pagination = useDoujinshiStore(s => s.pagination)
  const curPageLabel = useDoujinshiStore(s => s.curPageLabel)
  const curDoujinshi = useDoujinshiStore(s => s.curDoujinshi)
  const { goToPage } = useGoTo()

  // const { imagesList } = useFetchChuckImages(10)

  console.log('horizon', curPageLabel)
  if (
    // !imagesList ||
    // imagesList.every(d => d.imageUrl === undefined) ||
    !pagination ||
    !curDoujinshi
  ) {
    return <LoadingContainer />
  }

  return (
    <ScrollArea w="100vw" h="100vh" type="always">
      <Center h="100%" w="100%">
        <Flex
          direction="row-reverse"
          {...(!isFullHeight && !isFullWidth && { h: `${zoomRatio * 100}vh` })}
        >
          {curPageLabel
            .split('-')
            .filter(Boolean)
            .map((_, idx) => {
              const page = curDoujinshi.meta.pages[pagination.curPageIdxs[idx]]
              console.log(page, pagination)

              if (!page) return null

              return (
                <Box
                  key={idx}
                  {...(pageCount === 2 && isFullWidth && { w: '50vw' })}
                  {...(pageCount === 1 && isFullWidth && { w: '100vw' })}
                  {...(isFullHeight && { h: '100vh' })}
                >
                  <Img
                    fit="contain"
                    onClick={() => goToPage(1)}
                    alt={getImagePath(curDoujinshi, page.title)}
                    src={getImagePath(curDoujinshi, page.title)}
                  />
                </Box>
              )
            })}
        </Flex>
      </Center>
    </ScrollArea>
  )
}
