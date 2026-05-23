'use client'

import { ReactNode } from 'react'
import { useLoadInitialData } from '@/hooks/useLoadInitialData'

export default function Layout({ children }: { children: ReactNode }) {
  useLoadInitialData()

  return children
}
