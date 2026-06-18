/**
 * 交互效果 Hooks — 3D 倾斜 / 聚光灯 / 波纹 / 光标追踪
 */
import { useCallback, useEffect, useRef } from 'react'

/** 3D 鼠标跟随倾斜 + 聚光灯追踪 */
export function useTilt(max = 8) {
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const cx = rect.width / 2
      const cy = rect.height / 2
      const rx = ((y - cy) / cy) * -max
      const ry = ((x - cx) / cx) * max
      el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`
      el.style.setProperty('--mx', `${(x / rect.width) * 100}%`)
      el.style.setProperty('--my', `${(y / rect.height) * 100}%`)
    },
    [max]
  )

  const onMouseLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)'
  }, [])

  return { ref, onMouseMove, onMouseLeave }
}

/** 点击波纹效果 */
export function useRipple() {
  return useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const ripple = document.createElement('span')
    ripple.className = 'ripple-effect'
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`
    el.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }, [])
}

/** 全局光标追踪光晕 */
export function useCursorGlow() {
  useEffect(() => {
    const glow = document.createElement('div')
    glow.className = 'cursor-glow'
    document.body.appendChild(glow)
    let raf = 0
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        glow.style.left = `${e.clientX}px`
        glow.style.top = `${e.clientY}px`
      })
    }
    window.addEventListener('mousemove', move)
    return () => {
      window.removeEventListener('mousemove', move)
      glow.remove()
      cancelAnimationFrame(raf)
    }
  }, [])
}

/** 文件大小格式化 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** 时间格式化 */
export function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}
