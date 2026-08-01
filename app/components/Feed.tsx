'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
    timeZoneName: 'short',
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

  if (/(security|threat|auth|crypto)/.test(title)) {
    return 'A security-focused topic relevant to modern engineering teams and risk-aware development.'
  }
  if (/(ai|llm|model|vision|agent)/.test(title)) {
    return 'An AI-focused update about new models, tooling, or practical applications.'
  }
  if (/(frontend|react|next|ui|tailwind|design)/.test(title)) {
    return 'A frontend engineering note on user experience, component design, or modern tooling.'
  }
  if (/(infra|cloud|kubernetes|docker|devops)/.test(title)) {
    return 'An infrastructure update about scale, deployment, and operational resilience.'
  }
  if (/(database|api|performance|cache|latency)/.test(title)) {
    return 'A backend or systems topic about performance, APIs, and robust architecture.'
  }

  return 'A concise engineering update that explains the relevance of this topic for modern teams.'
}

export default function Feed(){
  const [items, setItems] = useState<Item[]>([])
  const [likedStatus, setLikedStatus] = useState<Record<string, LikeStatus>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [searchValue, setSearchValue] = useState('')
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
  ]

  const applySourceFilter = (nextSource: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextSource === 'Latest') params.delete('source')
    else params.set('source', nextSource)
    const query = params.toString()
    router.replace(query ? `/?${query}` : '/')
  }

  const onSearchSubmit = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('q', value)
    else params.delete('q')
    const query = params.toString()
    router.replace(query ? `/?${query}` : '/')
  }

  const featuredItem = useMemo(() => items[0], [items])
  const feedItems = useMemo(() => items.slice(1), [items])

  useEffect(() => {
    setSearchValue(q)
  }, [q])

  useEffect(() => {
    const stored = localStorage.getItem('likedStatus')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          const normalized: Record<string, boolean> = {}
          Object.entries(parsed).forEach(([key, value]) => {
            normalized[key] = value === true || value === 'liked' || value === '1' || value === 1
          })
          setLikedStatus(normalized)
        }
      } catch {
        setLikedStatus({})
      }
    }
  }, [])

  useEffect(() => {
    setLoading(true)

    const params = new URLSearchParams()
    if (source && source !== 'Latest') params.set('source', source)
    if (q) params.set('q', q)
    const url = `/api/items${params.toString() ? `?${params.toString()}` : ''}`

    fetch(url)
      .then(r => r.json())
      .then(d => {
        setItems(d.items || [])
        setLastUpdated(d.lastUpdated || '')
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLastUpdated('')
        setLoading(false)
      })
  }, [source, q])

  const updateLikeStatus = (itemKey: string, liked: LikeStatus) => {
    setLikedStatus(prev => {
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
      setItems(prev => prev.map(current => current.id === item.id ? { ...current, likes: data.likes } : current))
      updateLikeStatus(itemKey, !liked)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/10 bg-[#040916]/80 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.35)] ring-1 ring-white/5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#7dd3fc]">
              <span className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-3 py-1">Feed</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{source}</span>
              {q ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Search: {q}</span> : null}
            </div>
            <div className="text-sm text-[#cbd5e1]">Browse the latest engineering stories with search and filters. Refresh after scheduler runs to see the newest updates.</div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-[#02050f]/70 px-4 py-2.5 text-sm text-[#cbd5e1] shadow-sm">
              <span className="font-medium text-white">Last updated:</span>{' '}
              <span className="text-[#94a3b8]">{lastUpdated ? new Date(lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'loading…'}</span>
            </div>
            <div className="rounded-2xl border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-4 py-2.5 text-sm font-medium text-[#7dd3fc]">
              {items.length} stories
            </div>
          </div>
        </div>

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
            className="rounded-2xl border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-4 py-3 text-sm text-[#7dd3fc] transition hover:bg-[#7dd3fc]/15"
          >
            Search
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = source === filter.value
            return (
              <button
                key={filter.value}
                onClick={() => applySourceFilter(filter.value)}
                className={`rounded-full px-3 py-2 text-sm transition ${isActive ? 'bg-[#7dd3fc] text-[#02050f]' : 'border border-white/10 bg-[#02050f]/70 text-[#94a3b8] hover:border-[#7dd3fc]/40 hover:text-white'}`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {featuredItem && !loading && (
        <div className="rounded-[28px] border border-[#7dd3fc]/20 bg-[#071829]/95 p-5 shadow-[0_30px_90px_rgba(17,24,39,0.45)] transition duration-200 hover:-translate-y-0.5">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.35em] text-[#7dd3fc]">Top story</div>
              <a href={featuredItem.url} className="text-2xl font-semibold text-white underline-offset-4 transition hover:text-[#7dd3fc] hover:underline">
                {featuredItem.title}
              </a>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#94a3b8]">
                <span>{featuredItem.source}</span>
                <span>·</span>
                <span>{formatStat(featuredItem.stat) || 'News'}</span>
                <span>·</span>
                <span>{formatHumanDate(featuredItem.date)}</span>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[#cbd5e1]">{buildSummary(featuredItem)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={featuredItem.url} className="rounded-full border border-[#7dd3fc]/30 bg-[#0f172a] px-4 py-2 text-sm text-[#7dd3fc] transition hover:bg-[#7dd3fc]/10">Open</a>
              <button
                onClick={() => handleLike(featuredItem)}
                className="rounded-full border border-white/10 bg-[#02050f]/80 px-4 py-2 text-sm text-[#94a3b8] transition hover:border-[#7dd3fc]/40 hover:text-white"
              >
                {likedStatus[featuredItem.item_key || String(featuredItem.id)] ? '💖 Unlike' : '🤍 Like'} {featuredItem.likes || 0}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-white/10 bg-[#040916]/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.35)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="h-5 w-3/4 rounded-full bg-white/10" />
                  <div className="h-3 w-full rounded-full bg-white/10" />
                  <div className="h-3 w-5/6 rounded-full bg-white/10" />
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="flex gap-2">
                    <div className="h-9 w-20 rounded-full bg-white/10" />
                    <div className="h-9 w-20 rounded-full bg-white/10" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-6 text-sm text-[#94a3b8] shadow-[0_20px_70px_rgba(15,23,42,0.35)]">
          <div className="font-medium text-white">{q ? `No results found for “${q}”.` : 'No posts found for this filter yet.'}</div>
          <p className="mt-2">{q ? 'Try a different search term or switch to another source.' : 'Try a different source or come back after the next refresh.'}</p>
          {q ? (
            <button onClick={() => onSearchSubmit('')} className="mt-4 rounded-full border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-4 py-2 text-sm text-[#7dd3fc] transition hover:bg-[#7dd3fc]/15">
              Clear search
            </button>
          ) : null}
        </div>
      ) : feedItems.map(it => {
        const itemKey = it.item_key || String(it.id)
        const liked = Boolean(likedStatus[itemKey])

        return (
          <div key={it.id} className="rounded-3xl border border-white/10 bg-[#040916]/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-[#7dd3fc]/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#7dd3fc]">
                  <span className="rounded-full border border-[#7dd3fc]/20 bg-white/5 px-3 py-1">{it.source}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{formatStat(it.stat) || 'news'}</span>
                </div>
                <div className="min-w-0">
                  <a href={it.url} className="text-xl font-semibold text-white underline-offset-4 transition hover:text-[#7dd3fc] hover:underline">
                    {it.title}
                  </a>
                </div>
                <div className="text-sm leading-6 text-[#cbd5e1]">{buildSummary(it)}</div>
              </div>
              <div className="flex flex-col items-start gap-3 sm:items-end">
                <span className="text-sm text-[#94a3b8]">{formatHumanDate(it.date)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={it.url} className="rounded-full border border-[#7dd3fc]/30 bg-[#0f172a] px-4 py-2 text-sm text-[#7dd3fc] transition hover:bg-[#7dd3fc]/10">Open</a>
                  <button
                    onClick={() => handleLike(it)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${liked ? 'border-[#7dd3fc]/60 bg-[#7dd3fc]/10 text-white hover:border-[#7dd3fc]' : 'border-white/10 text-[#94a3b8] hover:border-[#7dd3fc]/40 hover:text-white'}`}
                  >
                    {liked ? '💖 Unlike' : '🤍 Like'} {it.likes || 0}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
