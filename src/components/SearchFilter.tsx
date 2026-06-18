/**
 * 搜索与类型筛选器
 */
import { Search, Film, Image, Music, FileText, Archive, LayoutGrid } from 'lucide-react'
import { useMediaStore, type FilterType } from '@/store/mediaStore'

const FILTERS: { key: FilterType; label: string; icon: typeof Film }[] = [
  { key: 'all', label: '全部', icon: LayoutGrid },
  { key: 'video', label: '视频', icon: Film },
  { key: 'image', label: '图片', icon: Image },
  { key: 'audio', label: '音频', icon: Music },
  { key: 'document', label: '文档', icon: FileText },
  { key: 'archive', label: '压缩包', icon: Archive },
]

export default function SearchFilter() {
  const searchQuery = useMediaStore((s) => s.searchQuery)
  const setSearchQuery = useMediaStore((s) => s.setSearchQuery)
  const filterType = useMediaStore((s) => s.filterType)
  const setFilterType = useMediaStore((s) => s.setFilterType)

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3">
      {/* 搜索框 */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-dim" />
        <input
          className="input-glass w-full rounded-lg pl-10 pr-4 py-2.5 text-sm"
          placeholder="搜索文件名..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 类型筛选 */}
      <div className="flex items-center gap-1 glass rounded-lg p-1 overflow-x-auto no-scrollbar">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-all ${
              filterType === key
                ? 'bg-neon/20 text-neon'
                : 'text-silver-muted hover:text-silver'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
