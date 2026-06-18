/**
 * 文件夹密码认证弹窗 — 设置密码 / 验证密码
 */
import { useState, useEffect } from 'react'
import { KeyRound, Lock, X } from 'lucide-react'

interface Props {
  folderName: string
  mode: 'set' | 'verify'
  onSubmit: (password: string) => Promise<void>
  onClose: () => void
}

export default function FolderPasswordModal({ folderName, mode, onSubmit, onClose }: Props) {
  const [password, setPassword] = useState('')
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
    if (!password) return
    setLoading(true)
    try {
      await onSubmit(password)
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
            {mode === 'set' ? <KeyRound className="w-4 h-4 text-neon" /> : <Lock className="w-4 h-4 text-neon" />}
            {mode === 'set' ? '设置文件夹密码' : '文件夹密码认证'}
          </h3>
          <button onClick={onClose} className="text-silver-dim hover:text-silver">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-silver-muted text-sm mb-4">文件夹：{folderName}</p>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="password"
            className="input-glass w-full rounded-lg px-4 py-2.5 text-sm"
            placeholder={mode === 'set' ? '输入新密码' : '输入文件夹密码'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn-glass flex-1 rounded-lg py-2.5 text-sm">
              取消
            </button>
            <button type="submit" disabled={loading} className="btn-neon flex-1 rounded-lg py-2.5 text-sm disabled:opacity-50">
              {loading ? '处理中...' : mode === 'set' ? '设置' : '验证'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
