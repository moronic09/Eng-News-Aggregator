'use client'

import Link from 'next/link'

const sourceSummaries = [
  {
    label: 'Home',
    href: '/',
    summary: 'Latest engineering stories from across the web.',
  },
  {
    label: 'GitHub',
    href: '/?source=GitHub',
    summary: 'Open-source projects, repos, and developer tools.',
  },
  {
    label: 'Hacker News',
    href: '/?source=Hacker%20News',
    summary: 'Community discussions on startups, products, and software trends.',
  },
  {
    label: 'arXiv',
    href: '/?source=arXiv',
    summary: 'Research papers and emerging technical breakthroughs.',
  },
]

export default function LeftNav(){
  return (
    <div className="flex flex-col items-center gap-6 pt-6">
      <div className="w-12 h-12 rounded-full bg-[#0e1b26] flex items-center justify-center text-[#1d9bf0] font-bold">E</div>
      <nav className="flex w-full flex-col gap-3 mt-2 rounded-2xl border border-white/10 bg-[#040916]/70 p-3">
        {sourceSummaries.map((source) => (
          <Link
            key={source.label}
            href={source.href}
            className="rounded-xl border border-transparent px-3 py-2 transition hover:border-[#7dd3fc]/30 hover:bg-[#0f172a]/70"
          >
            <div className="text-sm font-medium text-white">{source.label}</div>
            <p className="mt-1 text-xs leading-5 text-[#94a3b8]">{source.summary}</p>
          </Link>
        ))}
      </nav>
    </div>
  )
}