import { ReactNode } from 'react'
import { GameContext } from '@/context/gameContext'
import MainLayout from '@/layout/MainLayout'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      <GameContext>{children}</GameContext>
    </MainLayout>
  )
}
