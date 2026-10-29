'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  reviewCount?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRate?: (rating: number) => void
  showText?: boolean
  className?: string
}

export default function StarRating({
  rating,
  reviewCount,
  size = 'md',
  interactive = false,
  onRate,
  showText = true,
  className = '',
}: StarRatingProps) {
  const pixelSizes = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
  }

  const px = pixelSizes[size]

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.round(rating)
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate?.(star)}
              className={`transition-transform ${
                interactive ? 'hover:scale-125 cursor-pointer p-0.5' : 'cursor-default pointer-events-none'
              }`}
            >
              <Star
                size={px}
                strokeWidth={2}
                className={isFilled ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-[#343C54] fill-transparent'}
              />
            </button>
          )
        })}
      </div>

      {showText && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-tight tabular-numbers text-[#F5F5FA]">
          {rating > 0 ? rating.toFixed(1) : 'Yeni'}
          {reviewCount !== undefined && (
            <span className="text-[#686E80] font-normal">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  )
}
