/**
 * 拖拽上传区 — 支持 5 种文件类型，多文件队列
 */
import { useState, useRef } from 'react'
import { UploadCloud, X, FileUp } from 'lucide-react'
import { api } from '@/lib/api'
import { useMediaStore } from '@/store/mediaStore'
import { useAuthStore } from '@/store/authStore'
import { formatSize } from '@/hooks/useInteractions'

export default function UploadZone() {
  const canUpload = useAuthStore((s) => s.hasPermission('upload'))
  const currentFolderId = useMediaStore((s) => s.currentFolderId)
  const refresh = useMediaStore((s) => s.refresh)
  const [dragging, setDragging] = useState(false)
  const [queue, setQueue] = useState<File[]>([])
  const [names, setNames] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!canUpload) return null

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    setQueue(arr)
    setNames(arr.map((f) => f.name))
    setError('')
  }

  const handleUpload = async () => {
    if (queue.length === 0) return
    setUploading(true)
    setError('')
    try {
      // 重命名文件
      const renamed = queue.map((f, i) => {
        const ext = f.name.split('.').pop()
        const baseName = names[i].includes('.') ? names[i] : `${names[i]}.${ext}`
        return new File([f], baseName, { type: f.type })
      })
      await api.uploadFiles(currentFolderId, renamed)
      setQueue([])
      setNames([])
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-6">
      {/* 拖拽区 */}
      <div
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
          dragging ? 'border-neon bg-neon/5 scale-[1.01]' : 'border-white/10 glass'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center py-8 cursor-pointer">
          <div className={`w-14 h-14 rounded-2xl glass flex items-center justify-center mb-3 transition-transform ${dragging ? 'scale-110 animate-pulse-neon' : ''}`}>
            <UploadCloud className={`w-7 h-7 ${dragging ? 'text-neon' : 'text-silver-muted'}`} strokeWidth={2} />
          </div>
          <p className="text-silver text-sm font-medium">
            {dragging ? '释放以上传' : '拖拽文件到此处，或点击选择'}
          </p>
          <p className="text-silver-dim text-xs mt-1">
            视频 · 图片 · 音频 · 文档 · 压缩包
          </p>
        </div>
        {dragging && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon/10 to-transparent animate-shimmer" />
          </div>
        )}
      </div>

      {/* 文件队列 */}
      {queue.length > 0 && (
        <div className="mt-4 glass rounded-xl p-4 animate-bounce-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm text-silver tracking-wide flex items-center gap-2">
              <FileUp className="w-4 h-4 text-neon" /> 上传队列（{queue.length}）
            </h3>
            <button
              onClick={() => { setQueue([]); setNames([]) }}
              className="text-silver-dim hover:text-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {queue.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2">
                <span className="text-xs text-silver-dim font-mono w-6">{i + 1}.</span>
                <input
                  className="input-glass flex-1 rounded px-2 py-1 text-sm"
                  value={names[i]}
                  onChange={(e) => {
                    const next = [...names]
                    next[i] = e.target.value
                    setNames(next)
                  }}
                />
                <span className="text-xs text-silver-dim whitespace-nowrap">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-neon w-full mt-3 rounded-lg py-2.5 text-sm font-display tracking-wider disabled:opacity-50"
          >
            {uploading ? '上传中...' : `开始上传（${queue.length} 个文件）`}
          </button>
        </div>
      )}
    </div>
  )
}
