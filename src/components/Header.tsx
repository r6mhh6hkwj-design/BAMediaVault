/**
 * 顶部导航 — Logo（回根目录）+ 视图切换 + 团队/管理员入口 + 未读提示
 */
import { useEffect, useState } from 'react'
import { Dumbbell, LayoutGrid, List, Users, Shield, LogOut, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useMediaStore } from '@/store/mediaStore'
import { api } from '@/lib/api'
import { useRipple } from '@/hooks/useInteractions'

interface HeaderProps {
  onOpenTeams: () => void
  onOpenAdmin: () => void
}

export default function Header({ onOpenTeams, onOpenAdmin }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const viewMode = useMediaStore((s) => s.viewMode)
  const setViewMode = useMediaStore((s) => s.setViewMode)
  const loadFolder = useMediaStore((s) => s.loadFolder)
  const ripple = useRipple()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const canManageUsers = user?.permissions.includes('manage_users')

  useEffect(() => {
    const fetchUnread = () => api.getUnreadCount().then((r) => setUnread(r.count)).catch(() => {})
    fetchUnread()
    const t = setInterval(fetchUnread, 15000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo 区（点击回根目录） */}
        <button
          onClick={() => { loadFolder(null); ripple }}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center animate-breath group-hover:scale-110 transition-transform">
            <Dumbbell className="w-5 h-5 text-neon" strokeWidth={2.5} />
          </div>
          <div className="hidden sm:block text-left">
            <div className="font-display text-lg font-bold tracking-wider text-silver leading-none">
              硬核<span className="text-neon">媒体</span>仓库
            </div>
            <div className="text-[10px] text-silver-dim tracking-widest mt-0.5">MEDIA VAULT</div>
          </div>
        </button>

        {/* 中间：视图切换 */}
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-neon/20 text-neon' : 'text-silver-muted hover:text-silver'}`}
            title="网格视图"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-neon/20 text-neon' : 'text-silver-muted hover:text-silver'}`}
            title="列表视图"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 团队按钮（带未读提示） */}
          <button
            onClick={onOpenTeams}
            className="relative p-2.5 rounded-lg btn-glass"
            title="班级/团队"
          >
            <Users className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-neon rounded-full animate-pulse-neon" />
            )}
          </button>

          {/* 管理员入口 */}
          {canManageUsers && (
            <button
              onClick={onOpenAdmin}
              className="p-2.5 rounded-lg btn-glass"
              title="账号管理"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          {/* 用户菜单 */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg btn-glass"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon to-neon-dark flex items-center justify-center text-black text-xs font-bold">
                {user?.username[0].toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm text-silver">{user?.username}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl border border-white/10 overflow-hidden z-50 animate-bounce-in">
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="text-sm text-silver font-medium">{user?.username}</div>
                    <div className="text-xs text-silver-dim mt-0.5">
                      {user?.role === 'admin' ? '管理员' : '普通用户'}
                    </div>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); onOpenTeams(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-silver-muted hover:text-neon hover:bg-neon/5 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> 团队聊天
                  </button>
                  <button
                    onClick={() => { logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-silver-muted hover:text-danger hover:bg-danger/5 transition-colors border-t border-white/5"
                  >
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
