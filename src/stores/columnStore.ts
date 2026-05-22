// stores/useColumnStore.ts
import { Column } from 'shared/main'
import { create } from 'zustand'

interface ColumnState {
  columns: Record<string, Column> // columnId -> Column
  setColumns: (columns: Column[]) => void
  addColumn: (column: Column) => void
  updateColumn: (id: string, patch: Partial<Column>) => void
  deleteColumn: (id: string) => void
}

export const useColumnStore = create<ColumnState>(set => ({
  columns: {},
  setColumns: columns =>
    set(() => ({
      columns: Object.fromEntries(columns.map(c => [c.id, c])),
    })),
  addColumn: column =>
    set(state => ({
      columns: { ...state.columns, [column.id]: column },
    })),
  updateColumn: (id, patch) =>
    set(state => ({
      columns: { ...state.columns, [id]: { ...state.columns[id], ...patch } },
    })),
  deleteColumn: id =>
    set(state => {
      const { [id]: _, ...rest } = state.columns
      return { columns: rest }
    }),
}))
