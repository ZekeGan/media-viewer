'use client'

import React, { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { useAppStore } from '@/stores/mainStore'
import { useLoadInitialData } from '../../hooks/useLoadInitialData'
import { CellRenderer } from '../editor/_components/displayItem'

export default function GridEditorPage() {
  useLoadInitialData()
  
  const currentView = useAppStore(s => s.currentView)
  const currentLayout = useMemo(() => {
    if (!currentView) return
    return currentView.layouts.find(l => l.id === currentView.selectedLayoutId)
  }, [currentView])

  if (!currentView || !currentLayout) return null

  return (
    <MainLayout>
      <main
        className="w-full grid"
        style={{
          gridTemplateColumns: `repeat(${currentView.config.colCount}, 1fr)`,
          gap: '20px',
        }}
      >
        {Array.from({ length: 10 }).map((i, idx) => {
          const maxW = Math.max(...currentLayout.layoutItems.map(i => i.grid.w))
          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${maxW}, ${currentView.config.autoWidth ? '1fr' : '50px'})`,
                gridAutoRows: '50px',
              }}
            >
              {currentLayout.layoutItems.map(i => (
                <div
                  key={i.id}
                  style={{
                    gridColumn: `${i.grid.x + 1}/ span ${i.grid.w}`,
                    gridRow: `${i.grid.y + 1}/ span ${i.grid.h}`,
                    height: `${i.grid.h * 50}px`,
                  }}
                >
                  <CellRenderer layoutItem={i} />
                </div>
              ))}
            </div>
          )
        })}
      </main>
    </MainLayout>
  )
}
