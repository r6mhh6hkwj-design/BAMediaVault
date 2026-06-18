/**
 * API 客户端 — 封装所有后端请求
 */
import type { User, MediaFile, Folder, Team, ChatMessage, Permission } from '@/types/media'

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error || '请求失败')
  }
  return data.data as T
}

/** 文件上传（FormData） */
async function uploadFiles(folderId: string | null, files: File[]): Promise<MediaFile[]> {
  const token = getToken()
  const formData = new FormData()
  formData.append('folderId', folderId || '')
  files.forEach((f) => formData.append('files', f))
  const res = await fetch(`${BASE}/files/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.error || '上传失败')
  return data.data as MediaFile[]
}

/** 批量下载（返回 blob） */
async function batchDownload(ids: string[]): Promise<Blob> {
  const token = getToken()
  const res = await fetch(`${BASE}/files/batch-download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('下载失败')
  return res.blob()
}

export const api = {
  // 认证
  register: (username: string, password: string, identityCode: string) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, identityCode }) }),
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  forgotPassword: (username: string, newPassword: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ username, newPassword }) }),
  getMe: () => request<User>('/auth/me'),
  getUsers: () => request<User[]>('/auth/users'),
  updatePermissions: (userId: string, permissions: string[]) =>
    request(`/auth/users/${userId}/permissions`, { method: 'PATCH', body: JSON.stringify({ permissions }) }),
  deleteUser: (userId: string) =>
    request(`/auth/users/${userId}`, { method: 'DELETE' }),

  // 文件
  getFiles: (folderId: string | null) => request<MediaFile[]>(`/files?folderId=${folderId || ''}`),
  uploadFiles,
  downloadFile: (id: string) => `${BASE}/files/${id}/download`,
  batchDownload,
  deleteFile: (id: string) => request(`/files/${id}`, { method: 'DELETE' }),
  batchDelete: (ids: string[]) =>
    request<{ deleted: number }>(`/files/batch-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
  renameFile: (id: string, name: string) =>
    request<MediaFile>(`/files/${id}/rename`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  moveFile: (id: string, folderId: string | null) =>
    request<MediaFile>(`/files/${id}/move`, { method: 'PATCH', body: JSON.stringify({ folderId }) }),

  // 文件夹
  getFolders: (parentId: string | null) => request<Folder[]>(`/folders?parentId=${parentId || ''}`),
  getBreadcrumb: (folderId: string | null) => request<Folder[]>(`/folders/breadcrumb?folderId=${folderId || ''}`),
  createFolder: (name: string, parentId: string | null, teamId?: string | null) =>
    request<Folder>('/folders', { method: 'POST', body: JSON.stringify({ name, parentId, teamId }) }),
  renameFolder: (id: string, name: string) =>
    request<Folder>(`/folders/${id}/rename`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteFolder: (id: string, password?: string) =>
    request(`/folders/${id}`, { method: 'DELETE', body: JSON.stringify({ password }) }),
  setFolderPassword: (id: string, password: string) =>
    request(`/folders/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) }),
  verifyFolderPassword: (id: string, password: string) =>
    request<{ valid: boolean }>(`/folders/${id}/verify`, { method: 'POST', body: JSON.stringify({ password }) }),
  checkFolderAccess: (id: string) =>
    request<{ hasAccess: boolean; isTeamFolder: boolean; teamName?: string; teamId?: string }>(`/folders/${id}/access`),

  // 团队
  getTeams: () => request<Team[]>('/teams'),
  getMyTeams: () => request<Team[]>('/teams/mine'),
  createTeam: (name: string) => request<Team>('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  joinTeam: (id: string) => request(`/teams/${id}/join`, { method: 'POST' }),
  approveRequest: (teamId: string, userId: string) =>
    request(`/teams/${teamId}/approve/${userId}`, { method: 'POST' }),
  rejectRequest: (teamId: string, userId: string) =>
    request(`/teams/${teamId}/reject/${userId}`, { method: 'POST' }),
  kickMember: (teamId: string, userId: string) =>
    request(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
  checkTeamAccess: (id: string) =>
    request<{ isMember: boolean; isCreator: boolean; team: Team }>(`/teams/${id}/access`),

  // 聊天
  getUnreadCount: () => request<{ count: number }>('/chat/unread'),
  getMessages: (teamId: string) => request<ChatMessage[]>(`/chat/${teamId}`),
  sendMessage: (teamId: string, content: string) =>
    request<ChatMessage>(`/chat/${teamId}`, { method: 'POST', body: JSON.stringify({ content }) }),
  recallMessage: (teamId: string, messageId: string) =>
    request(`/chat/${teamId}/${messageId}`, { method: 'DELETE' }),
  markRead: (teamId: string) => request(`/chat/${teamId}/read`, { method: 'POST' }),
}

export type { Permission }
