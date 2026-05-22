import { WindowView } from 'shared/main'
import { create } from 'zustand'

interface AppState {
  views: Record<string, WindowView>
  activeViewId: string | null
  currentView: WindowView | null
  setView: (views: WindowView[]) => void
}

export const useAppStore = create<AppState>()((set, get) => ({
  activeViewId: null,
  views: {},
  currentView: null,

  setView: views => {
    const viewsMap: Record<string, WindowView> = Object.fromEntries(
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
