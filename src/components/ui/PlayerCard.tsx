import Link from 'next/link'
import { Mic, MicOff, Globe, Send, User, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react'
import type { Profile } from '@/types/database'
import StarRating from './StarRating'
import RankBadge from './RankBadge'

interface PlayerCardProps {
  player: Profile
  onInvite?: (playerId: string) => void
  className?: string
}

export default function PlayerCard({ player, onInvite, className = '' }: PlayerCardProps) {
  const rank = player.rank || 'Demir 1'

  return (
    <div className={`card-game flex flex-col justify-between p-5 relative overflow-hidden group ${className}`}>
      <div>
        {/* Top Header: Avatar, Username, Online */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-inner border border-[rgba(255,255,255,0.1)]">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                ) : (
                  (player.username?.[0] || '?').toUpperCase()
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#36D399] border-2 border-[#141722]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-[#F5F5FA] group-hover:text-white transition-colors">
                  {player.username}
                </span>
                {player.riot_verified && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-[#36D399]/15 text-[#36D399] px-1.5 py-0.5 rounded border border-[#36D399]/30"
                    title="Riot Games Tarafından Doğrulandı"
                  >
                    <CheckCircle2 size={10} />
                    <span>Doğrulandı</span>
                  </span>
                )}
                {player.is_admin && (
                  <span title="Platform Yöneticisi">
                    <ShieldCheck size={14} className="text-[#A855F7]" />
                  </span>
                )}
              </div>
              {player.riot_id ? (
                <p className="text-[11px] text-[#A1A6B5] font-mono mt-0.5">
                  {player.riot_id}
                  {player.riot_tag && <span className="text-[#686E80]">#{player.riot_tag}</span>}
                </p>
              ) : (
                <span className="text-[10px] text-[#686E80]">Riot ID girilmedi</span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="text-right">
            {player.review_count > 0 ? (
              <StarRating rating={player.avg_rating} reviewCount={player.review_count} size="xs" />
            ) : (
              <span className="text-[10px] font-medium text-[#686E80] bg-[#0E1018] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.04)]">
                Yeni Oyuncu
              </span>
            )}
          </div>
        </div>

        {/* Rank & Valorant Tag */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <RankBadge rank={rank} size="xs" />
          {player.riot_verified && (
            <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded border border-[#38BDF8]/20">
              {player.riot_current_rr ?? 50} RR
            </span>
          )}
          {player.riot_stats?.kd && (
            <span className="text-[10px] text-[#36D399] bg-[#36D399]/10 px-1.5 py-0.5 rounded border border-[#36D399]/20 font-mono">
              {player.riot_stats.kd} KD
            </span>
          )}
          <span className="text-[11px] text-[#686E80] font-medium">• Valorant</span>
        </div>

        {/* Ajan Tercihleri */}
        {(player.primary_agent || player.secondary_agent) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {player.primary_agent && (
              <span className="badge-role bg-[#A855F7]/15 text-[#C084FC]">
                ★ {player.primary_agent}
              </span>
            )}
            {player.secondary_agent && (
              <span className="badge-role bg-[#0E1018] text-[#A1A6B5]">
                {player.secondary_agent}
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {player.bio ? (
          <p className="text-xs text-[#A1A6B5] line-clamp-2 leading-relaxed mb-4">
            {player.bio}
          </p>
        ) : (
          <p className="text-xs text-[#686E80] italic mb-4">Oyuncu henüz bir biyografi eklemedi.</p>
        )}
      </div>

      {/* Attributes & Actions */}
      <div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A1A6B5] bg-[#0E1018]/80 p-2.5 rounded-lg border border-[rgba(255,255,255,0.04)] mb-4">
          <div className="flex items-center gap-1.5">
            {player.microphone ? (
              <>
                <Mic size={13} className="text-[#36D399]" />
                <span className="text-[#F5F5FA]">Mikrofon Var</span>
              </>
            ) : (
              <>
                <MicOff size={13} className="text-[#686E80]" />
                <span className="text-[#686E80]">Mikrofon Yok</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Globe size={13} className="text-[#686E80]" />
            <span>{player.server_region?.toUpperCase() || 'TR'} Sunucusu</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-[rgba(255,255,255,0.04)]">
            <span className="text-[#686E80]">Tarz:</span>
            <span className="text-[#F5F5FA] font-medium">
              {player.play_style === 'serious' ? '🎯 Ciddi Rank Kasma' :
               player.play_style === 'tactical' ? '🧠 Taktik Odaklı' :
               player.play_style === 'balanced' ? '⚖️ Dengeli' : '😎 Rahat'}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/profil/${player.id}`}
            className="btn-secondary flex-1 text-xs py-2 justify-center"
          >
            <User size={13} />
            <span>Profili Gör</span>
          </Link>
          <Link
            href={`/mesajlar?userId=${player.id}`}
            className="btn-secondary text-xs py-2 px-3 justify-center hover:border-[#A855F7]/40"
            title="Özel Mesaj Gönder"
          >
            <MessageSquare size={13} className="text-[#A855F7]" />
          </Link>
          {onInvite && (
            <button
              onClick={() => onInvite(player.id)}
              className="btn-primary text-xs py-2 px-3"
              title="Gruba Davet Et"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
