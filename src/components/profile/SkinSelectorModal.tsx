'use client'

import { useState } from 'react'
import { POPULAR_VALORANT_SKINS, WEAPON_CATEGORIES, type ValorantSkin } from '@/lib/valorant-skins'
import { X, Check, Search, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

interface SkinSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedSkins: {
    id: string
    name: string
    weapon: string
    icon_url: string
    rarity?: string
  }[]
  onSave: (skins: any[]) => void
}

export default function SkinSelectorModal({
  isOpen,
  onClose,
  selectedSkins,
  onSave,
}: SkinSelectorModalProps) {
  const [currentSkins, setCurrentSkins] = useState<any[]>(selectedSkins || [])
  const [category, setCategory] = useState<string>('Tümü')
  const [query, setQuery] = useState<string>('')

  if (!isOpen) return null

  const handleToggleSkin = (skin: ValorantSkin) => {
    const exists = currentSkins.some((s) => s.id === skin.id)
    if (exists) {
      setCurrentSkins(currentSkins.filter((s) => s.id !== skin.id))
    } else {
      if (currentSkins.length >= 8) {
        return // Max 8 skins
      }
      setCurrentSkins([
        ...currentSkins,
        {
          id: skin.id,
          name: skin.name,
          weapon: skin.weapon,
          icon_url: skin.iconUrl,
          rarity: skin.rarityColor,
        },
      ])
    }
  }

  const handleRemove = (id: string) => {
    setCurrentSkins(currentSkins.filter((s) => s.id !== id))
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= currentSkins.length) return
    const updated = [...currentSkins]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setCurrentSkins(updated)
  }

  const filteredCatalog = POPULAR_VALORANT_SKINS.filter((skin) => {
    const matchesCat = category === 'Tümü' || skin.weapon === category
    const matchesQuery = skin.name.toLowerCase().includes(query.toLowerCase().trim())
    return matchesCat && matchesQuery
  })

  const handleConfirm = () => {
    onSave(currentSkins)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in-fast">
      <div className="bg-[#141722] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F5F5FA] font-heading">
              Favori Silah Desenlerini Seç
            </h2>
            <p className="text-xs text-[#A1A6B5] mt-0.5">
              Profilinde sergilemek istediğin desenleri belirle (En fazla 8 desen).
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#A1A6B5] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selected preview bar */}
        {currentSkins.length > 0 && (
          <div className="p-4 bg-[#0E1018] border-b border-[rgba(255,255,255,0.04)]">
            <span className="text-[11px] font-semibold text-[#A855F7] uppercase tracking-wider block mb-2 font-mono">
              Seçilen Desenler ({currentSkins.length} / 8) — Sıralamak için oklara tıkla
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {currentSkins.map((skin, idx) => (
                <div
                  key={skin.id}
                  className="flex items-center gap-1.5 p-1.5 pr-2 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] flex-shrink-0"
                >
                  <img src={skin.icon_url} alt="" className="w-10 h-6 object-contain" />
                  <span className="text-[11px] text-[#F5F5FA] font-medium max-w-[90px] truncate">
                    {skin.name}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'up')}
                        className="text-[#686E80] hover:text-white p-0.5"
                      >
                        <ArrowUp size={11} />
                      </button>
                    )}
                    {idx < currentSkins.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 'down')}
                        className="text-[#686E80] hover:text-white p-0.5"
                      >
                        <ArrowDown size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(skin.id)}
                      className="text-[#F87171] hover:text-red-400 p-0.5"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Categories */}
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {WEAPON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-[#A855F7] text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-[#0E1018] text-[#A1A6B5] hover:text-white border border-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative flex-1 sm:max-w-[200px]">
              <Search size={13} className="absolute left-2.5 top-2.5 text-[#686E80]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Desen ara..."
                className="input-game pl-7 py-1.5 text-xs w-full bg-[#0E1018]"
              />
            </div>
          </div>
        </div>

        {/* Skins Grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredCatalog.map((skin) => {
            const isSelected = currentSkins.some((s) => s.id === skin.id)
            return (
              <button
                key={skin.id}
                type="button"
                onClick={() => handleToggleSkin(skin)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer text-center relative group ${
                  isSelected
                    ? 'border-[#A855F7] bg-[#A855F7]/15 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#141722]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#A855F7] flex items-center justify-center text-white text-[10px]">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}

                <div className="h-16 w-full flex items-center justify-center mb-2">
                  <img
                    src={skin.iconUrl}
                    alt={skin.name}
                    className="max-h-14 max-w-full object-contain filter drop-shadow group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>

                <div className="w-full">
                  <span className="text-xs font-semibold text-[#F5F5FA] block truncate">
                    {skin.name}
                  </span>
                  <span className="text-[10px] text-[#686E80] block mt-0.5">
                    {skin.weapon}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[#0E1018]">
          <span className="text-xs text-[#686E80]">
            {currentSkins.length} desen seçildi
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary text-xs py-2 px-5"
            >
              Seçimleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
