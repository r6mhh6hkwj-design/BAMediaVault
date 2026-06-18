/**
 * 团队路由 — 创建/申请/审批/踢出/团队文件夹
 */
import { Router, type Response } from 'express'
import { authenticate, type AuthRequest } from '../middleware/auth.js'
import {
  listTeams,
  getTeamById,
  createTeam,
  requestJoin,
  approveRequest,
  rejectRequest,
  kickMember,
  isMember,
  isCreator,
  getTeamsForUser,
} from '../services/teamService.js'

const router = Router()

/** 获取团队列表 */
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: listTeams() })
})

/** 获取当前用户所在团队 */
router.get('/mine', authenticate, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, data: getTeamsForUser(req.userId!) })
})

/** 创建团队 */
router.post('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '请输入团队名称' })
      return
    }
    const team = createTeam(name, req.userId!)
    res.json({ success: true, data: team })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 申请加入团队 */
router.post('/:id/join', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    requestJoin(req.params.id, req.userId!)
    res.json({ success: true, message: '申请已发送，等待审批' })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 审批通过 */
router.post('/:id/approve/:userId', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    approveRequest(req.params.id, req.params.userId, req.userId!)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 审批拒绝 */
router.post('/:id/reject/:userId', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    rejectRequest(req.params.id, req.params.userId, req.userId!)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 踢出成员 */
router.delete('/:id/members/:userId', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    kickMember(req.params.id, req.params.userId, req.userId!)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ success: false, error: (e as Error).message })
  }
})

/** 检查团队访问权限 */
router.get('/:id/access', authenticate, (req: AuthRequest, res: Response): void => {
  const team = getTeamById(req.params.id)
  if (!team) {
    res.status(404).json({ success: false, error: '团队不存在' })
    return
  }
  res.json({
    success: true,
    data: {
      isMember: isMember(req.params.id, req.userId!),
      isCreator: isCreator(req.params.id, req.userId!),
      team,
    },
  })
})

export default router
