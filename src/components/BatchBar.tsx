/**
 * 批量操作工具栏 — 批量下载 / 批量删除
 */
import { Download, Trash2, X } from 'lucide-react'
import { useMediaStore } from '@/store/mediaStore'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

export default function BatchBar() {
  const selectedIds = useMediaStore((s) => s.selectedIds)
  const clearSelection = useMediaStore((s) => s.clearSelection)
  const refresh = useMediaStore((s) => s.refresh)
  const user = useAuthStore((s) => s.user)

  if (selectedIds.size === 0) return null

  const ids = Array.from(selectedIds)
  const canDeleteAll = user?.permissions.includes('delete_all')

  const handleBatchDownload = async () => {
    try {
      const blob = await api.batchDownload(ids)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'batch-download.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`确认删除选中的 ${ids.length} 个文件？`)) return
    try {
      await api.batchDelete(ids)
      clearSelection()
      await refresh()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-bounce-in">
      <div className="glass-strong rounded-2xl border border-neon/30 px-4 py-3 flex items-center gap-3 shadow-2xl">
        <span className="text-sm text-silver">
          已选 <span className="text-neon font-bold">{ids.length}</span> 项
        </span>
        <div className="w-px h-6 bg-white/10" />
        <button
          onClick={handleBatchDownload}
          className="flex items-center gap-1.5 btn-glass rounded-lg px-3 py-1.5 text-sm"
        >
          <Download className="w-4 h-4" /> 下载
        </button>
        {canDeleteAll && (
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm bg-danger/20 text-danger hover:bg-danger/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> 删除
          </button>
        )}
        <button
          onClick={clearSelection}
          className="p-1.5 rounded-lg text-silver-muted hover:text-silver transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
