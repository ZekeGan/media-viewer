import { ReactNode } from 'react'
import { DoujinshiContext } from '@/context/doujinshiContext'

export default function Layout({ children }: { children: ReactNode }) {
  return <DoujinshiContext>{children}</DoujinshiContext>
}
