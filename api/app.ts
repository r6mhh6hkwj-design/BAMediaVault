/**
 * Express 应用入口 — 注册所有路由与中间件
 */
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { UPLOADS_DIR } from './services/db.js'
import authRoutes from './routes/auth.js'
import fileRoutes from './routes/files.js'
import folderRoutes from './routes/folders.js'
import teamRoutes from './routes/teams.js'
import chatRoutes from './routes/chat.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务（上传的文件，用于预览）
app.use('/uploads', express.static(UPLOADS_DIR))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/folders', folderRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/chat', chatRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error.message)
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  })
})

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
