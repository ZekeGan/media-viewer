import { Box } from '@mantine/core'
import { useDoujinshi } from '@/context/doujinshiContext'

export default function ScreenController() {
  const { goToPage } = useDoujinshi()

  return (
    <>
      <Box pos="fixed" left={0} top={0} w="50vw" h="100%" onClick={() => goToPage(1)} />
      <Box pos="fixed" right={0} top={0} w="50vw" h="100%" onClick={() => goToPage(-1)} />
    </>
  )
}
