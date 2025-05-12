import { Box, Center, Flex } from '@mantine/core'
import { useMainData } from '@/context/mainContext'
import { useDoujinshi } from '@/context/doujinshiContext'
import useFetchChuckImages from '@/hooks/useFetchChuckImages'
import LoadingContainer from '@/components/LoadingContainer'
import { Img } from '@/components/Img'

export default function HorizonReadingContainer() {
  const {
    doujinshiPageSetting: { pageCount, isFullHeight, isFullWidth, zoomRatio },
  } = useMainData()
  const { pagination, curDoujinshi, goToPage, curPageLabel } = useDoujinshi()
  const { imagesList } = useFetchChuckImages(
    curDoujinshi,
    curPageLabel.split('-')[0],
    10
  )

  if (
    !imagesList ||
    imagesList.every(d => d.imageUrl === undefined) ||
    !pagination
  ) {
    return <LoadingContainer />
  }

  return (
    <Center h="100%" w="100%">
      <>
        <Flex
          direction="row-reverse"
          {...(!isFullHeight && !isFullWidth && { h: `${zoomRatio * 100}vh` })}
        >
          {curPageLabel
            .split('-')
            .filter(Boolean)
            .map((_, idx) => {
              if (!imagesList[pagination.curPageIdxs[idx]].imageUrl) return null
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
                    alt={imagesList[pagination.curPageIdxs[idx]].imageUrl ?? ''}
                    src={imagesList[pagination.curPageIdxs[idx]].imageUrl ?? ''}
                  />
                </Box>
              )
            })}
        </Flex>
      </>
    </Center>
  )
}
