/**
 * 团队数据服务 — 创建/申请/审批/踢出/团队文件夹
 */
import { readJson, writeJson, genId } from './db.js'

export interface Team {
  id: string
  name: string
  creatorId: string
  members: string[]
  pendingRequests: string[]
  createdAt: string
}

interface TeamsData {
  teams: Team[]
}

const FILE = 'teams.json'
const MAX_TEAMS_PER_USER = 3

function load(): TeamsData {
  return readJson<TeamsData>(FILE, { teams: [] })
}

function save(data: TeamsData): void {
  writeJson(FILE, data)
}

export function listTeams(): Team[] {
  return load().teams
}

export function getTeamById(id: string): Team | null {
  return load().teams.find((t) => t.id === id) || null
}

export function createTeam(name: string, creatorId: string): Team {
  const data = load()
  const userTeamCount = data.teams.filter((t) => t.creatorId === creatorId).length
  if (userTeamCount >= MAX_TEAMS_PER_USER) {
    throw new Error(`每人最多创建 ${MAX_TEAMS_PER_USER} 个团队`)
  }
  const team: Team = {
    id: genId(),
    name: name.trim(),
    creatorId,
    members: [creatorId],
    pendingRequests: [],
    createdAt: new Date().toISOString(),
  }
  data.teams.push(team)
  save(data)
  return team
}

export function requestJoin(teamId: string, userId: string): void {
  const data = load()
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) throw new Error('团队不存在')
  if (team.members.includes(userId)) throw new Error('你已是团队成员')
  if (team.pendingRequests.includes(userId)) throw new Error('已发送申请，等待审批')
  team.pendingRequests.push(userId)
  save(data)
}

export function approveRequest(teamId: string, userId: string, approverId: string): void {
  const data = load()
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) throw new Error('团队不存在')
  if (team.creatorId !== approverId) throw new Error('仅团队创建者可审批')
  team.pendingRequests = team.pendingRequests.filter((u) => u !== userId)
  if (!team.members.includes(userId)) {
    team.members.push(userId)
  }
  save(data)
}

export function rejectRequest(teamId: string, userId: string, approverId: string): void {
  const data = load()
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) throw new Error('团队不存在')
  if (team.creatorId !== approverId) throw new Error('仅团队创建者可审批')
  team.pendingRequests = team.pendingRequests.filter((u) => u !== userId)
  save(data)
}

export function kickMember(teamId: string, userId: string, kickerId: string): void {
  const data = load()
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) throw new Error('团队不存在')
  if (team.creatorId !== kickerId) throw new Error('仅团队创建者可踢出成员')
  if (userId === team.creatorId) throw new Error('不能踢出团队创建者')
  team.members = team.members.filter((u) => u !== userId)
  save(data)
}

export function isMember(teamId: string, userId: string): boolean {
  const team = getTeamById(teamId)
  return !!team && team.members.includes(userId)
}

export function isCreator(teamId: string, userId: string): boolean {
  const team = getTeamById(teamId)
  return !!team && team.creatorId === userId
}

/** 获取用户所在的所有团队 */
export function getTeamsForUser(userId: string): Team[] {
  return load().teams.filter((t) => t.members.includes(userId))
}
