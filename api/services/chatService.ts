/**
 * 聊天数据服务 — 团队聊天/撤回(2分钟)/未读
 */
import { readJson, writeJson, genId, now } from './db.js'

export interface ChatMessage {
  id: string
  teamId: string
  senderId: string
  content: string
  createdAt: string
  recalled: boolean
}

interface ChatsData {
  messages: ChatMessage[]
  /** userId -> teamId -> 最后已读消息时间 */
  readState: Record<string, Record<string, string>>
}

const FILE = 'chats.json'
const RECALL_WINDOW_MS = 2 * 60 * 1000 // 2 分钟

function load(): ChatsData {
  return readJson<ChatsData>(FILE, { messages: [], readState: {} })
}

function save(data: ChatsData): void {
  writeJson(FILE, data)
}

export function sendMessage(teamId: string, senderId: string, content: string): ChatMessage {
  const data = load()
  const msg: ChatMessage = {
    id: genId(),
    teamId,
    senderId,
    content: content.trim(),
    createdAt: now(),
    recalled: false,
  }
  data.messages.push(msg)
  save(data)
  return msg
}

export function getMessages(teamId: string): ChatMessage[] {
  return load().messages.filter((m) => m.teamId === teamId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function recallMessage(teamId: string, messageId: string, userId: string): void {
  const data = load()
  const msg = data.messages.find((m) => m.id === messageId && m.teamId === teamId)
  if (!msg) throw new Error('消息不存在')
  if (msg.senderId !== userId) throw new Error('只能撤回自己的消息')
  const elapsed = Date.now() - new Date(msg.createdAt).getTime()
  if (elapsed > RECALL_WINDOW_MS) throw new Error('超过 2 分钟，无法撤回')
  msg.recalled = true
  save(data)
}

/** 标记某团队消息为已读 */
export function markRead(teamId: string, userId: string): void {
  const data = load()
  if (!data.readState[userId]) data.readState[userId] = {}
  data.readState[userId][teamId] = now()
  save(data)
}

/** 获取用户所有团队的未读消息总数 */
export function getUnreadCount(userId: string, teamIds: string[]): number {
  const data = load()
  const userRead = data.readState[userId] || {}
  let count = 0
  for (const teamId of teamIds) {
    const lastRead = userRead[teamId] ? new Date(userRead[teamId]).getTime() : 0
    const unread = data.messages.filter(
      (m) => m.teamId === teamId && !m.recalled && new Date(m.createdAt).getTime() > lastRead && m.senderId !== userId
    )
    count += unread.length
  }
  return count
}
