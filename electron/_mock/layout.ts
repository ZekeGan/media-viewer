import { DataLayoutItem, Layout, VisualLayoutItem } from '../../shared/main'

const text1: DataLayoutItem = {
  id: 'item_size_text0',
  layoutId: 'layout_main',
  columnId: 'col_name',
  grid: { i: 'item_size_text0', x: 4, y: 0, w: 5, h: 1, minW: 1 },
  renderer: 'TEXT',
  rendererConfig: {
    label: 'TEEEEE',
    fontSize: 'xs',
    color: '#ffffff',
  },
}

const text2: DataLayoutItem = {
  id: 'item_size_text1',
  layoutId: 'layout_main',
  columnId: 'col_path',
  grid: { i: 'item_size_text1', x: 4, y: 5, w: 5, h: 1, minW: 1 },
  renderer: 'TEXT',
  rendererConfig: {
    label: 'DEFA',
    fontSize: '2xl',
    color: '#50d71e',
  },
}

const date1: DataLayoutItem = {
  id: 'item_date_text',
  layoutId: 'layout_main',
  columnId: 'col_modified',
  grid: { i: 'item_date_text', x: 0, y: 2, w: 6, h: 1 },
  renderer: 'DATE_TEXT',
  rendererConfig: {
    format: 'yyyy-MM-dd',
  },
}

const divider1: VisualLayoutItem = {
  id: 'divider_1',
  layoutId: 'layout_main',
  grid: { i: 'divider_1', x: 0, y: 1, w: 12, h: 1 },
  renderer: 'DIVIDER',
  rendererConfig: {},
}

const layout1: Layout = {
  id: 'layout_main',
  viewId: 'view_001',
  name: 'default layout',
  layoutItems: [text1, text2, divider1, date1],
}

export const layouts: Layout[] = [layout1]
