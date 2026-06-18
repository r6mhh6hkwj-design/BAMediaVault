/**
 * 认证与权限状态管理
 */
import { create } from 'zustand'
import { api } from '@/lib/api'
import type { User, Permission } from '@/types/media'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  init: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, identityCode: string) => Promise<void>
  logout: () => void
  hasPermission: (p: Permission) => boolean
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: true,

  init: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ loading: false, user: null })
      return
    }
    try {
      const user = await api.getMe()
      set({ user, token, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, loading: false })
    }
  },

  login: async (username, password) => {
    const { token, user } = await api.login(username, password)
    localStorage.setItem('token', token)
    set({ token, user })
  },

  register: async (username, password, identityCode) => {
    await api.register(username, password, identityCode)
    // 注册成功后自动登录
    await get().login(username, password)
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  hasPermission: (p: Permission) => {
    const user = get().user
    if (!user) return false
    return user.permissions.includes(p)
  },

  refreshUser: async () => {
    try {
      const user = await api.getMe()
      set({ user })
    } catch {
      // ignore
    }
  },
}))
