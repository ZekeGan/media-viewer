// hooks/useLoadInitialData.ts
import { mockLayout, mockWindowView } from '@/app/editor/_mock'
import { dataService } from '@/services/dataService'
import { useEffect } from 'react'
import { useAppStore } from '@/stores/mainStore'

export const useLoadInitialData = () => {
  const loadViews = useAppStore(state => state.loadViews)
  // const addFolder = useAppStore(state => state.addFolder)

  useEffect(() => {
    const load = async () => {
      // 1. 从数据库加载视图配置
      const views = [mockWindowView]
      loadViews(views)
      console.log(mockWindowView)

      // 2. 扫描本地文件夹，获得最新的文件夹列表
      // const folders = await dataService.scanRootFolder(rootPath)
      // view.folders.forEach(folder => addFolder(viewId, folder))
    }
    load()
  }, [loadViews])
}
