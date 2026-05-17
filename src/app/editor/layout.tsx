import { ReactNode } from 'react'
import MainLayout from '@/layout/MainLayout'

export default function Layout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>
}
