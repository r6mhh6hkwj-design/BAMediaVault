/**
 * JSON 文件数据层 — 无数据库依赖，直接读写 JSON 文件
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据目录与上传目录（项目根目录下）
const ROOT = path.resolve(__dirname, '..', '..')
export const DATA_DIR = path.join(ROOT, 'data')
export const UPLOADS_DIR = path.join(ROOT, 'uploads')

// 确保目录存在
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

ensureDir(DATA_DIR)
ensureDir(UPLOADS_DIR)

/** 读取 JSON 文件，若不存在则返回默认值 */
export function readJson<T>(fileName: string, defaultValue: T): T {
  const filePath = path.join(DATA_DIR, fileName)
  if (!fs.existsSync(filePath)) {
    writeJson(fileName, defaultValue)
    return defaultValue
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

/** 写入 JSON 文件（同步） */
export function writeJson<T>(fileName: string, data: T): void {
  const filePath = path.join(DATA_DIR, fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

/** 生成唯一 ID */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** 获取当前 ISO 时间戳 */
export function now(): string {
  return new Date().toISOString()
}
