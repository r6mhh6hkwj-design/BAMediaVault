/**
 * 团队面板 — 创建团队/申请加入/审批/踢出成员 + 团队聊天
 */
import { useEffect, useState } from 'react'
import { X, Users, UserPlus, Check, UserMinus, MessageSquare, Send, CornerUpLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import type { Team, ChatMessage, User } from '@/types/media'
import { formatDate } from '@/hooks/useInteractions'

interface Props {
  onClose: () => void
}

export default function TeamPanel({ onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const [teams, setTeams] = useState<Team[]>([])
  const [allUsers, setAllUsers] = useState<Record<string, User>>({})
  const [activeTeam, setActiveTeam] = useState<Team | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const loadTeams = async () => {
    try {
      const list = await api.getTeams()
      setTeams(list)
      const users = await api.getUsers().catch(() => [])
      const map: Record<string, User> = {}
      users.forEach((u) => (map[u.id] = u))
      setAllUsers(map)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadTeams()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await api.createTeam(newName.trim())
      setNewName('')
      setCreating(false)
      await loadTeams()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleJoin = async (teamId: string) => {
    try {
      await api.joinTeam(teamId)
      await loadTeams()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  const handleApprove = async (teamId: string, userId: string) => {
    await api.approveRequest(teamId, userId)
    await loadTeams()
  }

  const handleReject = async (teamId: string, userId: string) => {
    await api.rejectRequest(teamId, userId)
    await loadTeams()
  }

  const handleKick = async (teamId: string, userId: string) => {
    if (!confirm('确认踢出该成员？')) return
    await api.kickMember(teamId, userId)
    await loadTeams()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md glass-strong border-l border-neon/20 h-full overflow-y-auto animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {activeTeam ? (
          <TeamChat team={activeTeam} allUsers={allUsers} currentUserId={user!.id} onBack={() => { setActiveTeam(null); loadTeams() }} />
        ) : (
          <>
            {/* 头部 */}
            <div className="sticky top-0 glass-strong border-b border-white/5 p-4 flex items-center justify-between z-10">
              <h2 className="font-display text-lg text-silver flex items-center gap-2">
                <Users className="w-5 h-5 text-neon" /> 班级 / 团队
              </h2>
              <button onClick={onClose} className="text-silver-dim hover:text-silver">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 创建团队 */}
              {creating ? (
                <div className="glass rounded-xl p-3 space-y-2 animate-bounce-in">
                  <input
                    autoFocus
                    className="input-glass w-full rounded-lg px-3 py-2 text-sm"
                    placeholder="团队名称"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate()
                      if (e.key === 'Escape') { setCreating(false); setNewName('') }
                    }}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreate} className="btn-neon flex-1 rounded-lg py-2 text-sm">创建</button>
                    <button onClick={() => { setCreating(false); setNewName('') }} className="btn-glass flex-1 rounded-lg py-2 text-sm">取消</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCreating(true)} className="w-full btn-glass rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" /> 创建团队（每人最多 3 个）
                </button>
              )}

              {/* 团队列表 */}
              {teams.map((team) => {
                const isMember = team.members.includes(user!.id)
                const isCreator = team.creatorId === user!.id
                const hasPending = team.pendingRequests.includes(user!.id)
                return (
                  <div key={team.id} className="glass rounded-xl p-4 stagger-item">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-silver font-medium flex items-center gap-2">
                          {team.name}
                          {isCreator && <span className="text-[10px] px-1.5 py-0.5 rounded bg-neon/20 text-neon">创建者</span>}
                        </div>
                        <div className="text-xs text-silver-dim mt-0.5">{team.members.length} 位成员</div>
                      </div>
                      {isMember && (
                        <button
                          onClick={() => setActiveTeam(team)}
                          className="flex items-center gap-1 btn-glass rounded-lg px-2.5 py-1.5 text-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> 聊天
                        </button>
                      )}
                    </div>

                    {/* 成员列表（仅创建者可见详情） */}
                    {isCreator && (
                      <div className="mt-3 space-y-2">
                        {/* 待审批 */}
                        {team.pendingRequests.length > 0 && (
                          <div className="border-t border-white/5 pt-2">
                            <div className="text-[10px] text-silver-dim uppercase tracking-wider mb-1">待审批</div>
                            {team.pendingRequests.map((uid) => (
                              <div key={uid} className="flex items-center justify-between py-1">
                                <span className="text-sm text-silver-muted">{allUsers[uid]?.username || '未知用户'}</span>
                                <div className="flex gap-1">
                                  <button onClick={() => handleApprove(team.id, uid)} className="p-1 rounded hover:bg-neon/10 text-neon">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleReject(team.id, uid)} className="p-1 rounded hover:bg-danger/10 text-danger">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* 成员 */}
                        <div className="border-t border-white/5 pt-2">
                          <div className="text-[10px] text-silver-dim uppercase tracking-wider mb-1">成员</div>
                          {team.members.map((uid) => (
                            <div key={uid} className="flex items-center justify-between py-1">
                              <span className="text-sm text-silver-muted">
                                {allUsers[uid]?.username || '未知用户'}
                                {uid === team.creatorId && <span className="text-neon text-[10px] ml-1">创建者</span>}
                              </span>
                              {uid !== team.creatorId && (
                                <button onClick={() => handleKick(team.id, uid)} className="p-1 rounded hover:bg-danger/10 text-danger">
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 非成员：申请加入 */}
                    {!isMember && (
                      <button
                        onClick={() => handleJoin(team.id)}
                        disabled={hasPending}
                        className="w-full mt-2 btn-glass rounded-lg py-1.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {hasPending ? '已申请，等待审批' : '申请加入'}
                      </button>
                    )}
                  </div>
                )
              })}

              {teams.length === 0 && (
                <div className="text-center py-12 text-silver-dim text-sm">
                  暂无团队，创建一个开始协作
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** 团队聊天子组件 */
function TeamChat({ team, allUsers, currentUserId, onBack }: {
  team: Team
  allUsers: Record<string, User>
  currentUserId: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)

  const loadMessages = async () => {
    try {
      const list = await api.getMessages(team.id)
      setMessages(list)
      await api.markRead(team.id)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    const t = setInterval(loadMessages, 3000)
    return () => clearInterval(t)
  }, [team.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    try {
      await api.sendMessage(team.id, input.trim())
      setInput('')
      await loadMessages()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const handleRecall = async (msgId: string) => {
    if (!confirm('撤回这条消息？')) return
    try {
      await api.recallMessage(team.id, msgId)
      await loadMessages()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <>
      <div className="sticky top-0 glass-strong border-b border-white/5 p-4 flex items-center gap-3 z-10">
        <button onClick={onBack} className="text-silver-muted hover:text-neon">
          <CornerUpLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="text-silver font-medium">{team.name}</div>
          <div className="text-xs text-silver-dim">{team.members.length} 位成员</div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-silver-dim text-sm py-8">加载中...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-silver-dim text-sm py-8">暂无消息，发送第一条吧</div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === currentUserId
              const sender = allUsers[msg.senderId]
              return (
                <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] group ${isSelf ? 'items-end' : 'items-start'}`}>
                    {!msg.recalled && !isSelf && (
                      <div className="text-[10px] text-silver-dim mb-0.5">{sender?.username || '未知'}</div>
                    )}
                    <div
                      onDoubleClick={isSelf && !msg.recalled ? () => handleRecall(msg.id) : undefined}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.recalled
                          ? 'bg-white/5 text-silver-dim italic'
                          : isSelf
                          ? 'bg-gradient-to-br from-neon to-neon-dark text-black'
                          : 'glass text-silver'
                      }`}
                    >
                      {msg.recalled ? '消息已撤回' : msg.content}
                    </div>
                    <div className={`text-[10px] text-silver-dim mt-0.5 ${isSelf ? 'text-right' : ''}`}>
                      {formatDate(msg.createdAt)}
                      {isSelf && !msg.recalled && (
                        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          双击撤回
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 输入区 */}
        <form onSubmit={handleSend} className="p-4 border-t border-white/5 flex gap-2">
          <input
            className="input-glass flex-1 rounded-lg px-4 py-2.5 text-sm"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()} className="btn-neon rounded-lg px-4 py-2.5 disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  )
}
