/**
 * 预览弹窗 — 图片缩放/旋转/前后切换/键盘快捷键 + 音频播放 + 下载提示
 */
import { useEffect, useState, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Music, FileText, Archive } from 'lucide-react'
import type { MediaFile } from '@/types/media'
import { api } from '@/lib/api'

interface Props {
  files: MediaFile[]
  current: MediaFile
  onClose: () => void
}

export default function PreviewModal({ files, current, onClose }: Props) {
  const [index, setIndex] = useState(files.findIndex((f) => f.id === current.id))
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const file = files[index]

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + files.length) % files.length)
    setZoom(1); setRotation(0); setPos({ x: 0, y: 0 })
  }, [files.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % files.length)
    setZoom(1); setRotation(0); setPos({ x: 0, y: 0 })
  }, [files.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.2, 4))
      if (e.key === '-') setZoom((z) => Math.max(z - 0.2, 0.5))
      if (e.key === 'r') setRotation((r) => r + 90)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goPrev, goNext])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    setDragging(true)
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-bounce-in"
      onClick={onClose}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between glass-strong border-b border-white/5" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm text-silver truncate max-w-[50%]">{file.name}</span>
        <div className="flex items-center gap-2">
          {file.type === 'image' && (
            <>
              <button onClick={() => setZoom((z) => Math.min(z + 0.2, 4))} className="p-2 rounded-lg btn-glass">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))} className="p-2 rounded-lg btn-glass">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => setRotation((r) => r + 90)} className="p-2 rounded-lg btn-glass">
                <RotateCw className="w-4 h-4" />
              </button>
            </>
          )}
          <a
            href={api.downloadFile(file.id)}
            download
            className="p-2 rounded-lg btn-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
          <button onClick={onClose} className="p-2 rounded-lg btn-glass hover:text-danger">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 切换按钮 */}
      {files.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev() }}
            className="absolute left-4 p-3 rounded-full glass-strong hover:bg-neon/10 hover:text-neon transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext() }}
            className="absolute right-4 p-3 rounded-full glass-strong hover:bg-neon/10 hover:text-neon transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 内容区 */}
      <div
        className="flex-1 flex items-center justify-center w-full h-full pt-16 pb-4"
        onClick={onClose}
      >
        {file.type === 'image' && (
          <img
            src={`/uploads/${file.id}-${file.name}`}
            alt={file.name}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            className="max-w-[90%] max-h-[85%] object-contain select-none transition-transform"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
            }}
          />
        )}

        {file.type === 'audio' && (
          <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon to-neon-dark flex items-center justify-center animate-breath">
                <Music className="w-10 h-10 text-black" />
              </div>
              <div className="text-center">
                <div className="text-silver font-medium">{file.name}</div>
              </div>
              <audio controls className="w-full">
                <source src={`/uploads/${file.id}-${file.name}`} type={file.mimeType} />
              </audio>
            </div>
          </div>
        )}

        {file.type === 'video' && (
          <video
            controls
            className="max-w-[90%] max-h-[85%]"
            onClick={(e) => e.stopPropagation()}
          >
            <source src={`/uploads/${file.id}-${file.name}`} type={file.mimeType} />
          </video>
        )}

        {(file.type === 'document' || file.type === 'archive') && (
          <div className="glass-strong rounded-2xl p-10 max-w-md text-center" onClick={(e) => e.stopPropagation()}>
            {file.type === 'document' ? (
              <FileText className="w-16 h-16 text-green-400 mx-auto mb-4" strokeWidth={1.5} />
            ) : (
              <Archive className="w-16 h-16 text-amber-400 mx-auto mb-4" strokeWidth={1.5} />
            )}
            <div className="text-silver font-medium mb-2">{file.name}</div>
            <p className="text-silver-muted text-sm mb-4">此文件类型不支持在线预览</p>
            <a
              href={api.downloadFile(file.id)}
              download
              className="btn-neon inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm"
            >
              <Download className="w-4 h-4" /> 下载文件
            </a>
          </div>
        )}
      </div>

      {/* 底部计数 */}
      {files.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-strong rounded-full px-4 py-1.5 text-xs text-silver-muted">
          {index + 1} / {files.length}
        </div>
      )}
    </div>
  )
}
