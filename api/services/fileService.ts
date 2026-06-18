/**
 * 文件数据服务 — 5 种文件类型识别与元数据管理
 */
import fs from 'fs'
import path from 'path'
import { readJson, writeJson, genId, now, UPLOADS_DIR } from './db.js'

export type FileType = 'video' | 'image' | 'audio' | 'document' | 'archive'

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

interface FilesData {
  files: MediaFile[]
}

const FILE = 'files.json'

const EXT_MAP: Record<string, FileType> = {
  // video
  mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video',
  flv: 'video', wmv: 'video', m4v: 'video', '3gp': 'video', ts: 'video',
  mpeg: 'video', mpg: 'video',
  // image
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  svg: 'image', bmp: 'image', tiff: 'image', avif: 'image', heic: 'image', heif: 'image',
  // audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio',
  m4a: 'audio', wma: 'audio', mid: 'audio', midi: 'audio',
  // document
  pdf: 'document', doc: 'document', docx: 'document', xls: 'document', xlsx: 'document',
  ppt: 'document', pptx: 'document', txt: 'document', csv: 'document', rtf: 'document',
  // archive
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
}

export function getFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return EXT_MAP[ext] || 'document'
}

function load(): FilesData {
  return readJson<FilesData>(FILE, { files: [] })
}

function save(data: FilesData): void {
  writeJson(FILE, data)
}

export function createFile(params: {
  name: string
  mimeType: string
  size: number
  folderId: string | null
  uploaderId: string
}): MediaFile {
  const data = load()
  const file: MediaFile = {
    id: genId(),
    name: params.name,
    type: getFileType(params.name),
    mimeType: params.mimeType,
    size: params.size,
    folderId: params.folderId,
    uploaderId: params.uploaderId,
    createdAt: now(),
  }
  data.files.push(file)
  save(data)
  return file
}

export function getFilesByFolder(folderId: string | null): MediaFile[] {
  const data = load()
  return data.files.filter((f) => f.folderId === folderId)
}

export function getFileById(id: string): MediaFile | null {
  const data = load()
  return data.files.find((f) => f.id === id) || null
}

export function getFilesByIds(ids: string[]): MediaFile[] {
  const data = load()
  return data.files.filter((f) => ids.includes(f.id))
}

export function renameFile(id: string, name: string): MediaFile {
  const data = load()
  const file = data.files.find((f) => f.id === id)
  if (!file) throw new Error('文件不存在')
  file.name = name
  file.type = getFileType(name)
  save(data)
  return file
}

export function moveFile(id: string, folderId: string | null): MediaFile {
  const data = load()
  const file = data.files.find((f) => f.id === id)
  if (!file) throw new Error('文件不存在')
  file.folderId = folderId
  save(data)
  return file
}

export function deleteFile(id: string): void {
  const data = load()
  const file = data.files.find((f) => f.id === id)
  if (!file) throw new Error('文件不存在')
  // 删除物理文件
  const physicalPath = path.join(UPLOADS_DIR, `${id}-${file.name}`)
  if (fs.existsSync(physicalPath)) {
    fs.unlinkSync(physicalPath)
  }
  data.files = data.files.filter((f) => f.id !== id)
  save(data)
}

export function deleteFiles(ids: string[]): void {
  ids.forEach((id) => {
    try {
      deleteFile(id)
    } catch {
      // 忽略不存在的文件
    }
  })
}

/** 删除某文件夹下的所有文件（含子文件夹递归） */
export function deleteFilesByFolder(folderId: string): void {
  const data = load()
  const toDelete = data.files.filter((f) => f.folderId === folderId).map((f) => f.id)
  deleteFiles(toDelete)
}

/** 获取文件物理路径 */
export function getFilePath(file: MediaFile): string {
  return path.join(UPLOADS_DIR, `${file.id}-${file.name}`)
}
