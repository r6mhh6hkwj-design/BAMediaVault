/**
 * 主页 — 文件/文件夹管理主界面
 */
import { useEffect, useState } from 'react'
import { useMediaStore } from '@/store/mediaStore'
import { api } from '@/lib/api'
import type { MediaFile, Folder } from '@/types/media'
import Header from '@/components/Header'
import UploadZone from '@/components/UploadZone'
import SearchFilter from '@/components/SearchFilter'
import FolderNav from '@/components/FolderNav'
import MediaGrid from '@/components/MediaGrid'
import BatchBar from '@/components/BatchBar'
import PreviewModal from '@/components/PreviewModal'
import RenameModal from '@/components/RenameModal'
import FolderPasswordModal from '@/components/FolderPasswordModal'
import TeamPanel from '@/components/TeamPanel'
import AdminPanel from '@/components/AdminPanel'
import { UserPlus, X } from 'lucide-react'

export default function Home() {
  const currentFolderId = useMediaStore((s) => s.currentFolderId)
  const loadFolder = useMediaStore((s) => s.loadFolder)
  const refresh = useMediaStore((s) => s.refresh)
  const files = useMediaStore((s) => s.files)

  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ name: string; isFolder: boolean; id: string } | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<{ folder: Folder; mode: 'set' | 'verify' } | null>(null)
  const [showTeams, setShowTeams] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [accessDenied, setAccessDenied] = useState<Folder | null>(null)

  useEffect(() => {
    loadFolder(null)
  }, [loadFolder])

  const handleRenameFile = (file: MediaFile) => {
    setRenameTarget({ name: file.name, isFolder: false, id: file.id })
  }

  const handleRenameFolder = (folder: Folder) => {
    setRenameTarget({ name: folder.name, isFolder: true, id: folder.id })
  }

  const handleRenameSubmit = async (name: string) => {
    if (!renameTarget) return
    if (renameTarget.isFolder) {
      await api.renameFolder(renameTarget.id, name)
    } else {
      await api.renameFile(renameTarget.id, name)
    }
    await refresh()
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordTarget) return
    if (passwordTarget.mode === 'set') {
      await api.setFolderPassword(passwordTarget.folder.id, password)
    }
    // verify 模式由文件夹删除流程处理，这里仅设置
  }

  const handleJoinTeam = async (folder: Folder) => {
    if (!folder.teamId) return
    try {
      await api.joinTeam(folder.teamId)
      setAccessDenied(null)
      alert('申请已发送，等待团队创建者审批')
    } catch (e) {
      alert((e as Error).message)
    }
  }

  return (
    <div className="relative min-h-screen">
      <Header onOpenTeams={() => setShowTeams(true)} onOpenAdmin={() => setShowAdmin(true)} />

      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 py-6 pb-24">
        <FolderNav />
        <UploadZone />
        <SearchFilter />
        <MediaGrid
          onPreview={setPreviewFile}
          onRenameFile={handleRenameFile}
          onRenameFolder={handleRenameFolder}
          onPassword={(folder) => setPasswordTarget({ folder, mode: 'set' })}
          onAccessDenied={setAccessDenied}
        />
      </main>

      {/* 批量操作栏 */}
      <BatchBar />

      {/* 预览弹窗 */}
      {previewFile && (
        <PreviewModal
          files={files}
          current={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* 重命名弹窗 */}
      {renameTarget && (
        <RenameModal
          initialName={renameTarget.name}
          title={renameTarget.isFolder ? '重命名文件夹' : '重命名文件'}
          onSubmit={handleRenameSubmit}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {/* 文件夹密码弹窗 */}
      {passwordTarget && (
        <FolderPasswordModal
          folderName={passwordTarget.folder.name}
          mode={passwordTarget.mode}
          onSubmit={handlePasswordSubmit}
          onClose={() => setPasswordTarget(null)}
        />
      )}

      {/* 团队面板 */}
      {showTeams && <TeamPanel onClose={() => setShowTeams(false)} />}

      {/* 管理员面板 */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* 团队文件夹访问拒绝提示 */}
      {accessDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setAccessDenied(null)}>
          <div className="neon-border glass-strong rounded-2xl p-6 max-w-sm mx-4 text-center animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setAccessDenied(null)} className="absolute top-3 right-3 text-silver-dim hover:text-silver">
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-danger" />
            </div>
            <h3 className="font-display text-lg text-silver mb-1">无权限查看</h3>
            <p className="text-silver-muted text-sm mb-4">
              「{accessDenied.name}」是团队文件夹，非团队成员无权限访问
            </p>
            <button
              onClick={() => handleJoinTeam(accessDenied)}
              className="btn-neon w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> 申请加入团队
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
