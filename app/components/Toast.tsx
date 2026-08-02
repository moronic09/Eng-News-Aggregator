'use client'

interface ToastProps {
  message: string | null
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  if (!message) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#7dd3fc]/40 bg-[#040916]/95 px-5 py-3 text-sm text-white shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7dd3fc]/20 text-xs text-[#7dd3fc]">
        ✓
      </span>
      <span className="font-medium text-white">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-[#94a3b8] transition hover:text-white"
      >
        ✕
      </button>
    </div>
  )
}
