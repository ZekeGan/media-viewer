import { WindowView } from 'shared/main'
import { columns } from './column'
import { folders } from './folder'
import { layouts } from './layout'

export const mockWindowView: WindowView = {
  id: 'view_001',
  name: '我的项目仪表板',
  targetFolderPath: 'D:\\Projects',
  selectedLayoutId: 'layout_main',

  config: {
    dataSearchDepth: 2,
    colCount: 5,
    autoWidth: true,
  },
  layouts: layouts,
  folders: folders,
  columns: columns,
}
