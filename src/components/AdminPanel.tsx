/**
 * 管理员面板 — 用户列表 / 9 种权限逐项开关 / 注销账号
 */
import { useEffect, useState } from 'react'
import { X, Shield, Trash2, Power } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import type { User, Permission } from '@/types/media'
import { formatDate } from '@/hooks/useInteractions'

const PERMISSION_LIST: Permission[] = [
  'view', 'upload', 'edit_own', 'edit_all',
  'delete_own', 'delete_all', 'folder_create',
  'folder_manage_all', 'manage_users',
]

const PERMISSION_LABELS: Record<Permission, string> = {
  view: '查看',
  upload: '上传',
  edit_own: '编辑自己',
  edit_all: '编辑全部',
  delete_own: '删除自己',
  delete_all: '删除全部',
  folder_create: '创建文件夹',
  folder_manage_all: '管理文件夹',
  manage_users: '管理用户',
}

interface Props {
  onClose: () => void
}

export default function AdminPanel({ onClose }: Props) {
  const currentUser = useAuthStore((s) => s.user)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const [users, setUsers] = useState<User[]>([])

  const load = async () => {
    try {
      setUsers(await api.getUsers())
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load()
  }, [])

  const togglePermission = async (userId: string, perm: Permission, current: string[]) => {
    const next = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm]
    try {
      await api.updatePermissions(userId, next)
      await load()
      if (userId === currentUser?.id) await refreshUser()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`确认注销用户「${username}」的账号？此操作不可恢复。`)) return
    try {
      await api.deleteUser(userId)
      await load()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl glass-strong border-l border-neon/20 h-full overflow-y-auto animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 glass-strong border-b border-white/5 p-4 flex items-center justify-between z-10">
          <h2 className="font-display text-lg text-silver flex items-center gap-2">
            <Shield className="w-5 h-5 text-neon" /> 账号管理
          </h2>
          <button onClick={onClose} className="text-silver-dim hover:text-silver">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {users.map((u, idx) => (
            <div key={u.id} className="glass rounded-xl p-4 stagger-item" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon to-neon-dark flex items-center justify-center text-black font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-silver font-medium flex items-center gap-2">
                      {u.username}
                      {u.id === currentUser?.id && <span className="text-[10px] text-neon">（你）</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-neon/20 text-neon' : 'bg-white/10 text-silver-muted'}`}>
                        {u.role === 'admin' ? '管理员' : '用户'}
                      </span>
                    </div>
                    <div className="text-xs text-silver-dim mt-0.5">注册于 {formatDate(u.createdAt)}</div>
                  </div>
                </div>
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-xs"
                  >
                    <Power className="w-3.5 h-3.5" /> 注销
                  </button>
                )}
              </div>

              {/* 权限开关 */}
              <div className="grid grid-cols-3 gap-2">
                {PERMISSION_LIST.map((perm) => {
                  const enabled = u.permissions.includes(perm)
                  return (
                    <button
                      key={perm}
                      onClick={() => togglePermission(u.id, perm, u.permissions)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        enabled
                          ? 'bg-neon/20 text-neon border border-neon/30'
                          : 'bg-white/5 text-silver-dim border border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-neon' : 'bg-silver-dim'}`} />
                      {PERMISSION_LABELS[perm]}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
