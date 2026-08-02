'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AISummaryModal from './AISummaryModal'
import Toast from './Toast'

type Item = {
  id: number
  title: string
  url: string
  date: string
  source: string
  stat?: string
  likes?: number
  item_key?: string
}

type LikeStatus = boolean

const formatHumanDate = (iso: string) => {
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso

  const now = new Date()
  const diff = now.getTime() - dt.getTime()
  if (diff < 60 * 1000) return 'just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const formatStat = (stat?: string) => {
  if (!stat) return stat

  const match = stat.match(/^(\d+[\d,]*)\s*(.*)$/)
  if (!match) return stat

  const rawNumber = match[1].replace(/,/g, '')
  const suffix = match[2] ? ` ${match[2]}` : ''
  const num = Number(rawNumber)
  if (Number.isNaN(num)) return stat

  if (num < 1000) return `${num}${suffix}`
  const formatted = num >= 1000000 ? `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M` : `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${formatted}${suffix}`
}

const buildSummary = (item: Item) => {
  const title = item.title.toLowerCase()
  const source = item.source.toLowerCase()

  if (source.includes('github')) {
    if (/(security|auth|crypto|identity|safety)/.test(title)) {
      return 'A developer-facing project that highlights security, reliable access control, and safer software design.'
    }
    if (/(agent|ai|llm|vision|model|ml)/.test(title)) {
      return 'An AI-driven project focused on models, agents, or intelligent developer workflows.'
    }
    if (/(frontend|ui|react|next|tailwind|design)/.test(title)) {
      return 'A frontend engineering update centered on modern interfaces, component systems, and better UX.'
    }
    if (/(infra|kubernetes|docker|cloud|devops|platform)/.test(title)) {
      return 'A platform engineering project about deployment, infrastructure, and operational reliability.'
    }
    if (/(database|sql|redis|data|analytics)/.test(title)) {
      return 'A data or backend engineering project focused on storage, performance, and scalable systems.'
    }
    return 'An open-source project that can help engineers build faster, smarter, and more maintainable software.'
  }

  if (source.includes('arxiv')) {
    return 'A research-oriented article exploring new ideas, experiments, and technical directions in computing.'
  }

  if (source.includes('dev.to') || source.includes('devto')) {
    if (/(api|rest|kafka|event|microservice)/.test(title)) {
      return 'A practical article on API design, event-driven systems, and the tradeoffs behind modern architecture.'
    }
    if (/(ai|llm|model|agent)/.test(title)) {
      return 'A hands-on developer write-up about AI systems, prompt workflows, or new implementation patterns.'
    }
    if (/(frontend|react|next|tailwind|ui)/.test(title)) {
      return 'A developer article focused on frontend tooling, interactive UX, and production-ready patterns.'
    }
    return 'A concise engineering write-up that turns a technical topic into practical guidance for developers.'
  }

  if (source.includes('hacker news') || source.includes('hackernews')) {
    return 'A community discussion that explores product choices, engineering tradeoffs, and emerging technology trends.'
  }

  return 'A concise engineering update that explains the relevance of this topic for modern teams.'
}

