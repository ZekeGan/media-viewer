import { ReactNode } from 'react'
import MainLayout from '@/layout/MainLayout/index'

export default function Layout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}
