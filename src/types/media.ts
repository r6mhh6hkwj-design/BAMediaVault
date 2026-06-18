/**
 * 核心类型定义
 */

export type FileType = 'video' | 'image' | 'audio' | 'document' | 'archive'

export type Permission =
  | 'view'
  | 'upload'
  | 'edit_own'
  | 'edit_all'
  | 'delete_own'
  | 'delete_all'
  | 'folder_create'
  | 'folder_manage_all'
  | 'manage_users'

export interface User {
  id: string
  username: string
  role: 'admin' | 'user'
  permissions: string[]
  createdAt: string
}

export interface MediaFile {
  id: string
  name: string
  type: FileType
  mimeType: string
  size: number
  folderId: string | null
  uploaderId: string
  createdAt: string
}

export interface Folder {
  id: string
  name: string
  parentId: string | null
  passwordHash: string | null
  creatorId: string
  teamId: string | null
  createdAt: string
}

export interface Team {
  id: string
  name: string
  creatorId: string
  members: string[]
  pendingRequests: string[]
  createdAt: string
}

export interface ChatMessage {
  id: string
  teamId: string
  senderId: string
  content: string
  createdAt: string
  recalled: boolean
}

export const FILE_TYPE_LABELS: Record<FileType, string> = {
  video: '视频',
  image: '图片',
  audio: '音频',
  document: '文档',
  archive: '压缩包',
}

export const FILE_TYPE_ICONS: Record<FileType, string> = {
  video: 'Film',
  image: 'Image',
  audio: 'Music',
  document: 'FileText',
  archive: 'Archive',
}
