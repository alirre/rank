import React from 'react'

interface LogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export default function Logo({ size = 32, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon: Two intersecting angled diamonds/chevrons symbolizing two linked players forming a squad */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1E1735] to-[#121320] border border-[rgba(168,85,247,0.35)] shadow-[0_0_20px_-3px_rgba(168,85,247,0.4)] transition-transform hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.65}
          height={size * 0.65}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* First player chevron (accent purple) */}
          <path
            d="M5 14L10 9L15 14"
            stroke="url(#duoGrad1)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Second player chevron interlinked (bright lavender) */}
          <path
            d="M9 19L14 14L19 19"
            stroke="url(#duoGrad2)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle rank spark at apex */}
          <circle cx="10" cy="5" r="1.5" fill="#C084FC" />
          <defs>
            <linearGradient id="duoGrad1" x1="5" y1="9" x2="15" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C084FC" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="duoGrad2" x1="9" y1="14" x2="19" y2="19" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7" />
              <stop offset="1" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span className="text-xl font-extrabold tracking-tight font-heading text-[#F5F5FA]">
          Duo<span className="text-[#A855F7]">Rank</span>
        </span>
      )}
    </div>
  )
}
