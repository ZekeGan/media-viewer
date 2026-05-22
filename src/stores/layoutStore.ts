// stores/useLayoutStore.ts
import { Layout } from 'shared/main'
import { create } from 'zustand'

interface LayoutState {
  currentLayout: Layout | null

  layouts: Record<string, Layout>
  layoutItems: Record<string, Layout['layoutItems']> // layoutId -> items

  setLayouts: (layouts: Layout[]) => void
  setLayoutItems: (layoutId: string, items: Layout['layoutItems']) => void
  updateLayoutItems: (layoutId: string, items: Layout['layoutItems']) => void // 你原来的方法
}

export const useLayoutStore = create<LayoutState>(set => ({
  currentLayoutId: '',
  currentLayout: null,

  layouts: {},
  layoutItems: {},

  setLayouts: layouts =>
    set(() => ({
      layouts: Object.fromEntries(layouts.map(l => [l.id, l])),
    })),
  setLayoutItems: (layoutId, items) =>
    set(state => ({
      layoutItems: { ...state.layoutItems, [layoutId]: items },
    })),
  updateLayoutItems: (layoutId, items) =>
    set(state => ({
      layoutItems: { ...state.layoutItems, [layoutId]: items },
    })),
}))
