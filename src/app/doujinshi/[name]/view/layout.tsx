import { Container } from '@mantine/core'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Container
      fluid
      pos="fixed"
      left={0}
      top={0}
      w="100vw"
      h="100vh"
      bg="black"
      p={0}
      // style={{ zIndex: 1 }}
    >
      {children}
    </Container>
  )
}
