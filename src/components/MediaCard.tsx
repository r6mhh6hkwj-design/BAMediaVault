/**
 * 文件卡片 — 网格/列表双模式 + 3D 倾斜 + 聚光灯 + hover 操作 + 拖拽移动
 */
import { Film, Image, Music, FileText, Archive, Download, Trash2, Pencil, Check } from 'lucide-react'
import type { MediaFile, FileType } from '@/types/media'
import { useMediaStore } from '@/store/mediaStore'
import { useAuthStore } from '@/store/authStore'
import { useTilt, useRipple, formatSize, formatDate } from '@/hooks/useInteractions'
import { api } from '@/lib/api'

const TYPE_ICON: Record<FileType, typeof Film> = {
  video: Film,
  image: Image,
  audio: Music,
  document: FileText,
  archive: Archive,
}

const TYPE_COLOR: Record<FileType, string> = {
  video: 'text-neon',
  image: 'text-blue-400',
  audio: 'text-purple-400',
  document: 'text-green-400',
  archive: 'text-amber-400',
}

interface Props {
  file: MediaFile
  index: number
  onPreview: (file: MediaFile) => void
  onRename: (file: MediaFile) => void
}

export default function MediaCard({ file, index, onPreview, onRename }: Props) {
  const viewMode = useMediaStore((s) => s.viewMode)
  const selectedIds = useMediaStore((s) => s.selectedIds)
  const toggleSelect = useMediaStore((s) => s.toggleSelect)
  const refresh = useMediaStore((s) => s.refresh)
  const user = useAuthStore((s) => s.user)
  const tilt = useTilt(6)
  const ripple = useRipple()
  const selected = selectedIds.has(file.id)
  const isOwner = file.uploaderId === user?.id
  const canEdit = user?.permissions.includes('edit_all') || (isOwner && user?.permissions.includes('edit_own'))
  const canDelete = user?.permissions.includes('delete_all') || (isOwner && user?.permissions.includes('delete_own'))

  const Icon = TYPE_ICON[file.type]

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`确认删除「${file.name}」？`)) return
    try {
      await api.deleteFile(file.id)
      await refresh()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(api.downloadFile(file.id), '_blank')
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('fileId', file.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  if (viewMode === 'list') {
    return (
      <div
        draggable={canEdit}
        onDragStart={handleDragStart}
        onClick={() => onPreview(file)}
        className={`group flex items-center gap-3 glass rounded-lg px-4 py-3 cursor-pointer transition-all hover:bg-neon/5 stagger-item ${
          selected ? 'ring-1 ring-neon' : ''
        }`}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(file.id) }}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
            selected ? 'bg-neon border-neon' : 'border-white/20 hover:border-neon'
          }`}
        >
          {selected && <Check className="w-3 h-3 text-black" />}
        </button>
        <div className={`w-9 h-9 rounded-lg glass flex items-center justify-center ${TYPE_COLOR[file.type]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-silver truncate">{file.name}</div>
          <div className="text-xs text-silver-dim">{formatSize(file.size)} · {formatDate(file.createdAt)}</div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleDownload} className="p-1.5 rounded hover:bg-neon/10 text-silver-muted hover:text-neon transition-colors">
            <Download className="w-4 h-4" />
          </button>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); onRename(file) }} className="p-1.5 rounded hover:bg-neon/10 text-silver-muted hover:text-neon transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="p-1.5 rounded hover:bg-danger/10 text-silver-muted hover:text-danger transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="stagger-item"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        draggable={canEdit}
        onDragStart={handleDragStart}
        onClick={() => onPreview(file)}
        className={`group tilt-card spotlight neon-border glass rounded-2xl p-4 cursor-pointer relative ${selected ? 'ring-1 ring-neon' : ''}`}
      >
        {/* 选中框 */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); ripple(e) }}
          className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border flex items-center justify-center transition-all ${
            selected ? 'bg-neon border-neon' : 'border-white/20 hover:border-neon opacity-0 group-hover:opacity-100'
          }`}
        >
          {selected && <Check className="w-3 h-3 text-black" />}
        </button>

        {/* 预览区 */}
        <div className="aspect-square rounded-lg bg-black/40 flex items-center justify-center mb-3 overflow-hidden relative">
          {file.type === 'image' ? (
            <img
              src={`/uploads/${file.id}-${file.name}`}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon className={`w-12 h-12 ${TYPE_COLOR[file.type]}`} strokeWidth={1.5} />
          )}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-silver-dim uppercase tracking-wider">
            {file.type}
          </div>
        </div>

        {/* 文件信息 */}
        <div className="text-sm text-silver truncate font-medium">{file.name}</div>
        <div className="text-xs text-silver-dim mt-0.5">{formatSize(file.size)}</div>

        {/* hover 操作 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass-strong rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleDownload} className="p-1.5 rounded hover:bg-neon/10 text-silver-muted hover:text-neon transition-colors">
            <Download className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); onRename(file) }} className="p-1.5 rounded hover:bg-neon/10 text-silver-muted hover:text-neon transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="p-1.5 rounded hover:bg-danger/10 text-silver-muted hover:text-danger transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
