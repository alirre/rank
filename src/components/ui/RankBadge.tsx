import React from 'react'

export type RankTier =
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'ascendant'
  | 'immortal'
  | 'radiant'

interface RankBadgeProps {
  rank: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showName?: boolean
  className?: string
}

const rankConfig: Record<
  RankTier,
  { label: string; bg: string; border: string; text: string; glow: string; color: string }
> = {
  iron: {
    label: 'Demir',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.35)',
    text: '#94A3B8',
    glow: 'rgba(100, 116, 139, 0.2)',
    color: '#64748B',
  },
  bronze: {
    label: 'Bronz',
    bg: 'rgba(180, 83, 9, 0.12)',
    border: 'rgba(217, 119, 6, 0.35)',
    text: '#D97706',
    glow: 'rgba(180, 83, 9, 0.2)',
    color: '#B45309',
  },
  silver: {
    label: 'Gümüş',
    bg: 'rgba(203, 213, 225, 0.12)',
    border: 'rgba(226, 232, 240, 0.35)',
    text: '#E2E8F0',
    glow: 'rgba(203, 213, 225, 0.2)',
    color: '#CBD5E1',
  },
  gold: {
    label: 'Altın',
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(250, 204, 21, 0.4)',
    text: '#FACC15',
    glow: 'rgba(234, 179, 8, 0.25)',
    color: '#EAB308',
  },
  platinum: {
    label: 'Platin',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(34, 211, 238, 0.4)',
    text: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.25)',
    color: '#06B6D4',
  },
  diamond: {
    label: 'Elmas',
    bg: 'rgba(129, 140, 248, 0.14)',
    border: 'rgba(165, 180, 252, 0.45)',
    text: '#A5B4FC',
    glow: 'rgba(129, 140, 248, 0.3)',
    color: '#818CF8',
  },
  ascendant: {
    label: 'Yücelik',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(52, 211, 153, 0.45)',
    text: '#34D399',
    glow: 'rgba(16, 185, 129, 0.3)',
    color: '#10B981',
  },
  immortal: {
    label: 'Ölümsüz',
    bg: 'rgba(244, 63, 94, 0.14)',
    border: 'rgba(251, 113, 133, 0.45)',
    text: '#FB7185',
    glow: 'rgba(244, 63, 94, 0.35)',
    color: '#F43F5E',
  },
  radiant: {
    label: 'Radyant',
    bg: 'rgba(250, 204, 21, 0.18)',
    border: 'rgba(253, 224, 71, 0.6)',
    text: '#FEF08A',
    glow: 'rgba(250, 204, 21, 0.45)',
    color: '#FACC15',
  },
}

export function parseRankTier(rawRank: string | null | undefined): RankTier {
  if (!rawRank) return 'silver'
  const lower = rawRank.toLowerCase()
  if (lower.includes('iron') || lower.includes('demir')) return 'iron'
  if (lower.includes('bronze') || lower.includes('bronz')) return 'bronze'
  if (lower.includes('silver') || lower.includes('gümüş') || lower.includes('gumus')) return 'silver'
  if (lower.includes('gold') || lower.includes('altın') || lower.includes('altin')) return 'gold'
  if (lower.includes('plat') || lower.includes('platin')) return 'platinum'
  if (lower.includes('diamond') || lower.includes('elmas')) return 'diamond'
  if (lower.includes('ascendant') || lower.includes('yücelik') || lower.includes('yucelik') || lower.includes('yükselen')) return 'ascendant'
  if (lower.includes('immortal') || lower.includes('ölümsüz') || lower.includes('olumsuz')) return 'immortal'
  if (lower.includes('radiant') || lower.includes('radyant') || lower.includes('parlak')) return 'radiant'
  return 'silver'
}

export default function RankBadge({
  rank,
  size = 'md',
  showName = true,
  className = '',
}: RankBadgeProps) {
  const tier = parseRankTier(rank)
  const config = rankConfig[tier]

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  }

  const px = iconSizes[size]

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md tracking-wide transition-all select-none ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        boxShadow: `0 0 12px -2px ${config.glow}`,
      }}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
        <line x1="12" y1="2" x2="12" y2="22" />
        <polyline points="2 8.5 12 15.5 22 8.5" />
      </svg>
      {showName && <span>{rank || config.label}</span>}
    </span>
  )
}
