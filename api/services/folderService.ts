/**
 * 文件夹数据服务 — CRUD / 密码保护 / 团队文件夹
 */
import bcrypt from 'bcryptjs'
import { readJson, writeJson, genId } from './db.js'

export interface Folder {
  id: string
  name: string
  parentId: string | null
  passwordHash: string | null
  creatorId: string
  teamId: string | null
  createdAt: string
}

interface FoldersData {
  folders: Folder[]
}

const FILE = 'folders.json'

function load(): FoldersData {
  return readJson<FoldersData>(FILE, { folders: [] })
}

function save(data: FoldersData): void {
  writeJson(FILE, data)
}

export function getFoldersByParentId(parentId: string | null): Folder[] {
  const data = load()
  return data.folders.filter((f) => f.parentId === parentId)
}

export function getFolderById(id: string): Folder | null {
  const data = load()
  return data.folders.find((f) => f.id === id) || null
}

export function createFolder(params: {
  name: string
  parentId: string | null
  creatorId: string
  teamId?: string | null
}): Folder {
  const data = load()
  const folder: Folder = {
    id: genId(),
    name: params.name,
    parentId: params.parentId,
    passwordHash: null,
    creatorId: params.creatorId,
    teamId: params.teamId || null,
    createdAt: new Date().toISOString(),
  }
  data.folders.push(folder)
  save(data)
  return folder
}

export function renameFolder(id: string, name: string): Folder {
  const data = load()
  const folder = data.folders.find((f) => f.id === id)
  if (!folder) throw new Error('文件夹不存在')
  folder.name = name
  save(data)
  return folder
}

/** 删除文件夹（含子内容） */
export function deleteFolder(id: string): void {
  const data = load()
  // 递归收集所有子文件夹
  const toDelete: string[] = [id]
  let changed = true
  while (changed) {
    changed = false
    for (const f of data.folders) {
      if (f.parentId && toDelete.includes(f.parentId) && !toDelete.includes(f.id)) {
        toDelete.push(f.id)
        changed = true
      }
    }
  }
  data.folders = data.folders.filter((f) => !toDelete.includes(f.id))
  save(data)
  // 注意：文件夹内文件的 folderId 清理由 fileService 在路由层处理
}

export async function setFolderPassword(id: string, password: string): Promise<void> {
  const data = load()
  const folder = data.folders.find((f) => f.id === id)
  if (!folder) throw new Error('文件夹不存在')
  folder.passwordHash = await bcrypt.hash(password, 10)
  save(data)
}

export async function verifyFolderPassword(id: string, password: string): Promise<boolean> {
  const folder = getFolderById(id)
  if (!folder) throw new Error('文件夹不存在')
  if (!folder.passwordHash) return true
  return bcrypt.compare(password, folder.passwordHash)
}

export function hasPassword(id: string): boolean {
  const folder = getFolderById(id)
  return !!folder?.passwordHash
}

/** 获取面包屑路径（从根到当前文件夹） */
export function getBreadcrumb(folderId: string | null): Folder[] {
  if (!folderId) return []
  const data = load()
  const path: Folder[] = []
  let current = data.folders.find((f) => f.id === folderId)
  while (current) {
    path.unshift(current)
    current = current.parentId ? data.folders.find((f) => f.id === current!.parentId) : undefined
  }
  return path
}
