// hooks/useLoadInitialData.ts
import { useEffect } from 'react'
import { useColumnStore } from '@/stores/columnStore'
import { useFolderStore } from '@/stores/folderStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useAppStore } from '@/stores/mainStore'

export const useLoadInitialData = () => {
  const currentView = useAppStore(state => state.currentView)
  const setView = useAppStore(state => state.setView)
  const setFolders = useFolderStore(s => s.setFolders)
  const setLayouts = useLayoutStore(s => s.setLayouts)
  const setColumns = useColumnStore(s => s.setColumns)
  const setLayoutItems = useLayoutStore(s => s.setLayoutItems)

  useEffect(() => {
    const updateSlice = async () => {
      if (!currentView) return
      setFolders(currentView.folders)
      setColumns(currentView.columns)
      setLayouts(currentView.layouts)
      currentView.layouts.forEach(l => {
        setLayoutItems(l.id, l.layoutItems)
      })
    }
    updateSlice()
  }, [currentView, setColumns, setFolders, setLayoutItems, setLayouts])

  useEffect(() => {
    const load = async () => {
      const views = await window.electronApi.getWindowViewList()
      setView(views)
    }
    load()
  }, [setView])
}
