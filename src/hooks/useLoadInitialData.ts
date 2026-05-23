import { useEffect } from 'react'
import { useColumnStore } from '@/stores/columnStore'
import { useFolderStore } from '@/stores/folderStore'
import { useLayoutStore } from '@/stores/layoutStore'
import { useAppStore } from '@/stores/mainStore'

export const useLoadInitialData = () => {
  const setViews = useAppStore(state => state.setViews)
  const setCurrentView = useAppStore(state => state.setCurrentView)
  const activeViewId = useAppStore(state => state.activeViewId)
  const setFolders = useFolderStore(s => s.setFolders)
  const setLayouts = useLayoutStore(s => s.setLayouts)
  const setColumns = useColumnStore(s => s.setColumns)
  const setLayoutItems = useLayoutStore(s => s.setLayoutItems)

  useEffect(() => {
    const updateSlice = async () => {
      if (!activeViewId) return
      console.log(activeViewId)

      const view = await window.electronApi.getView(activeViewId)
      console.log(view)

      setCurrentView(view)
      setFolders(view.folders)
      setColumns(view.columns)
      setLayouts(view.selectedLayoutId, view.layouts)
      view.layouts.forEach(l => {
        setLayoutItems(l.id, l.layoutItems)
      })
    }
    updateSlice()
  }, [
    activeViewId,
    setColumns,
    setFolders,
    setLayoutItems,
    setLayouts,
    setCurrentView,
  ])

  useEffect(() => {
    const load = async () => {
      const views = await window.electronApi.getViewList()
      setViews(views)
    }
    load()
  }, [setViews])
}
