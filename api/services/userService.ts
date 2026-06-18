/**
 * 用户数据服务 — 注册/登录/忘记密码/权限管理
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { readJson, writeJson, genId, now } from './db.js'
import {
  DEFAULT_USER_PERMISSIONS,
  DEFAULT_ADMIN_PERMISSIONS,
  type Permission,
} from './permissions.js'

const JWT_SECRET = process.env.JWT_SECRET || 'hardcore-media-vault-secret-2026'
const RESET_LIMIT_PER_MONTH = 3

export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'user'
  permissions: string[]
  passwordResetLog: Record<string, number>
  createdAt: string
}

interface UsersData {
  users: User[]
}

const FILE = 'users.json'

function load(): UsersData {
  return readJson<UsersData>(FILE, { users: [] })
}

function save(data: UsersData): void {
  writeJson(FILE, data)
}

/** 身份码映射：Admin -> 管理员，User -> 普通用户 */
function resolveRole(identityCode: string): 'admin' | 'user' | null {
  const code = identityCode.trim().toLowerCase()
  if (code === 'admin') return 'admin'
  if (code === 'user') return 'user'
  return null
}

export function getDefaultPermissions(role: 'admin' | 'user'): Permission[] {
  return role === 'admin' ? [...DEFAULT_ADMIN_PERMISSIONS] : [...DEFAULT_USER_PERMISSIONS]
}

export async function register(username: string, password: string, identityCode: string): Promise<User> {
  const data = load()
  const existing = data.users.find((u) => u.username === username.trim())
  if (existing) {
    throw new Error('用户名已存在')
  }
  const role = resolveRole(identityCode)
  if (!role) {
    throw new Error('身份码无效（请输入 Admin 或 User）')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user: User = {
    id: genId(),
    username: username.trim(),
    passwordHash,
    role,
    permissions: getDefaultPermissions(role),
    passwordResetLog: {},
    createdAt: now(),
  }
  data.users.push(user)
  save(data)
  return user
}

export async function login(username: string, password: string): Promise<{ token: string; user: Omit<User, 'passwordHash' | 'passwordResetLog'> }> {
  const data = load()
  const user = data.users.find((u) => u.username === username.trim())
  if (!user) {
    throw new Error('用户名或密码错误')
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    throw new Error('用户名或密码错误')
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  const { passwordHash: _ph, passwordResetLog: _pr, ...safe } = user
  return { token, user: safe }
}

/** 忘记密码 — 每月最多重置 3 次 */
export async function forgotPassword(username: string, newPassword: string): Promise<void> {
  const data = load()
  const user = data.users.find((u) => u.username === username.trim())
  if (!user) {
    throw new Error('用户不存在')
  }
  const monthKey = new Date().toISOString().slice(0, 7) // YYYY-MM
  const used = user.passwordResetLog[monthKey] || 0
  if (used >= RESET_LIMIT_PER_MONTH) {
    throw new Error(`本月密码重置次数已达上限（${RESET_LIMIT_PER_MONTH} 次）`)
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  user.passwordResetLog[monthKey] = used + 1
  save(data)
}

export function getUserById(id: string): User | null {
  const data = load()
  return data.users.find((u) => u.id === id) || null
}

/** 实时读取用户权限（避免权限变更后延迟生效） */
export function getUserPermissions(id: string): string[] {
  const user = getUserById(id)
  return user ? user.permissions : []
}

export function getUserRole(id: string): 'admin' | 'user' | null {
  const user = getUserById(id)
  return user ? user.role : null
}

export function listAllUsers(): Omit<User, 'passwordHash' | 'passwordResetLog'>[] {
  const data = load()
  return data.users.map(({ passwordHash: _ph, passwordResetLog: _pr, ...rest }) => rest)
}

export function updatePermissions(userId: string, permissions: string[]): void {
  const data = load()
  const user = data.users.find((u) => u.id === userId)
  if (!user) {
    throw new Error('用户不存在')
  }
  user.permissions = permissions
  save(data)
}

export function deleteUser(userId: string): void {
  const data = load()
  data.users = data.users.filter((u) => u.id !== userId)
  save(data)
}

export function toSafeUser(user: User): Omit<User, 'passwordHash' | 'passwordResetLog'> {
  const { passwordHash: _ph, passwordResetLog: _pr, ...safe } = user
  return safe
}
