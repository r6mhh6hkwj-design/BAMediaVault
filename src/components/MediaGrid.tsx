/**
 * 文件/文件夹网格容器 — 拖拽状态管理 + 空状态
 */
import { PackageOpen } from 'lucide-react'
import type { MediaFile, Folder } from '@/types/media'
import { useMediaStore } from '@/store/mediaStore'
import MediaCard from './MediaCard'
import FolderCard from './FolderCard'

interface Props {
  onPreview: (file: MediaFile) => void
  onRenameFile: (file: MediaFile) => void
  onRenameFolder: (folder: Folder) => void
  onPassword: (folder: Folder) => void
  onAccessDenied: (folder: Folder) => void
}

export default function MediaGrid({ onPreview, onRenameFile, onRenameFolder, onPassword, onAccessDenied }: Props) {
  const files = useMediaStore((s) => s.files)
  const folders = useMediaStore((s) => s.folders)
  const viewMode = useMediaStore((s) => s.viewMode)
  const searchQuery = useMediaStore((s) => s.searchQuery)
  const filterType = useMediaStore((s) => s.filterType)
  const loading = useMediaStore((s) => s.loading)

  // 过滤
  const filteredFiles = files.filter((f) => {
    const matchSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === 'all' || f.type === filterType
    return matchSearch && matchType
  })

  if (loading) {
    return (
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' : 'grid-cols-1'}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton rounded-2xl h-48" />
        ))}
      </div>
    )
  }

  if (folders.length === 0 && filteredFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4 animate-breath">
          <PackageOpen className="w-10 h-10 text-silver-dim" strokeWidth={1.5} />
        </div>
        <p className="text-silver-muted text-lg font-display tracking-wide">空仓库</p>
        <p className="text-silver-dim text-sm mt-1">上传文件或创建文件夹开始管理</p>
      </div>
    )
  }

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
    : 'flex flex-col gap-2'

  return (
    <div className="space-y-6">
      {/* 文件夹 */}
      {folders.length > 0 && (
        <div>
          <h3 className="font-display text-xs text-silver-dim tracking-widest uppercase mb-3">
            文件夹 · {folders.length}
          </h3>
          <div className={gridClass}>
            {folders.map((folder, i) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                index={i}
                onRename={onRenameFolder}
                onPassword={onPassword}
                onAccessDenied={onAccessDenied}
              />
            ))}
          </div>
        </div>
      )}

      {/* 文件 */}
      {filteredFiles.length > 0 && (
        <div>
          <h3 className="font-display text-xs text-silver-dim tracking-widest uppercase mb-3">
            文件 · {filteredFiles.length}
          </h3>
          <div className={gridClass}>
            {filteredFiles.map((file, i) => (
              <MediaCard
                key={file.id}
                file={file}
                index={i}
                onPreview={onPreview}
                onRename={onRenameFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
