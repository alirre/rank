'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { Mic, MicOff, Globe, ArrowRight, Lock, ShieldCheck, Flame } from 'lucide-react'
import type { GroupWithDetails } from '@/types/database'
import StarRating from './StarRating'
import RankBadge from './RankBadge'

interface GroupCardProps {
  group: GroupWithDetails
  className?: string
}

export default function GroupCard({ group, className = '' }: GroupCardProps) {
  const slotsLeft = group.slots_total - group.slots_filled
  const fillPercentage = Math.min(100, Math.round((group.slots_filled / group.slots_total) * 100))
  const isFull = slotsLeft <= 0 || group.status === 'full'

  const ownerRating = group.owner?.avg_rating || 0
  const ownerReviewCount = group.owner?.review_count || 0

  return (
    <div className={`card-game flex flex-col justify-between p-5 relative overflow-hidden group ${className}`}>
      {/* Top row: Game icon & mode badge & status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-sm font-bold text-[#A855F7]">
              VAL
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A855F7] block">
                {group.game?.name || 'Valorant'}
              </span>
              <span className="text-[11px] text-[#A1A6B5] font-medium">
                {group.game_mode || 'Rekabetçi'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {group.join_type === 'application' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#191D2A] text-[#A1A6B5] border border-[rgba(255,255,255,0.08)]">
                <Lock size={10} className="text-[#A855F7]" />
                Onaylı
              </span>
            )}
            <span
              className={`w-2 h-2 rounded-full ${
                isFull ? 'bg-[#F87171]' : 'bg-[#36D399] shadow-[0_0_8px_#36D399]'
              }`}
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#F5F5FA] group-hover:text-white transition-colors line-clamp-1 mb-2 font-heading">
          {group.title}
        </h3>

        {/* Description or Auto-formatted features */}
        {group.description ? (
          <p className="text-xs text-[#A1A6B5] line-clamp-2 leading-relaxed mb-4">
            {group.description}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px] text-[#A1A6B5]">
            <span className="px-2 py-0.5 rounded-md bg-[#0E1018] border border-[rgba(255,255,255,0.06)] text-[#F5F5FA]">
              {group.game_mode || 'Rekabetçi'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#0E1018] border border-[rgba(255,255,255,0.06)] text-[#36D399]">
              {group.mic_required ? '🎙️ Mik. Açık' : 'Mikrofon Serbest'}
            </span>
            {group.agents_wanted && group.agents_wanted.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#C084FC]">
                {group.agents_wanted.slice(0, 2).join(', ')}{group.agents_wanted.length > 2 ? ` +${group.agents_wanted.length - 2}` : ''}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-[#0E1018] border border-[rgba(255,255,255,0.06)] text-[#A1A6B5]">
              {group.play_style === 'serious' ? '🎯 Tryhard' : group.play_style === 'casual' ? '😎 Chill' : '🎉 Eğlence'}
            </span>
          </div>
        )}

        {/* Rank Range Badge */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {group.min_rank && (
            <div className="flex items-center gap-1.5 text-xs text-[#686E80]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Hedef:</span>
              <RankBadge rank={group.min_rank} size="xs" />
              {group.max_rank && group.max_rank !== group.min_rank && (
                <>
                  <span className="text-[#686E80]">-</span>
                  <RankBadge rank={group.max_rank} size="xs" />
                </>
              )}
            </div>
          )}
        </div>

        {/* Roles Wanted */}
        {group.roles_wanted && group.roles_wanted.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {group.roles_wanted.map((role) => (
              <span key={role} className="badge-role">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Block */}
      <div>
        {/* Doluluk Barı (Progress) */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
            <span className="text-[#A1A6B5]">Kadro Durumu</span>
            <span className="tabular-numbers text-[#F5F5FA] font-semibold">
              {group.slots_filled} / {group.slots_total}{' '}
              <span className="text-[#686E80] font-normal">
                ({slotsLeft > 0 ? `${slotsLeft} boş` : 'Dolu'})
              </span>
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#0E1018] overflow-hidden border border-[rgba(255,255,255,0.04)]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFull
                  ? 'bg-[#F87171]'
                  : fillPercentage > 70
                  ? 'bg-[#FBBF24]'
                  : 'bg-gradient-to-r from-[#A855F7] to-[#7C3AED]'
              }`}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* Meta badges: Mic, Region, Style */}
        <div className="flex items-center gap-3 text-[11px] text-[#A1A6B5] mb-4 pb-3.5 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-1">
            {group.mic_required ? (
              <span className="inline-flex items-center gap-1 text-[#36D399]">
                <Mic size={13} />
                <span>Mikrofon Şart</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#686E80]">
                <MicOff size={13} />
                <span>Mikrofon İsteğe Bağlı</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[#A1A6B5]">
            <Globe size={13} className="text-[#686E80]" />
            <span>{group.server_region?.toUpperCase() || 'TR'}</span>
          </div>
        </div>

        {/* Footer: Owner Profile & Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
              {group.owner?.avatar_url ? (
                <img src={group.owner.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (group.owner?.username?.[0] || '?').toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-semibold text-[#F5F5FA] truncate block leading-none">
                  {group.owner?.username}
                </span>
                {group.owner?.riot_verified && (
                  <span title="Riot Games Onaylı Lider" className="text-[#36D399] shrink-0">
                    <ShieldCheck size={11} />
                  </span>
                )}
              </div>
              {ownerReviewCount > 0 ? (
                <StarRating rating={ownerRating} reviewCount={ownerReviewCount} size="xs" />
              ) : (
                <span className="text-[10px] text-[#686E80]">Yeni Üye</span>
              )}
            </div>
          </div>

          <Link
            href={`/grup/${group.id}`}
            className="btn-secondary text-xs py-1.5 px-3 group-hover:border-[#A855F7]/40 group-hover:bg-[#191D2A] transition-all flex items-center gap-1 flex-shrink-0"
          >
            <span>Grubu Gör</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
