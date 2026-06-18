/**
 * 认证路由 — 注册/登录/忘记密码/用户管理/注销
 */
import { Router, type Response } from 'express'
import { authenticate, requirePermission, type AuthRequest } from '../middleware/auth.js'
import {
  register,
  login,
  forgotPassword,
  listAllUsers,
  updatePermissions,
  deleteUser,
  getUserById,
  toSafeUser,
} from '../services/userService.js'
import { PERMISSIONS } from '../services/permissions.js'

const router = Router()

/** 注册 */
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const { username, password, identityCode } = req.body
    if (!username || !password || !identityCode) {
      res.status(400).json({ success: false, error: '请填写完整信息' })
      return
    }
    const user = await register(username, password, identityCode)
    res.json({ success: true, data: toSafeUser(user) })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 登录 */
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '请填写用户名和密码' })
      return
    }
    const result = await login(username, password)
    res.json({ success: true, data: result })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 忘记密码 */
router.post('/forgot-password', async (req, res: Response): Promise<void> => {
  try {
    const { username, newPassword } = req.body
    if (!username || !newPassword) {
      res.status(400).json({ success: false, error: '请填写用户名和新密码' })
      return
    }
    await forgotPassword(username, newPassword)
    res.json({ success: true, message: '密码重置成功' })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 获取当前用户信息 */
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  const user = getUserById(req.userId!)
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }
  res.json({ success: true, data: toSafeUser(user) })
})

/** 获取所有用户列表（需 manage_users 权限） */
router.get('/users', authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), (req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: listAllUsers() })
})

/** 更新用户权限（需 manage_users 权限） */
router.patch('/users/:id/permissions', authenticate, requirePermission(PERMISSIONS.MANAGE_USERS), (req: AuthRequest, res: Response): void => {
  try {
    updatePermissions(req.params.id, req.body.permissions)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 注销用户账号（管理员可注销任意用户，普通用户可注销自己） */
router.delete('/users/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const targetId = req.params.id
    const isSelf = req.userId === targetId
    const canManageUsers = req.userPermissions?.includes(PERMISSIONS.MANAGE_USERS)
    if (!isSelf && !canManageUsers) {
      res.status(403).json({ success: false, error: '无权限注销他人账号' })
      return
    }
    deleteUser(targetId)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

export default router
