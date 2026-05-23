import { Column } from '../../shared/main'

export const columns: Column[] = [
  { id: 'col_name', name: '文件名称', dataType: 'STRING', viewId: 'view_001' },
  {
    id: 'col_size',
    name: '文件大小(KB)',
    dataType: 'NUMBER',
    viewId: 'view_001',
  },
  {
    id: 'col_modified',
    name: '修改日期',
    dataType: 'DATETIME',
    viewId: 'view_001',
  },
  { id: 'col_path', name: '路径', dataType: 'STRING', viewId: 'view_001' },
]
