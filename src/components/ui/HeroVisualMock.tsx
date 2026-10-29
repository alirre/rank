import React from 'react'
import RankBadge from './RankBadge'
import StarRating from './StarRating'
import { Mic, ShieldCheck, Users, Gamepad2, ArrowRight } from 'lucide-react'

export default function HeroVisualMock() {
  return (
    <div className="relative w-full max-w-[540px] mx-auto select-none pointer-events-none lg:pointer-events-auto">
      {/* Glow backgrounds under composition */}
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#A855F7]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card Composition */}
      <div className="relative z-10 space-y-4">
        {/* Layer 1: Simulated Active Group Lobi Card */}
        <div className="card-game p-5 bg-[#141722]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.12)] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-2xl relative">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center font-bold text-xs text-white shadow-sm">
                VAL
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#A855F7] block">
                  CANLI LOBİ
                </span>
                <span className="text-xs font-semibold text-[#F5F5FA]">
                  Platin / Elmas Tryhard 5-Stack
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#36D399]/15 border border-[#36D399]/30 text-[11px] font-semibold text-[#36D399]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#36D399] animate-pulse" />
              <span>3/5 Oyuncu</span>
            </div>
          </div>

          <p className="text-xs text-[#A1A6B5] leading-relaxed mb-4">
            "İletişimi temiz, tilt olmayan Kontrol Uzmanı ve Gözcü arıyoruz. Win odaklıyız."
          </p>

          {/* Connected Squad Avatars */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1018]/90 border border-[rgba(255,255,255,0.06)] mb-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#141722] bg-[#A855F7] flex items-center justify-center text-[10px] font-bold text-white shadow">
                  A
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#141722] bg-[#7C3AED] flex items-center justify-center text-[10px] font-bold text-white shadow">
                  K
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#141722] bg-[#3B82F6] flex items-center justify-center text-[10px] font-bold text-white shadow">
                  V
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#141722] border-dashed border-[rgba(255,255,255,0.2)] bg-[#191D2A] flex items-center justify-center text-[11px] text-[#A1A6B5]">
                  +2
                </div>
              </div>
              <div className="text-[11px]">
                <span className="text-[#F5F5FA] font-medium block">Ortalama Uyum</span>
                <span className="text-[#36D399] font-semibold">%94 Eşleşme Skoru</span>
              </div>
            </div>

            <span className="btn-primary text-xs py-1.5 px-3.5 shadow-none">
              <span>Takıma Katıl</span>
              <ArrowRight size={12} />
            </span>
          </div>

          {/* Quick Badges in Card */}
          <div className="flex items-center justify-between text-[11px] text-[#A1A6B5]">
            <div className="flex items-center gap-2">
              <RankBadge rank="Platin" size="xs" />
              <span className="text-[#686E80]">→</span>
              <RankBadge rank="Elmas" size="xs" />
            </div>
            <div className="flex items-center gap-1.5 text-[#36D399] font-medium">
              <Mic size={13} />
              <span>Mikrofon Açık</span>
            </div>
          </div>
        </div>

        {/* Layer 2: Floating Player Profile Snippet Overlapping */}
        <div className="sm:-mt-6 sm:ml-8 card-game p-4 bg-[#191D2A]/95 backdrop-blur-xl border border-[rgba(168,85,247,0.3)] shadow-[0_15px_40px_rgba(0,0,0,0.5)] rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center font-bold text-white text-base shadow-inner">
                R
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#36D399] border-2 border-[#191D2A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#F5F5FA]">ReynaGod</span>
                <ShieldCheck size={14} className="text-[#A855F7]" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={4.9} reviewCount={34} size="xs" />
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#686E80] uppercase tracking-wider block font-semibold mb-0.5">
              Rank
            </span>
            <RankBadge rank="Elmas 2" size="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
