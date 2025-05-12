import { ReactNode } from 'react'
import { MainContext } from '@/context/gameContext'

export default function Layout({ children }: { children: ReactNode }) {
  return <MainContext>{children}</MainContext>
}
