'use client'

import React from 'react'
import { ScrollArea } from '@mantine/core'
import { LayoutItemRenderer } from '@/components/layoutItem'
import { useFolderStore } from '@/stores/folderStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useAppStore } from '@/stores/mainStore'
import { Navbar } from './_containers/navBar'

export default function GridEditorPage() {
  const currentView = useAppStore(s => s.currentView)
  const currentLayout = useLayoutStore(s => s.currentLayout)
  const folders = useFolderStore(s => s.folders)

  if (!currentView || !currentLayout) return

  return (
    <main className="w-screen h-screen flex flex-col">
      <Navbar />

      <ScrollArea type="scroll" scrollbarSize={2}>
        <main
          className="w-full grid"
          style={{
            gridTemplateColumns: `repeat(${currentView.config.colCount}, 1fr)`,
            gap: '20px',
          }}
        >
          {Object.keys(folders).map(k => {
            const maxW = Math.max(
              ...currentLayout.layoutItems.map(i => i.grid.w)
            )
            return (
              <div
                key={folders[k].id}
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
                    <LayoutItemRenderer layoutItem={i} />
                  </div>
                ))}
              </div>
            )
          })}
        </main>
      </ScrollArea>
    </main>
  )
}
