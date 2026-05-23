import { View } from 'shared/main'
import { create } from 'zustand'

interface AppState {
  views: Record<string, View>
  activeViewId: string | null
  currentView: View | null
  setView: (views: View[]) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  activeViewId: null,
  views: {},
  currentView: null,

  setView: views => {
    const viewsMap: Record<string, View> = Object.fromEntries(
      views.map(f => [f.id, f])
    )

    const firstViewId = views[0]?.id || null
    set({
      views: viewsMap,
      activeViewId: firstViewId,
      currentView: firstViewId ? viewsMap[firstViewId] : null,
    })
  },
}))
