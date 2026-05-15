import { LayoutItem } from 'react-grid-layout'

export type DataType =
  | 'STRING'
  | 'NUMBER'
  | 'IMAGE'
  | 'BUTTON'
  | 'ARRAY_STRING'
  | 'DATE'
  | 'BOOLEAN'
  | 'NONE'

export interface Column {
  id: string
  name: string
  dataType: DataType
}

export interface Layout {
  id: string
  targetColumn: string
  layout: LayoutItem
  config: {
    dataType: DataType
  }
}

// export
