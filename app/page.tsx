import { Suspense } from 'react'
import Feed from './components/Feed'
import HeaderStats from './components/HeaderStats'
import LeftNav from './components/LeftNav'
import RightSidebar from './components/RightSidebar'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#02050f] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 rounded-[28px] border border-white/10 bg-[#040916]/80 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-2xl font-bold text-[#0f172a]">E</div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#7dd3fc]">EngUpdates</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Engineering resources and news, simplified.</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Live feed', 'Curated resources', 'AI + systems', 'Research'].map((tag) => (
                <span key={tag} className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-3 py-1 text-sm text-[#7dd3fc]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#cbd5e1]">
            Explore the latest projects, curated links, and trending engineering updates. The feed keeps a crisp layout while staying easy to scan on desktop and mobile.
          </p>

          <HeaderStats initialCount={71} />
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-2"><LeftNav /></div>
          <div className="col-span-12 lg:col-span-7">
            <Suspense fallback={<div className="rounded-md border border-white/10 bg-[#07182a] p-6 text-sm text-[#94a3b8]">Loading feed…</div>}>
              <Feed />
            </Suspense>
          </div>
          <div className="col-span-12 lg:col-span-3">
            <Suspense fallback={<div className="rounded-md border border-white/10 bg-[#07182a] p-6 text-sm text-[#94a3b8]">Loading sidebar…</div>}>
              <RightSidebar />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
