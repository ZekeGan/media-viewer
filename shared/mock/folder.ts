import { Cell, Folder } from 'shared/main'

//folder2
const cell21: Cell = {
  id: 'cell_2_name',
  columnId: 'col_name',
  value: 'config.json',
  updateDate: new Date(),
}
const cell22: Cell = {
  id: 'cell_2_size',
  columnId: 'col_size',
  value: '8',
  updateDate: new Date(),
}
const cell23: Cell = {
  id: 'cell_2_modified',
  columnId: 'col_modified',
  value: '2026-05-12',
  updateDate: new Date(),
}
const folder2: Folder = {
  id: 'folder_2',
  parentFolderId: '',
  lastReadPath: 'D:\\Projects\\ProjectB',
  updateDate: new Date('2026-05-16'),
  cells: [cell21, cell22, cell23],
}

// folder1
const cell11: Cell = {
  id: 'cell_1_name',
  columnId: 'col_name',
  value: 'readme.md',
  updateDate: new Date(),
}
const cell12: Cell = {
  id: 'cell_1_size',
  columnId: 'col_size',
  value: '12',
  updateDate: new Date(),
}
const cell13: Cell = {
  id: 'cell_1_modified',
  columnId: 'col_modified',
  value: '2026-05-10',
  updateDate: new Date(),
}

const folder1: Folder = {
  id: 'folder_1',
  parentFolderId: '',
  lastReadPath: 'D:\\Projects\\ProjectA',
  updateDate: new Date('2026-05-15'),
  cells: [cell11, cell12, cell13],
}

export const folders: Folder[] = [folder1, folder2]
