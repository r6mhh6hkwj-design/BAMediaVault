/**
 * 文件与文件夹状态管理
 */
import { create } from 'zustand'
import { api } from '@/lib/api'
import type { MediaFile, Folder, FileType } from '@/types/media'

export type ViewMode = 'grid' | 'list'
export type FilterType = 'all' | FileType

interface MediaState {
  files: MediaFile[]
  folders: Folder[]
  breadcrumb: Folder[]
  currentFolderId: string | null
  viewMode: ViewMode
  searchQuery: string
  filterType: FilterType
  selectedIds: Set<string>
  loading: boolean

  loadFolder: (folderId: string | null) => Promise<void>
  setViewMode: (m: ViewMode) => void
  setSearchQuery: (q: string) => void
  setFilterType: (t: FilterType) => void
  toggleSelect: (id: string) => void
  selectAll: (ids: string[]) => void
  clearSelection: () => void
  refresh: () => Promise<void>
}

export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  folders: [],
  breadcrumb: [],
  currentFolderId: null,
  viewMode: 'grid',
  searchQuery: '',
  filterType: 'all',
  selectedIds: new Set(),
  loading: false,

  loadFolder: async (folderId) => {
    set({ loading: true, currentFolderId: folderId, selectedIds: new Set() })
    try {
      const [files, folders, breadcrumb] = await Promise.all([
        api.getFiles(folderId),
        api.getFolders(folderId),
        api.getBreadcrumb(folderId),
      ])
      set({ files, folders, breadcrumb, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setViewMode: (m) => set({ viewMode: m }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterType: (t) => set({ filterType: t }),

  toggleSelect: (id) => {
    const next = new Set(get().selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ selectedIds: next })
  },

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),

  refresh: async () => {
    await get().loadFolder(get().currentFolderId)
  },
}))
