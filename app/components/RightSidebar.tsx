'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Trend = {
  id: string
  label: string
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
  {
    title: 'React docs',
    href: 'https://react.dev/',
    description: 'The official React documentation and tutorials.',
  },
]

export default function RightSidebar(){
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [trends, setTrends] = useState<Trend[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)
  const source = searchParams.get('source') || 'Latest'

  const onSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    setQuery(value)
    if (value) params.set('q', value)
    else params.delete('q')
    router.replace(`/?${params.toString()}`)
  }

  useEffect(() => {
    setLoadingTrends(true)

    const params = new URLSearchParams()
    if (source && source !== 'Latest') params.set('source', source)
    if (query) params.set('q', query)
    params.set('limit', '5')

    fetch(`/api/items?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const titles = (data.items || []).slice(0, 4).map((item: any) => {
          const text = item.title || item.source || 'Trending'
          return text.length > 36 ? `${text.slice(0, 33)}...` : text
        })
        setTrends(titles.map((label: string, index: number) => ({ id: String(index), label })))
        setLoadingTrends(false)
      })
      .catch(() => {
        setTrends([])
        setLoadingTrends(false)
      })
  }, [source, query])

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#7dd3fc]">Search</h3>
        <input
          className="w-full rounded-2xl border border-white/10 bg-[#02050f] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6b7280] focus:border-[#7dd3fc] focus:ring-2 focus:ring-[#7dd3fc]/20"
          placeholder="Search posts..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#7dd3fc]">Curated resources</h3>
        <div className="space-y-3">
          {resources.map(resource => (
            <a key={resource.title} href={resource.href} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-[#02050f]/80 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#7dd3fc]/30 hover:bg-[#0f172a]/90">
              <div className="font-semibold text-white">{resource.title}</div>
              <p className="mt-2 text-sm text-[#94a3b8]">{resource.description}</p>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#040916]/80 p-4 shadow-[0_25px_60px_rgba(15,23,42,0.25)]">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#7dd3fc]">Trending links</h3>
        <ul className="space-y-2 text-sm text-[#94a3b8]">
          {loadingTrends ? (
            <li className="rounded-2xl border border-white/10 bg-[#02050f]/60 px-4 py-3">Loading trends…</li>
          ) : trends.length === 0 ? (
            <li className="rounded-2xl border border-white/10 bg-[#02050f]/60 px-4 py-3">No trends right now.</li>
          ) : trends.map(trend => (
            <li key={trend.id} className="rounded-2xl border border-white/10 bg-[#02050f]/60 px-4 py-3 whitespace-normal break-words">#{trend.label}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
