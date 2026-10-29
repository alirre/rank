'use client'

import { Sparkles } from 'lucide-react'

interface SkinShowcaseProps {
  skins: {
    id: string
    name: string
    weapon: string
    icon_url: string
    rarity?: string
  }[]
  isOwner?: boolean
  onEditClick?: () => void
}

export default function SkinShowcase({
  skins = [],
  isOwner = false,
  onEditClick,
}: SkinShowcaseProps) {
  if (!skins || skins.length === 0) {
    if (!isOwner) return null

    return (
      <div className="card-game p-5 text-center border-dashed border-[rgba(255,255,255,0.08)] bg-[#141722]/50">
        <Sparkles size={24} className="mx-auto text-[#A855F7] mb-2 opacity-80" />
        <h3 className="text-xs font-bold text-[#F5F5FA] mb-1 font-heading">
          Favori Silah Desenlerini Ekle
        </h3>
        <p className="text-[11px] text-[#A1A6B5] max-w-xs mx-auto mb-3">
          Vandal, Phantom veya Bıçak desenlerini profilinde sergileyerek oyuncu kimliğini zenginleştir.
        </p>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="btn-secondary text-xs py-1.5 px-3.5 inline-flex"
          >
            + Desen Seç
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="card-game p-5 space-y-3.5 bg-[#141722]">
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono flex items-center gap-2">
          <Sparkles size={14} className="text-[#FBBF24]" />
          <span>Favori Silah Desenleri</span>
        </h2>
        {isOwner && onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            className="text-[11px] text-[#A855F7] hover:underline font-medium"
          >
            Düzenle
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {skins.map((skin) => (
          <div
            key={skin.id}
            className="p-3 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex flex-col items-center justify-between text-center relative overflow-hidden group hover:border-[#A855F7]/30 transition-all"
          >
            <span className="text-[9px] font-mono text-[#686E80] uppercase tracking-wider block self-start">
              {skin.weapon}
            </span>

            <div className="h-14 w-full flex items-center justify-center my-1">
              <img
                src={skin.icon_url}
                alt={skin.name}
                className="max-h-12 max-w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>

            <span className="text-[11px] font-semibold text-[#F5F5FA] block truncate w-full">
              {skin.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
