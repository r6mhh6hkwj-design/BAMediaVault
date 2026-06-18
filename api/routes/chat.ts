/**
 * 聊天路由 — 发送/撤回/历史/未读
 */
import { Router, type Response } from 'express'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import {
  sendMessage,
  getMessages,
  recallMessage,
  markRead,
  getUnreadCount,
} from '../services/chatService.js'
import { isMember, getTeamsForUser } from '../services/teamService.js'

const router = Router()

/** 获取未读消息总数 */
router.get('/unread', authenticate, (req: AuthRequest, res: Response): void => {
  const teams = getTeamsForUser(req.userId!)
  const count = getUnreadCount(req.userId!, teams.map((t) => t.id))
  res.json({ success: true, data: { count } })
})

/** 获取团队聊天历史 */
router.get('/:teamId', authenticate, (req: AuthRequest, res: Response): void => {
  if (!isMember(req.params.teamId, req.userId!)) {
    res.status(403).json({ success: false, error: '非团队成员无权查看聊天' })
    return
  }
  res.json({ success: true, data: getMessages(req.params.teamId) })
})

/** 发送消息 */
router.post('/:teamId', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    if (!isMember(req.params.teamId, req.userId!)) {
      res.status(403).json({ success: false, error: '非团队成员无权发送消息' })
      return
    }
    const { content } = req.body
    if (!content || !content.trim()) {
      res.status(400).json({ success: false, error: '消息不能为空' })
      return
    }
    const msg = sendMessage(req.params.teamId, req.userId!, content)
    res.json({ success: true, data: msg })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 撤回消息（2 分钟内） */
router.delete('/:teamId/:messageId', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    recallMessage(req.params.teamId, req.params.messageId, req.userId!)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 标记已读 */
router.post('/:teamId/read', authenticate, (req: AuthRequest, res: Response): void => {
  if (!isMember(req.params.teamId, req.userId!)) {
    res.status(403).json({ success: false, error: '非团队成员' })
    return
  }
  markRead(req.params.teamId, req.userId!)
  res.json({ success: true })
})

export default router
