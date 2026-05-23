'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Container, Tabs } from '@mantine/core'
import MainLayout from '@/layout/MainLayout'
import { LayoutItemRenderer } from '@/components/layoutItem'
import { useLoadInitialData } from '@/hooks/useLoadInitialData'
import { useFolderStore } from '@/stores/folderStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useAppStore } from '@/stores/mainStore'

export default function GridEditorPage() {
  const id = useSearchParams().get('id')
  const views = useAppStore(s => s.views)
  const currentView = useAppStore(s => s.currentView)
  const currentLayout = useLayoutStore(s => s.currentLayout)
  const folders = useFolderStore(s => s.folders)
  const activeViewId = useAppStore(s => s.activeViewId)
  useLoadInitialData()

  if (!currentView || !currentLayout) return

  return (
    <Container fluid p={0} w="100vw" h="100vh" className="">
      <Tabs
        color="yellow"
        variant="outline"
        radius="lg"
        defaultValue="gallery"
        value={activeViewId}
      >
        <Tabs.List>
          {Object.keys(views).map(k => (
            <Tabs.Tab key={views[k].id} value={views[k].id}>
              {views[k].name}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {Object.keys(views).map(k => (
          <Tabs.Panel
            key={`panel-${views[k].id}`}
            className="h-full w-full"
            value={views[k].id}
          >
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
          </Tabs.Panel>
        ))}
      </Tabs>
    </Container>
  )
}
