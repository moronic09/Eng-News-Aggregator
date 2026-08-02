'use client'

import { useEffect } from 'react'

type Item = {
  id: number
  title: string
  url: string
  date: string
  source: string
  stat?: string
  likes?: number
}

interface AISummaryModalProps {
  item: Item | null
  onClose: () => void
}

export default function AISummaryModal({ item, onClose }: AISummaryModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!item) return null

  const getSourceBadgeColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'github':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      case 'arxiv':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      case 'dev.to':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-[#7dd3fc]/10 text-[#7dd3fc] border-[#7dd3fc]/30'
    }
  }

  const generateTakeaways = (title: string, source: string) => {
    const t = title.toLowerCase()
    if (t.includes('agent') || t.includes('ai') || t.includes('llm') || t.includes('prompt')) {
      return [
        'Explores modern AI agentic workflows and LLM system integrations.',
        'Demonstrates scalable prompt engineering or automated tool execution.',
        'Improves developer productivity through automated reasoning and task dispatch.',
      ]
    }
    if (t.includes('kafka') || t.includes('api') || t.includes('database') || t.includes('query')) {
      return [
        'Focuses on backend latency reduction, stream processing, and data reliability.',
        'Compares architectural trade-offs between REST APIs and event-driven data flows.',
        'Offers concrete indexing and caching strategies for high-throughput systems.',
      ]
    }
    if (t.includes('react') || t.includes('next') || t.includes('ui') || t.includes('tailwind')) {
      return [
        'Presents cutting-edge frontend tooling, modern component patterns, and UX optimization.',
        'Reduces client-side JS bundle overhead while keeping interactive responsiveness high.',
        'Follows modular design principles for maintainable codebase architecture.',
      ]
    }
    return [
      'Delivers practical engineering takeaways for building resilient software systems.',
      'Highlights key architectural decisions, performance tradeoffs, and modern best practices.',
      'Directly applicable for developer teams aiming to standardize toolchains and pipelines.',
    ]
  }

  const takeaways = generateTakeaways(item.title, item.source)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#7dd3fc]/30 bg-[#040916] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.8)] ring-1 ring-white/10 sm:p-8">
        {/* Glow accent decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7dd3fc]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#7dd3fc]/30 bg-[#7dd3fc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#7dd3fc]">
              ⚡ AI Executive Summary
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getSourceBadgeColor(item.source)}`}>
              {item.source}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <h2 className="mt-4 text-xl font-bold leading-snug text-white sm:text-2xl">{item.title}</h2>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#02050f]/80 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#7dd3fc]">Key Technical Insights</h4>
            <ul className="mt-3 space-y-2 text-sm text-[#cbd5e1]">
              {takeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-[#7dd3fc]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[#02050f]/60 p-3">
              <div className="text-xs text-[#94a3b8]">Source</div>
              <div className="mt-0.5 text-sm font-semibold text-white">{item.source}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#02050f]/60 p-3">
              <div className="text-xs text-[#94a3b8]">Impact Metric</div>
              <div className="mt-0.5 text-sm font-semibold text-[#7dd3fc]">{item.stat || 'High Relevance'}</div>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-[#02050f]/60 p-3 sm:col-span-1">
              <div className="text-xs text-[#94a3b8]">Likes</div>
              <div className="mt-0.5 text-sm font-semibold text-pink-400">💖 {item.likes || 0} Likes</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#cbd5e1] transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#7dd3fc]/40 bg-[#7dd3fc] px-6 py-2.5 text-sm font-semibold text-[#02050f] transition hover:bg-[#38bdf8] hover:shadow-[0_0_20px_rgba(125,211,252,0.4)]"
          >
            Explore Article ↗
          </a>
        </div>
      </div>
    </div>
  )
}
