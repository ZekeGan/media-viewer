'use client'

import { ReactNode } from 'react'
import MainLayout from '@/layout/MainLayout/index'
import { EditorProvider } from './_contexts/editorContext'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MainLayout>
      <EditorProvider>{children}</EditorProvider>
    </MainLayout>
  )
}
