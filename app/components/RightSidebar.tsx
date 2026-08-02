'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Trend = {
  id: string
  label: string
  queryTerm: string
}

type Resource = {
  title: string
  href: string
  description: string
}

const resources: Resource[] = [
  {
    title: 'Next.js guide',
    href: 'https://nextjs.org/docs',
    description: 'Official docs for building modern React apps with Next.js.',
  },
  {
    title: 'Tailwind CSS',
    href: 'https://tailwindcss.com/docs',
    description: 'Utility-first styling for fast UI development.',
  },
  {
    title: 'Prisma docs',
    href: 'https://www.prisma.io/docs',
    description: 'Database toolkit for type-safe queries and migrations.',
  },
]

export default function RightSidebar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trends, setTrends] = useState<Trend[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)
  const source = searchParams.get('source') || 'Latest'
  const currentQuery = searchParams.get('q') || ''

  const handleTrendClick = (queryTerm: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (queryTerm) {
      params.set('q', queryTerm)
    } else {
      params.delete('q')
    }
    router.push(`/?${params.toString()}`)
  }

  useEffect(() => {
    let isMounted = true
    setLoadingTrends(true)

    const fetchTrends = () => {
      const params = new URLSearchParams()
      if (source && source !== 'Latest') params.set('source', source)
      params.set('limit', '8')

      fetch(`/api/items?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (!isMounted) return
          const items = data.items || []

          const extractedTrends: Trend[] = items.slice(0, 4).map((item: any, index: number) => {
            const rawTitle = item.title || item.source || 'Trending'
            const cleanLabel = rawTitle.length > 36 ? `${rawTitle.slice(0, 33)}...` : rawTitle
            return {
              id: String(item.id || index),
              label: cleanLabel,
              queryTerm: rawTitle,
            }
          })

          setTrends(extractedTrends)
          setLoadingTrends(false)
        })
        .catch(() => {
          if (!isMounted) return
          setTrends([])
          setLoadingTrends(false)
        })
    }

    fetchTrends()
    const interval = setInterval(fetchTrends, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [source])

  return (
    <div className="space-y-4 p-4">
      {/* Curated Resources (Search & React, Node removed as requested) */}
      <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#7dd3fc]">Curated resources</h3>
        <div className="space-y-3">
          {resources.map((resource) => (
            <a
              key={resource.title}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-white/10 bg-[#02050f]/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#7dd3fc]/30 hover:bg-[#0f172a]/90"
            >
              <div className="font-semibold text-white">{resource.title}</div>
              <p className="mt-2 text-sm text-[#94a3b8]">{resource.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Trending Links (Updates dynamically according to updates) */}
      <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#7dd3fc]">Trending links</h3>
        <ul className="space-y-2 text-sm text-[#94a3b8]">
          {loadingTrends ? (
            <li className="rounded-2xl border border-white/10 bg-[#02050f]/60 px-4 py-3 text-sm">Loading trends…</li>
          ) : trends.length === 0 ? (
            <li className="rounded-2xl border border-white/10 bg-[#02050f]/60 px-4 py-3 text-sm">No trends right now.</li>
          ) : (
            trends.map((trend) => {
              const isActive = currentQuery.toLowerCase() === trend.queryTerm.toLowerCase()
              return (
                <li key={trend.id}>
                  <button
                    onClick={() => handleTrendClick(trend.queryTerm)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition duration-200 break-words ${
                      isActive
                        ? 'border-[#7dd3fc] bg-[#7dd3fc]/15 text-[#7dd3fc] font-medium'
                        : 'border-white/10 bg-[#02050f]/60 text-[#cbd5e1] hover:border-[#7dd3fc]/40 hover:bg-[#0f172a]/80 hover:text-white'
                    }`}
                  >
                    #{trend.label}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
