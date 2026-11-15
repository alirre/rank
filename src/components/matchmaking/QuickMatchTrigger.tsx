'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import QuickMatchModal from './QuickMatchModal'

interface QuickMatchTriggerProps {
  className?: string
  variant?: 'primary' | 'hero' | 'compact'
  label?: string
}

export default function QuickMatchTrigger({
  className = '',
  variant = 'hero',
  label = 'Hemen Duo Bul',
}: QuickMatchTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer ${className}`}
        >
          <Zap size={14} className="text-[#FBBF24] fill-[#FBBF24]" />
          <span>{label}</span>
        </button>
        <QuickMatchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full sm:w-auto text-sm py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-[#A855F7] via-[#7C3AED] to-[#EC4899] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <Zap size={18} className="text-[#FBBF24] fill-[#FBBF24] animate-pulse" />
        <span>{label}</span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
          15 sn
        </span>
      </button>
      <QuickMatchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
