/**
 * 认证页 — 登录 / 注册 / 忘记密码
 * 硬核暗黑主题：毛玻璃卡片 + 渐变发光边框 + 流体光晕球 + 交错入场
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Lock, User as UserIcon, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { useRipple } from '@/hooks/useInteractions'

type Mode = 'login' | 'register' | 'forgot'

export default function Auth() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const ripple = useRipple()

  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [identityCode, setIdentityCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username, password)
        navigate('/')
      } else if (mode === 'register') {
        await register(username, password, identityCode)
        navigate('/')
      } else {
        await api.forgotPassword(username, newPassword)
        setMode('login')
        setUsername('')
        setNewPassword('')
        setError('')
      }
    } catch (err) {
      setError((err as Error).message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const titles: Record<Mode, { title: string; sub: string }> = {
    login: { title: '登 录', sub: '进入硬核媒体仓库' },
    register: { title: '注 册', sub: '身份码决定你的权限' },
    forgot: { title: '重置密码', sub: '每月最多 3 次' },
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 w-full max-w-md">
        {/* Logo 区 */}
        <div className="text-center mb-8 stagger-item" style={{ animationDelay: '0ms' }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-strong mb-4 animate-breath">
            <Dumbbell className="w-10 h-10 text-neon" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-wider text-silver">
            硬核<span className="text-neon">媒体</span>仓库
          </h1>
          <p className="text-silver-muted text-sm mt-2 tracking-wide">HARDCORE MEDIA VAULT</p>
        </div>

        {/* 表单卡片 */}
        <div
          className={`neon-border glass-strong rounded-2xl p-8 stagger-item ${shake ? 'animate-shake' : ''}`}
          style={{ animationDelay: '100ms' }}
        >
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-silver">{titles[mode].title}</h2>
            <p className="text-silver-muted text-sm mt-1">{titles[mode].sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-dim" />
              <input
                className="input-glass w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {mode === 'register' && (
              <div className="relative stagger-item">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-dim" />
                <input
                  className="input-glass w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                  placeholder="身份码（Admin / User）"
                  value={identityCode}
                  onChange={(e) => setIdentityCode(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === 'forgot' ? (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-dim" />
                <input
                  type="password"
                  className="input-glass w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                  placeholder="新密码"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-dim" />
                <input
                  type="password"
                  className="input-glass w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg px-3 py-2 animate-bounce-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={ripple}
              className="btn-neon w-full rounded-lg py-3 text-sm font-display tracking-wider disabled:opacity-50 animate-pulse-neon"
            >
              {loading ? '处理中...' : titles[mode].title}
            </button>
          </form>

          {/* 切换模式 */}
          <div className="mt-6 flex flex-col gap-2 text-sm">
            {mode === 'login' && (
              <>
                <button
                  className="text-silver-muted hover:text-neon transition-colors text-left"
                  onClick={() => { setMode('register'); setError('') }}
                >
                  没有账号？<span className="text-neon">立即注册</span>
                </button>
                <button
                  className="text-silver-muted hover:text-neon transition-colors text-left"
                  onClick={() => { setMode('forgot'); setError('') }}
                >
                  忘记密码？
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button
                className="flex items-center gap-1 text-silver-muted hover:text-neon transition-colors text-left"
                onClick={() => { setMode('login'); setError('') }}
              >
                <ArrowLeft className="w-3 h-3" /> 返回登录
              </button>
            )}
          </div>
        </div>

        {/* 身份码提示 */}
        {mode === 'register' && (
          <div className="mt-4 text-center text-xs text-silver-dim stagger-item" style={{ animationDelay: '200ms' }}>
            身份码 <span className="text-neon">Admin</span> = 管理员（全部权限） · <span className="text-neon">User</span> = 普通用户
          </div>
        )}
      </div>
    </div>
  )
}
