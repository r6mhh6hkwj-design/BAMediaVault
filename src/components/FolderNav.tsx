/**
 * 面包屑导航 + 新建文件夹/团队文件夹按钮
 */
import { useState } from 'react'
import { Home, ChevronRight, FolderPlus, Users, Lock } from 'lucide-react'
import { useMediaStore } from '@/store/mediaStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

export default function FolderNav() {
  const breadcrumb = useMediaStore((s) => s.breadcrumb)
  const currentFolderId = useMediaStore((s) => s.currentFolderId)
  const loadFolder = useMediaStore((s) => s.loadFolder)
  const refresh = useMediaStore((s) => s.refresh)
  const canCreateFolder = useAuthStore((s) => s.hasPermission('folder_create'))
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    try {
      await api.createFolder(name.trim(), currentFolderId)
      setName('')
      setCreating(false)
      await refresh()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
      {/* 面包屑 */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          onClick={() => loadFolder(null)}
          className="flex items-center gap-1 px-2 py-1 rounded text-silver-muted hover:text-neon transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="font-display tracking-wide">根目录</span>
        </button>
        {breadcrumb.map((f, i) => (
          <div key={f.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-silver-dim" />
            <button
              onClick={() => loadFolder(f.id)}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                i === breadcrumb.length - 1 ? 'text-neon' : 'text-silver-muted hover:text-silver'
              }`}
            >
              {f.passwordHash && <Lock className="w-3 h-3" />}
              {f.teamId && <Users className="w-3 h-3 text-neon" />}
              <span className="font-display tracking-wide">{f.name}</span>
            </button>
          </div>
        ))}
      </div>

      {/* 新建文件夹 */}
      {canCreateFolder && (
        <div className="flex items-center gap-2">
          {creating ? (
            <div className="flex items-center gap-2 animate-bounce-in">
              <input
                autoFocus
                className="input-glass rounded-lg px-3 py-1.5 text-sm w-40"
                placeholder="文件夹名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') { setCreating(false); setName('') }
                }}
              />
              <button onClick={handleCreate} className="btn-neon rounded-lg px-3 py-1.5 text-xs">
                创建
              </button>
              <button
                onClick={() => { setCreating(false); setName('') }}
                className="btn-glass rounded-lg px-3 py-1.5 text-xs"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 btn-glass rounded-lg px-3 py-1.5 text-sm"
            >
              <FolderPlus className="w-4 h-4" />
              新建文件夹
            </button>
          )}
        </div>
      )}
    </div>
  )
}
