import {
  Column,
  DataLayoutItem,
  Layout,
  VisualLayoutItem,
  WindowView,
} from 'shared/main'

export const mockColumns: Column[] = [
  { id: 'col_name', name: '文件名称', dataType: 'STRING' },
  { id: 'col_size', name: '文件大小(KB)', dataType: 'NUMBER' },
  { id: 'col_modified', name: '修改日期', dataType: 'DATETIME' },
  { id: 'col_path', name: '路径', dataType: 'STRING' },
]

export const mockLayout: Layout = {
  id: 'layout_main',
  name: 'default layout',
  layoutItems: [
    // 数据项：文件名（渲染为按钮）
    {
      id: 'item_name_btn',
      layoutId: 'layout_main',
      columnId: 'col_name',
      grid: { i: 'item_name_btn', x: 0, y: 0, w: 4, h: 1, minW: 2, maxW: 6 },
      renderer: 'BUTTON',
      rendererConfig: {
        label: '打开文件',
        onClickCommand: 'start "" "{value}"', // 用户可自定义命令
      },
    } as DataLayoutItem,
    // 数据项：文件大小（纯文本）
    {
      id: 'item_size_text',
      layoutId: 'layout_main',
      columnId: 'col_size',
      grid: { i: 'item_size_text', x: 4, y: 0, w: 2, h: 1, minW: 1 },
      renderer: 'TEXT',
      rendererConfig: {
        fontSize: 14,
        color: '#666',
      },
    } as DataLayoutItem,
    // 视觉项：分割线
    {
      id: 'divider_1',
      layoutId: 'layout_main',
      grid: { i: 'divider_1', x: 0, y: 1, w: 12, h: 1 },
      renderer: 'DIVIDER',
      rendererConfig: {
        lineColor: '#ccc',
        lineStyle: 'dashed',
        margin: 8,
      },
    } as VisualLayoutItem,
    // 数据项：修改日期（文本）
    {
      id: 'item_date_text',
      layoutId: 'layout_main',
      columnId: 'col_modified',
      grid: { i: 'item_date_text', x: 0, y: 2, w: 6, h: 1 },
      renderer: 'TEXT',
      rendererConfig: {
        format: 'YYYY-MM-DD HH:mm',
      },
    } as DataLayoutItem,
  ],
}

export const mockWindowView: WindowView = {
  id: 'view_001',
  name: '我的项目仪表板',
  targetFolderPath: 'D:\\Projects',
  selectedLayoutId: 'layout_main',
  layouts: [mockLayout],
  folders: [
    {
      id: 'folder_1',
      parentFolderId: '',
      lastReadPath: 'D:\\Projects\\ProjectA',
      updateDate: new Date('2026-05-15'),
      cells: [
        {
          id: 'cell_1_name',
          columnId: 'col_name',
          value: 'readme.md',
          updateDate: new Date(),
        },
        {
          id: 'cell_1_size',
          columnId: 'col_size',
          value: '12',
          updateDate: new Date(),
        },
        {
          id: 'cell_1_modified',
          columnId: 'col_modified',
          value: '2026-05-10',
          updateDate: new Date(),
        },
      ],
    },
    {
      id: 'folder_2',
      parentFolderId: '',
      lastReadPath: 'D:\\Projects\\ProjectB',
      updateDate: new Date('2026-05-16'),
      cells: [
        {
          id: 'cell_2_name',
          columnId: 'col_name',
          value: 'config.json',
          updateDate: new Date(),
        },
        {
          id: 'cell_2_size',
          columnId: 'col_size',
          value: '8',
          updateDate: new Date(),
        },
        {
          id: 'cell_2_modified',
          columnId: 'col_modified',
          value: '2026-05-12',
          updateDate: new Date(),
        },
      ],
    },
  ],
  columns: mockColumns,
  config: {
    dataSearchDepth: 2,
  },
}
