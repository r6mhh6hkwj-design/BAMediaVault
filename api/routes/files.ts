/**
 * 文件路由 — 上传/下载/删除/批量/移动/重命名
 */
import { Router, type Response } from 'express'
import multer from 'multer'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { authenticate, requirePermission, type AuthRequest } from '../middleware/auth.js'
import { PERMISSIONS, canEditFile, canDeleteFile } from '../services/permissions.js'
import {
  createFile,
  getFilesByFolder,
  getFileById,
  getFilesByIds,
  renameFile,
  moveFile,
  deleteFile,
  deleteFiles,
  getFilePath,
} from '../services/fileService.js'
import { UPLOADS_DIR } from '../services/db.js'

const router = Router()

// multer 存储配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const fileId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    cb(null, `${fileId}-${file.originalname}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
})

/** 获取文件列表 */
router.get('/', authenticate, requirePermission(PERMISSIONS.VIEW), (req: AuthRequest, res: Response): void => {
  const folderId = (req.query.folderId as string) || null
  res.json({ success: true, data: getFilesByFolder(folderId) })
})

/** 上传文件 */
router.post('/upload', authenticate, requirePermission(PERMISSIONS.UPLOAD), upload.array('files'), (req: AuthRequest, res: Response): void => {
  try {
    const folderId = (req.body.folderId as string) || null
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: '未选择文件' })
      return
    }
    const created = files.map((f) =>
      createFile({
        name: f.originalname,
        mimeType: f.mimetype,
        size: f.size,
        folderId,
        uploaderId: req.userId!,
      })
    )
    res.json({ success: true, data: created })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 单个下载 */
router.get('/:id/download', authenticate, requirePermission(PERMISSIONS.VIEW), (req: AuthRequest, res: Response): void => {
  const file = getFileById(req.params.id)
  if (!file) {
    res.status(404).json({ success: false, error: '文件不存在' })
    return
  }
  const filePath = getFilePath(file)
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: '物理文件不存在' })
    return
  }
  res.download(filePath, file.name)
})

/** 批量下载（ZIP 打包） */
router.post('/batch-download', authenticate, requirePermission(PERMISSIONS.VIEW), (req: AuthRequest, res: Response): void => {
  try {
    const ids: string[] = req.body.ids || []
    const files = getFilesByIds(ids)
    if (files.length === 0) {
      res.status(400).json({ success: false, error: '未选择有效文件' })
      return
    }
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="batch-download.zip"')
    const archive = archiver('zip', { zlib: { level: 5 } })
    archive.on('error', (err) => {
      res.status(500).json({ success: false, error: err.message })
    })
    archive.pipe(res)
    files.forEach((f) => {
      const fp = getFilePath(f)
      if (fs.existsSync(fp)) {
        archive.file(fp, { name: f.name })
      }
    })
    archive.finalize()
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 单个删除 */
router.delete('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const file = getFileById(req.params.id)
    if (!file) {
      res.status(404).json({ success: false, error: '文件不存在' })
      return
    }
    const isOwner = file.uploaderId === req.userId
    if (!canDeleteFile(req.userPermissions!, isOwner)) {
      res.status(403).json({ success: false, error: '无权限删除此文件' })
      return
    }
    deleteFile(req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 批量删除 */
router.post('/batch-delete', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const ids: string[] = req.body.ids || []
    const files = getFilesByIds(ids)
    const allowed = files.filter((f) => {
      const isOwner = f.uploaderId === req.userId
      return canDeleteFile(req.userPermissions!, isOwner)
    })
    deleteFiles(allowed.map((f) => f.id))
    res.json({ success: true, data: { deleted: allowed.length } })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 重命名 */
router.patch('/:id/rename', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const file = getFileById(req.params.id)
    if (!file) {
      res.status(404).json({ success: false, error: '文件不存在' })
      return
    }
    const isOwner = file.uploaderId === req.userId
    if (!canEditFile(req.userPermissions!, isOwner)) {
      res.status(403).json({ success: false, error: '无权限重命名此文件' })
      return
    }
    const updated = renameFile(req.params.id, req.body.name)
    // 重命名物理文件（id 不变，name 变化）
    const oldPath = getFilePath(file)
    const newPath = getFilePath(updated)
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath)
    }
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 移动到文件夹 */
router.patch('/:id/move', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const file = getFileById(req.params.id)
    if (!file) {
      res.status(404).json({ success: false, error: '文件不存在' })
      return
    }
    const isOwner = file.uploaderId === req.userId
    if (!canEditFile(req.userPermissions!, isOwner)) {
      res.status(403).json({ success: false, error: '无权限移动此文件' })
      return
    }
    const updated = moveFile(req.params.id, req.body.folderId || null)
    res.json({ success: true, data: updated })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

export default router
