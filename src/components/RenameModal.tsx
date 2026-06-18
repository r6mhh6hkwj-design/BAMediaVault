/**
 * 重命名弹窗 — 文件/文件夹通用
 */
import { useState, useEffect } from 'react'
import { Pencil, X } from 'lucide-react'

interface Props {
  initialName: string
  title: string
  onSubmit: (name: string) => Promise<void>
  onClose: () => void
}

export default function RenameModal({ initialName, title, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit(name.trim())
      onClose()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="neon-border glass-strong rounded-2xl p-6 w-full max-w-sm mx-4 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg text-silver flex items-center gap-2">
            <Pencil className="w-4 h-4 text-neon" /> {title}
          </h3>
          <button onClick={onClose} className="text-silver-dim hover:text-silver">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            className="input-glass w-full rounded-lg px-4 py-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn-glass flex-1 rounded-lg py-2.5 text-sm">
              取消
            </button>
            <button type="submit" disabled={loading} className="btn-neon flex-1 rounded-lg py-2.5 text-sm disabled:opacity-50">
              {loading ? '处理中...' : '确认'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
