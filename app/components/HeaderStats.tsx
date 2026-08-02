'use client'

import { useEffect, useState } from 'react'

export default function HeaderStats({ initialCount = 71 }: { initialCount?: number }) {
  const [totalStories, setTotalStories] = useState<number>(initialCount)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/items?limit=1')
      const data = await res.json()
      if (typeof data.totalCount === 'number' && data.totalCount > 0) {
        setTotalStories(data.totalCount)
      } else if (data.items && data.items.length) {
        setTotalStories((prev) => Math.max(prev, data.items.length))
      }
    } catch {
      // Retain fallback
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)

    const handleUpdate = () => fetchStats()
    window.addEventListener('storiesUpdated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storiesUpdated', handleUpdate)
    }
  }, [])

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-[#02050f]/70 p-4 transition duration-200 hover:border-[#7dd3fc]/30">
        <div className="text-2xl font-semibold text-white">{totalStories}+</div>
        <div className="mt-1 text-sm text-[#94a3b8]">Fresh stories</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#02050f]/70 p-4 transition duration-200 hover:border-[#7dd3fc]/30">
        <div className="text-2xl font-semibold text-white">4 sources</div>
        <div className="mt-1 text-sm text-[#94a3b8]">GitHub, arXiv, Dev.to, Hacker News</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#02050f]/70 p-4 transition duration-200 hover:border-[#7dd3fc]/30">
        <div className="text-2xl font-semibold text-white">1-click</div>
        <div className="mt-1 text-sm text-[#94a3b8]">Open and explore in one flow</div>
      </div>
    </div>
  )
}
