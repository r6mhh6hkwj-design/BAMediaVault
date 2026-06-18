/**
 * 认证与权限中间件 — JWT 解析 + 权限实时读取
 */
import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getUserById, getUserPermissions } from '../services/userService.js'
import { hasPermission, type Permission } from '../services/permissions.js'

const JWT_SECRET = process.env.JWT_SECRET || 'hardcore-media-vault-secret-2026'

export interface AuthRequest extends Request {
  userId?: string
  userPermissions?: string[]
}

/** 从请求头解析 JWT，挂载 userId 与实时权限 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = getUserById(payload.userId)
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' })
      return
    }
    req.userId = user.id
    // 实时读取权限，避免权限变更后延迟生效
    req.userPermissions = getUserPermissions(user.id)
    next()
  } catch {
    res.status(401).json({ success: false, error: '登录已过期' })
  }
}

/** 权限校验中间件工厂 */
export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userPermissions || !hasPermission(req.userPermissions, permission)) {
      res.status(403).json({ success: false, error: '无权限执行此操作' })
      return
    }
    next()
  }
}
