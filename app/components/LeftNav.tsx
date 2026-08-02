'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const sourceSummaries = [
  {
    label: 'Home',
    href: '/',
    sourceVal: 'Latest',
    summary: 'Latest engineering stories from across the web.',
  },
  {
    label: 'GitHub',
    href: '/?source=GitHub',
    sourceVal: 'GitHub',
    summary: 'Open-source projects, repos, and developer tools.',
  },
  {
    label: 'Hacker News',
    href: '/?source=Hacker%20News',
    sourceVal: 'Hacker News',
    summary: 'Community discussions on startups, products, and software trends.',
  },
  {
    label: 'arXiv',
    href: '/?source=arXiv',
    sourceVal: 'arXiv',
    summary: 'Research papers and emerging technical breakthroughs.',
  },
  {
    label: 'Saved Stories',
    href: '/?source=Saved',
    sourceVal: 'Saved',
    summary: 'Your saved bookmarks for offline reading.',
  },
]

export default function LeftNav() {
  const searchParams = useSearchParams()
  const currentSource = searchParams.get('source') || 'Latest'

  return (
    <div className="flex flex-col items-center gap-6 pt-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7dd3fc]/30 bg-[#0e1b26] text-2xl font-bold text-[#7dd3fc] shadow-[0_0_20px_rgba(125,211,252,0.2)]">
        E
      </div>
      <nav className="mt-2 flex w-full flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#040916]/80 p-3 shadow-lg backdrop-blur-xl">
        {sourceSummaries.map((source) => {
          const isActive = currentSource === source.sourceVal
          return (
            <Link
              key={source.label}
              href={source.href}
              className={`rounded-xl border px-3.5 py-2.5 transition duration-200 ${
                isActive
                  ? 'border-[#7dd3fc]/40 bg-[#7dd3fc]/15 text-white shadow-sm'
                  : 'border-transparent text-[#cbd5e1] hover:border-[#7dd3fc]/20 hover:bg-[#0f172a]/70 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{source.label}</span>
                {source.sourceVal === 'Saved' ? (
                  <span className="text-xs text-amber-400">🔖</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#94a3b8]">{source.summary}</p>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}