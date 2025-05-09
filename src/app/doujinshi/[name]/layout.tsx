import { DoujinshiContext } from '@/context/doujinshiContext'
import { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return <DoujinshiContext>{children}</DoujinshiContext>
}