const formatLastUpdatedDate = (iso: string) => {
  if (!iso) return 'loading…'
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return iso
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const topicPills = [
  { label: '#AI & Agents', query: 'ai' },
  { label: '#Frontend', query: 'ui' },
  { label: '#DevOps & Cloud', query: 'docker' },
  { label: '#Security', query: 'security' },
  { label: '#Databases', query: 'data' },
]

export default function Feed() {
  const [items, setItems] = useState<Item[]>([])
  const [likedStatus, setLikedStatus] = useState<Record<string, LikeStatus>>({})
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [searchValue, setSearchValue] = useState('')
  const [sortOption, setSortOption] = useState<'latest' | 'liked' | 'hot'>('latest')
  const [selectedSummaryItem, setSelectedSummaryItem] = useState<Item | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const source = searchParams.get('source') || 'Latest'
  const q = searchParams.get('q') || ''

  const filters = [
    { label: 'Latest', value: 'Latest' },
    { label: 'GitHub', value: 'GitHub' },
    { label: 'arXiv', value: 'arXiv' },
    { label: 'Dev.to', value: 'Dev.to' },
    { label: 'Hacker News', value: 'Hacker News' },
    { label: 'Saved', value: 'Saved' },
  ]

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const applySourceFilter = (nextSource: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextSource === 'Latest') params.delete('source')
    else params.set('source', nextSource)
    const queryStr = params.toString()
    router.replace(queryStr ? `/?${queryStr}` : '/')
  }

  const onSearchSubmit = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('q', value)
    else params.delete('q')
    const queryStr = params.toString()
    router.replace(queryStr ? `/?${queryStr}` : '/')
  }

  useEffect(() => {
    setSearchValue(q)
  }, [q])

  useEffect(() => {
    // Load liked status
    const storedLikes = localStorage.getItem('likedStatus')
    if (storedLikes) {
      try {
        setLikedStatus(JSON.parse(storedLikes))
      } catch {
        setLikedStatus({})
      }
    }
    // Load saved bookmarks
    const storedSaved = localStorage.getItem('savedStatus')
    if (storedSaved) {
      try {
        setSavedKeys(JSON.parse(storedSaved))
      } catch {
        setSavedKeys({})
      }
    }
  }, [])

  const fetchItemsData = async (showRefreshSpin = false) => {
    if (showRefreshSpin) setIsRefreshing(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (source && source !== 'Latest' && source !== 'Saved') params.set('source', source)
      if (q) params.set('q', q)
      if (sortOption !== 'latest') params.set('sort', sortOption)

      const url = `/api/items${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      let fetchedItems: Item[] = data.items || []

      // If user selected "Saved" source filter, filter by savedKeys locally
      if (source === 'Saved') {
        const storedSaved = localStorage.getItem('savedStatus')
        const currentSaved: Record<string, boolean> = storedSaved ? JSON.parse(storedSaved) : savedKeys
        fetchedItems = fetchedItems.filter((it) => currentSaved[it.item_key || String(it.id)])
      }

      setItems(fetchedItems)
      setLastUpdated(data.lastUpdated || new Date().toISOString())
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storiesUpdated'))
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchItemsData()
  }, [source, q, sortOption])

  const toggleBookmark = (item: Item) => {
    const key = item.item_key || String(item.id)
    setSavedKeys((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('savedStatus', JSON.stringify(next))
      if (next[key]) showToast('Article saved to your bookmarks! 🔖')
      else showToast('Removed from bookmarks')
      return next
    })
  }

  const handleShare = (item: Item) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.url)
      showToast('Article URL copied to clipboard! 📋')
    } else {
      showToast('URL: ' + item.url)
    }
  }

  const updateLikeStatus = (itemKey: string, liked: LikeStatus) => {
    setLikedStatus((prev) => {
      const next = { ...prev, [itemKey]: liked }
      localStorage.setItem('likedStatus', JSON.stringify(next))
      return next
    })
  }

  const handleLike = async (item: Item) => {
    const itemKey = item.item_key || String(item.id)
    const liked = Boolean(likedStatus[itemKey])
    const delta = liked ? -1 : 1

    const response = await fetch('/api/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_key: itemKey, delta }),
    })
    const data = await response.json()

    if (data?.success) {
      setItems((prev) => prev.map((current) => (current.id === item.id ? { ...current, likes: data.likes } : current)))
      updateLikeStatus(itemKey, !liked)
    }
  }

  const featuredItem = useMemo(() => items[0], [items])
  const feedItems = useMemo(() => items.slice(1), [items])

  return (
    <div className="space-y-4">
      {/* Feed Header Box */}
      <div className="rounded-[28px] border border-white/10 bg-[#040916]/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.35)] ring-1 ring-white/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#7dd3fc]">
              <span className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-3 py-1 font-medium">Feed</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium">{source}</span>
              {q ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium">Search: {q}</span> : null}
            </div>
            <div className="text-sm leading-relaxed text-[#cbd5e1]">
              Browse the latest engineering stories with search and filters. Refresh to fetch live updates.
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Sync Status + Manual Refresh */}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#02050f]/70 px-3.5 py-2 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div className="text-center sm:text-left">
                <div className="text-[11px] font-medium text-[#cbd5e1] leading-tight flex items-center gap-1">
                  <span>Last updated:</span>
                  <button
                    onClick={() => fetchItemsData(true)}
                    title="Refresh Feed"
                    className={`text-[#7dd3fc] hover:text-white transition ${isRefreshing ? 'animate-spin' : ''}`}
                  >
                    ↻
                  </button>
                </div>
                <div className="mt-0.5 text-xs text-[#94a3b8] font-normal leading-tight whitespace-nowrap">
                  {formatLastUpdatedDate(lastUpdated)}
                </div>
              </div>
            </div>

            {/* Story count badge */}
            <div className="rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-4 py-2 text-center shadow-sm">
              <div className="text-sm font-semibold text-[#7dd3fc] leading-tight">{items.length}</div>
              <div className="mt-0.5 text-xs text-[#7dd3fc]/80 leading-tight">stories</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSearchSubmit(searchValue)
            }}
            placeholder="Search titles, sources, or topics..."
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#02050f] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6b7280] focus:border-[#7dd3fc] focus:ring-2 focus:ring-[#7dd3fc]/20"
          />
          <button
            onClick={() => onSearchSubmit(searchValue)}
            className="rounded-2xl border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-5 py-3 text-sm font-medium text-[#7dd3fc] transition hover:bg-[#7dd3fc]/20"
          >
            Search
          </button>
        </div>

        {/* Topic Pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {topicPills.map((pill) => (
            <button
              key={pill.label}
              onClick={() => onSearchSubmit(pill.query)}
              className="rounded-full border border-white/10 bg-[#02050f]/60 px-3 py-1 text-xs text-[#94a3b8] transition hover:border-[#7dd3fc]/40 hover:bg-[#0f172a] hover:text-[#7dd3fc]"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Source Filters & Sorting Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const isActive = source === filter.value
              return (
                <button
                  key={filter.value}
                  onClick={() => applySourceFilter(filter.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#7dd3fc] text-[#02050f] shadow-[0_0_15px_rgba(125,211,252,0.4)]'
                      : 'border border-white/10 bg-[#02050f]/70 text-[#94a3b8] hover:border-[#7dd3fc]/40 hover:text-white'
                  }`}
                >
                  {filter.label} {filter.value === 'Saved' ? '🔖' : ''}
                </button>
              )
            })}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#02050f]/80 p-1 text-xs">
            <button
              onClick={() => setSortOption('latest')}
              className={`rounded-full px-3 py-1 transition ${sortOption === 'latest' ? 'bg-[#7dd3fc]/20 text-[#7dd3fc] font-semibold' : 'text-[#94a3b8] hover:text-white'}`}
            >
              ✨ Latest
            </button>
            <button
              onClick={() => setSortOption('liked')}
              className={`rounded-full px-3 py-1 transition ${sortOption === 'liked' ? 'bg-[#7dd3fc]/20 text-[#7dd3fc] font-semibold' : 'text-[#94a3b8] hover:text-white'}`}
            >
              🔥 Hot / Liked
            </button>
          </div>
        </div>
      </div>

      {/* Featured / Top Story Card */}
      {featuredItem && !loading && (
        <div className="relative overflow-hidden rounded-[28px] border border-[#7dd3fc]/30 bg-gradient-to-r from-[#071829] via-[#040916] to-[#0a192f] p-6 shadow-[0_30px_90px_rgba(17,24,39,0.5)] transition duration-300 hover:-translate-y-1 hover:border-[#7dd3fc]/60">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#7dd3fc]/10 blur-2xl" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  🏆 Top Story
                </span>
                <span className="text-xs text-[#94a3b8]">• {formatHumanDate(featuredItem.date)}</span>
              </div>
              <a
                href={featuredItem.url}
                target="_blank"
                rel="noreferrer"
                className="block text-2xl font-bold text-white transition hover:text-[#7dd3fc]"
              >
                {featuredItem.title}
              </a>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
                <span className="rounded-md bg-white/5 px-2 py-1 text-[#7dd3fc]">{featuredItem.source}</span>
                <span>·</span>
                <span>{formatStat(featuredItem.stat) || 'News'}</span>
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-[#cbd5e1]">{buildSummary(featuredItem)}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              <a
                href={featuredItem.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#7dd3fc]/40 bg-[#7dd3fc] px-5 py-2 text-xs font-semibold text-[#02050f] transition hover:bg-[#38bdf8]"
              >
                Open ↗
              </a>
              <button
                onClick={() => setSelectedSummaryItem(featuredItem)}
                className="rounded-full border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-4 py-2 text-xs text-[#7dd3fc] transition hover:bg-[#7dd3fc]/20"
              >
                ⚡ AI Summary
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleBookmark(featuredItem)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    savedKeys[featuredItem.item_key || String(featuredItem.id)]
                      ? 'border-amber-400/50 bg-amber-400/20 text-amber-300'
                      : 'border-white/10 text-[#94a3b8] hover:text-white'
                  }`}
                  title="Bookmark"
                >
                  {savedKeys[featuredItem.item_key || String(featuredItem.id)] ? '🔖 Saved' : '🔖 Save'}
                </button>
                <button
                  onClick={() => handleLike(featuredItem)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    likedStatus[featuredItem.item_key || String(featuredItem.id)]
                      ? 'border-pink-500/50 bg-pink-500/20 text-pink-300'
                      : 'border-white/10 text-[#94a3b8] hover:text-white'
                  }`}
                >
                  💖 {featuredItem.likes || 0}
                </button>
                <button
                  onClick={() => handleShare(featuredItem)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-[#94a3b8] transition hover:text-white"
                  title="Share"
                >
                  🔗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer Skeleton Loaders */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-3xl border border-white/10 bg-[#040916]/80 p-5 shadow-lg"
            >
              <div className="space-y-3">
                <div className="h-4 w-28 rounded-full bg-white/10" />
                <div className="h-6 w-3/4 rounded-full bg-white/10" />
                <div className="h-4 w-full rounded-full bg-white/10" />
                <div className="h-4 w-5/6 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-8 text-center text-sm text-[#94a3b8] shadow-lg">
          <div className="text-base font-semibold text-white">
            {source === 'Saved' ? 'No saved bookmarks yet.' : q ? `No results found for “${q}”.` : 'No posts found.'}
          </div>
          <p className="mt-2 text-xs">
            {source === 'Saved'
              ? 'Click the 🔖 Save button on any article card to add it to your bookmarks.'
              : 'Try adjusting your search query or switching source filters.'}
          </p>
        </div>
      ) : (
        /* Regular Feed Items */
        feedItems.map((it) => {
          const itemKey = it.item_key || String(it.id)
          const isLiked = Boolean(likedStatus[itemKey])
          const isSaved = Boolean(savedKeys[itemKey])

          return (
            <div
              key={it.id}
              className="rounded-3xl border border-white/10 bg-[#040916]/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-1 hover:border-[#7dd3fc]/40 hover:shadow-[0_10px_30px_rgba(125,211,252,0.1)]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7dd3fc]">
                    <span className="rounded-full border border-[#7dd3fc]/20 bg-white/5 px-2.5 py-0.5 font-medium">
                      {it.source}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                      {formatStat(it.stat) || 'news'}
                    </span>
                    <span className="text-[#94a3b8]">• {formatHumanDate(it.date)}</span>
                  </div>
                  <div className="min-w-0">
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-bold text-white transition hover:text-[#7dd3fc]"
                    >
                      {it.title}
                    </a>
                  </div>
                  <div className="text-sm leading-relaxed text-[#cbd5e1]">{buildSummary(it)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#7dd3fc]/30 bg-[#0f172a] px-4 py-1.5 text-xs text-[#7dd3fc] transition hover:bg-[#7dd3fc]/15"
                  >
                    Open ↗
                  </a>
                  <button
                    onClick={() => setSelectedSummaryItem(it)}
                    className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/5 px-3 py-1.5 text-xs text-[#7dd3fc] transition hover:bg-[#7dd3fc]/15"
                  >
                    ⚡ AI Summary
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBookmark(it)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        isSaved ? 'border-amber-400/50 bg-amber-400/20 text-amber-300' : 'border-white/10 text-[#94a3b8] hover:text-white'
                      }`}
                      title="Bookmark"
                    >
                      {isSaved ? '🔖 Saved' : '🔖 Save'}
                    </button>
                    <button
                      onClick={() => handleLike(it)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition ${
                        isLiked ? 'border-pink-500/50 bg-pink-500/20 text-pink-300' : 'border-white/10 text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      💖 {it.likes || 0}
                    </button>
                    <button
                      onClick={() => handleShare(it)}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-[#94a3b8] transition hover:text-white"
                      title="Share"
                    >
                      🔗
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* AI Summary Modal */}
      <AISummaryModal item={selectedSummaryItem} onClose={() => setSelectedSummaryItem(null)} />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  )
}
