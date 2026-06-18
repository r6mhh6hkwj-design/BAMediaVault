/**
 * 文件夹路由 — CRUD/密码/团队文件夹
 */
import { Router, type Response } from 'express'
import { authenticate, requirePermission, type AuthRequest } from '../middleware/auth.js'
import { PERMISSIONS } from '../services/permissions.js'
import {
  getFoldersByParentId,
  getFolderById,
  createFolder,
  renameFolder,
  deleteFolder,
  setFolderPassword,
  verifyFolderPassword,
  hasPassword,
  getBreadcrumb,
} from '../services/folderService.js'
import { isMember, getTeamById } from '../services/teamService.js'
import { deleteFilesByFolder } from '../services/fileService.js'

const router = Router()

/** 获取文件夹列表 */
router.get('/', authenticate, requirePermission(PERMISSIONS.VIEW), (req: AuthRequest, res: Response): void => {
  const parentId = (req.query.parentId as string) || null
  res.json({ success: true, data: getFoldersByParentId(parentId) })
})

/** 获取面包屑路径 */
router.get('/breadcrumb', authenticate, requirePermission(PERMISSIONS.VIEW), (req: AuthRequest, res: Response): void => {
  const folderId = (req.query.folderId as string) || null
  res.json({ success: true, data: getBreadcrumb(folderId) })
})

/** 创建文件夹 */
router.post('/', authenticate, requirePermission(PERMISSIONS.FOLDER_CREATE), (req: AuthRequest, res: Response): void => {
  try {
    const { name, parentId, teamId } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '请输入文件夹名称' })
      return
    }
    // 团队文件夹：仅团队创建者可创建
    if (teamId) {
      const team = getTeamById(teamId)
      if (!team) {
        res.status(400).json({ success: false, error: '团队不存在' })
        return
      }
      if (team.creatorId !== req.userId) {
        res.status(403).json({ success: false, error: '仅团队创建者可创建团队文件夹' })
        return
      }
    }
    const folder = createFolder({ name, parentId: parentId || null, creatorId: req.userId!, teamId: teamId || null })
    res.json({ success: true, data: folder })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 重命名文件夹 */
router.patch('/:id/rename', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const folder = getFolderById(req.params.id)
    if (!folder) {
      res.status(404).json({ success: false, error: '文件夹不存在' })
      return
    }
    const isOwner = folder.creatorId === req.userId
    const canManageAll = req.userPermissions?.includes(PERMISSIONS.FOLDER_MANAGE_ALL)
    if (!isOwner && !canManageAll) {
      res.status(403).json({ success: false, error: '无权限重命名此文件夹' })
      return
    }
    const updated = renameFolder(req.params.id, req.body.name)
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 删除文件夹（需密码认证） */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const folder = getFolderById(req.params.id)
    if (!folder) {
      res.status(404).json({ success: false, error: '文件夹不存在' })
      return
    }
    const isOwner = folder.creatorId === req.userId
    const canManageAll = req.userPermissions?.includes(PERMISSIONS.FOLDER_MANAGE_ALL)
    if (!isOwner && !canManageAll) {
      res.status(403).json({ success: false, error: '无权限删除此文件夹' })
      return
    }
    // 若有密码，需验证
    if (folder.passwordHash) {
      const pwd = req.body.password as string
      if (!pwd) {
        res.status(403).json({ success: false, error: '需要文件夹密码', requirePassword: true })
        return
      }
      const ok = await verifyFolderPassword(req.params.id, pwd)
      if (!ok) {
        res.status(403).json({ success: false, error: '文件夹密码错误' })
        return
      }
    }
    // 删除文件夹内所有文件
    deleteFilesByFolder(req.params.id)
    deleteFolder(req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 设置/修改文件夹密码（管理员可设置，每位管理员只能管理自己设置的密码） */
router.post('/:id/password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const folder = getFolderById(req.params.id)
    if (!folder) {
      res.status(404).json({ success: false, error: '文件夹不存在' })
      return
    }
    const canManageAll = req.userPermissions?.includes(PERMISSIONS.FOLDER_MANAGE_ALL)
    const isOwner = folder.creatorId === req.userId
    if (!canManageAll && !isOwner) {
      res.status(403).json({ success: false, error: '无权限设置文件夹密码' })
      return
    }
    await setFolderPassword(req.params.id, req.body.password)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 验证文件夹密码 */
router.post('/:id/verify', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ok = await verifyFolderPassword(req.params.id, req.body.password)
    res.json({ success: true, data: { valid: ok } })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 检查团队文件夹访问权限 */
router.get('/:id/access', authenticate, (req: AuthRequest, res: Response): void => {
  const folder = getFolderById(req.params.id)
  if (!folder) {
    res.status(404).json({ success: false, error: '文件夹不存在' })
    return
  }
  if (!folder.teamId) {
    res.json({ success: true, data: { hasAccess: true, isTeamFolder: false } })
    return
  }
  const team = getTeamById(folder.teamId)
  const hasAccess = isMember(folder.teamId, req.userId!)
  res.json({
    success: true,
    data: {
      hasAccess,
      isTeamFolder: true,
      teamName: team?.name,
      teamId: folder.teamId,
    },
  })
})

export default router
