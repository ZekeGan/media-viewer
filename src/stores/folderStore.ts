// stores/useFolderStore.ts
import { Folder } from 'shared/main'
import { create } from 'zustand'

interface FolderState {
  folders: Record<string, Folder>

  setFolders: (folders: Folder[]) => void
  updateFolderPath: (id: string, newPath: string) => void
  deleteFolder: (id: string) => void
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: {},

  setFolders: folders =>
    set(() => ({
      folders: Object.fromEntries(folders.map(f => [f.id, f])),
    })),
  updateFolderPath: (id, newPath) =>
    set(state => ({
      folders: {
        ...state.folders,
        [id]: { ...state.folders[id], lastReadPath: newPath },
      },
    })),
  deleteFolder: id =>
    set(state => {
      const { [id]: _, ...rest } = state.folders
      return { folders: rest }
    }),
}))
