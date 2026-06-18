/**
 * 文件夹卡片 — 悬停高亮 + 释放移入 + 密码保护 + 团队文件夹权限
 */
import { useState } from 'react'
import { Folder, FolderLock, Users, Lock, Pencil, Trash2, KeyRound } from 'lucide-react'
import type { Folder as FolderType } from '@/types/media'
import { useMediaStore } from '@/store/mediaStore'
import { useAuthStore } from '@/store/authStore'
import { useTilt, formatDate } from '@/hooks/useInteractions'
import { api } from '@/lib/api'

interface Props {
  folder: FolderType
  index: number
  onRename: (folder: FolderType) => void
  onPassword: (folder: FolderType) => void
  onAccessDenied: (folder: FolderType) => void
}

export default function FolderCard({ folder, index, onRename, onPassword, onAccessDenied }: Props) {
  const loadFolder = useMediaStore((s) => s.loadFolder)
  const refresh = useMediaStore((s) => s.refresh)
  const user = useAuthStore((s) => s.user)
  const tilt = useTilt(6)
  const [dragOver, setDragOver] = useState(false)

  const isOwner = folder.creatorId === user?.id
  const canManageAll = user?.permissions.includes('folder_manage_all')
  const canRename = isOwner || canManageAll
  const canDelete = isOwner || canManageAll
  const canSetPassword = canManageAll || isOwner
  const isTeamFolder = !!folder.teamId

  const handleClick = async () => {
    // 团队文件夹：检查访问权限
    if (isTeamFolder) {
      try {
        const access = await api.checkFolderAccess(folder.id)
        if (!access.hasAccess) {
          onAccessDenied(folder)
          return
        }
      } catch {
        onAccessDenied(folder)
        return
      }
    }
    loadFolder(folder.id)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`确认删除文件夹「${folder.name}」？内部文件将一并删除。`)) return
    try {
      await api.deleteFolder(folder.id)
      await refresh()
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('密码')) {
        onPassword(folder)
      } else {
        alert(msg)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.stopPropagation()
    setDragOver(false)
    const fileId = e.dataTransfer.getData('fileId')
    if (!fileId) return
    try {
      await api.moveFile(fileId, folder.id)
      await refresh()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  return (
    <div className="stagger-item" style={{ animationDelay: `${index * 40}ms` }}>
      <div
        ref={tilt.ref}
        onMouseMove={tilt.onMouseMove}
        onMouseLeave={tilt.onMouseLeave}
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`group tilt-card spotlight neon-border glass rounded-2xl p-4 cursor-pointer relative transition-all ${
          dragOver ? 'ring-2 ring-neon bg-neon/10 scale-105' : ''
        }`}
      >
        {/* 图标区 */}
        <div className="aspect-square rounded-lg bg-black/40 flex items-center justify-center mb-3 relative">
          <div className={isTeamFolder ? 'animate-breath' : 'group-hover:scale-110 transition-transform'}>
            {folder.passwordHash ? (
              <FolderLock className={`w-12 h-12 ${isTeamFolder ? 'text-neon' : 'text-silver-muted'}`} strokeWidth={1.5} />
            ) : (
              <Folder className={`w-12 h-12 ${isTeamFolder ? 'text-neon' : 'text-silver-muted'}`} strokeWidth={1.5} />
            )}
          </div>
          {/* 团队标识 */}
          {isTeamFolder && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-neon/20 text-neon text-[10px] font-medium">
              <Users className="w-2.5 h-2.5" /> 团队
            </div>
          )}
          {/* 密码标识 */}
          {folder.passwordHash && (
            <div className="absolute bottom-2 right-2">
              <Lock className="w-3.5 h-3.5 text-silver-dim" />
            </div>
          )}
        </div>

        {/* 名称 */}
        <div className="text-sm text-silver truncate font-medium">{folder.name}</div>
        <div className="text-xs text-silver-dim mt-0.5">{formatDate(folder.createdAt)}</div>

        {/* hover 操作 */}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass-strong rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canSetPassword && (
            <button
              onClick={(e) => { e.stopPropagation(); onPassword(folder) }}
              className="p-1.5 rounded hover:bg-neon/10 text-silver-muted hover:text-neon transition-colors"
              title="设置密码"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}
          {canRename && (
            <button
              onClick={(e) => { e.stopPropagation(); onRename(folder) }}
              className="p-1.5 rounded hover:bg-neon/10 text-silver-muted hover:text-neon transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-danger/10 text-silver-muted hover:text-danger transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 拖拽提示 */}
        {dragOver && (
          <div className="absolute inset-0 rounded-2xl border-2 border-neon bg-neon/10 flex items-center justify-center pointer-events-none">
            <span className="text-neon text-sm font-display tracking-wider">释放以移入</span>
          </div>
        )}
      </div>
    </div>
  )
}
