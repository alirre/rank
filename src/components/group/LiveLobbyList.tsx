'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GroupWithDetails } from '@/types/database'
import GroupCard from '@/components/ui/GroupCard'
import { VALORANT_MODES, VALORANT_RANKS, VALORANT_ROLES } from '@/lib/constants'
import {
  Gamepad2, Radio, Filter, RotateCcw,
  Sparkles, CheckCircle2, AlertCircle, Search
} from 'lucide-react'
import Link from 'next/link'

interface LiveLobbyListProps {
  initialGroups: GroupWithDetails[]
  title?: string
  subtitle?: string
  showFilters?: boolean
  maxDisplay?: number
}

export default function LiveLobbyList({
  initialGroups = [],
  title = 'Canlı Lobiler',
  subtitle = 'Seninle aynı hedefe oynayan oyuncuların açık lobileri.',
  showFilters = true,
  maxDisplay,
}: LiveLobbyListProps) {
  const supabase = createClient()
  const [groups, setGroups] = useState<GroupWithDetails[]>(initialGroups)
  const [realtimeActive, setRealtimeActive] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [rankFilter, setRankFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [onlyOpenSlots, setOnlyOpenSlots] = useState(false)
  const [newGroupBadge, setNewGroupBadge] = useState<string | null>(null)

  // Realtime subscription for group updates
  useEffect(() => {
    const channel = supabase
      .channel('duorank-live-lobbies')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
        },
        async (payload) => {
          // INSERT: Fetch full group details and add to state
          if (payload.eventType === 'INSERT') {
            const newGroupId = payload.new.id
            try {
              const { data: fullGroup } = await supabase
                .from('groups')
                .select(`
                  id, owner_id, game_id, game_mode, title, description,
                  min_rank, max_rank, slots_total, slots_filled, roles_wanted, agents_wanted,
                  mic_required, server_region, play_style, join_type, discord_username,
                  status, created_at, updated_at,
                  owner:profiles(*),
                  game:games(*),
                  members:group_members(*, user:profiles(*))
                `)
                .eq('id', newGroupId)
                .single()

              if (fullGroup && (fullGroup.status === 'active' || fullGroup.status === 'full')) {
                setGroups((prev) => {
                  if (prev.some((g) => g.id === newGroupId)) return prev
                  return [fullGroup as unknown as GroupWithDetails, ...prev]
                })
                setNewGroupBadge(newGroupId)
                setTimeout(() => setNewGroupBadge(null), 4000)
              }
            } catch (e) {
              console.warn('Realtime fetch group failed:', e)
            }
          }

          // UPDATE: Update slot counts or remove if closed
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            if (['cancelled', 'closed'].includes(updated.status)) {
              setGroups((prev) => prev.filter((g) => g.id !== updated.id))
            } else {
              setGroups((prev) =>
                prev.map((g) => {
                  if (g.id === updated.id) {
                    return {
                      ...g,
                      ...updated,
                      slots_filled: updated.slots_filled,
                      status: updated.status,
                    }
                  }
                  return g
                })
              )
            }
          }

          // DELETE
          if (payload.eventType === 'DELETE') {
            setGroups((prev) => prev.filter((g) => g.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeActive(true)
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeActive(false)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Filter application
  const filteredGroups = groups.filter((g) => {
    if (g.status === 'cancelled' || g.status === 'closed') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchesTitle = g.title?.toLowerCase().includes(q)
      const matchesDesc = g.description?.toLowerCase().includes(q)
      const matchesOwner = g.owner?.username?.toLowerCase().includes(q)
      if (!matchesTitle && !matchesDesc && !matchesOwner) return false
    }

    if (modeFilter && g.game_mode !== modeFilter) return false

    if (roleFilter && !g.roles_wanted?.includes(roleFilter)) return false

    if (rankFilter) {
      const matchesRank =
        g.min_rank?.toLowerCase().includes(rankFilter.toLowerCase()) ||
        g.max_rank?.toLowerCase().includes(rankFilter.toLowerCase())
      if (!matchesRank) return false
    }

    if (onlyOpenSlots) {
      if (g.slots_filled >= g.slots_total) return false
    }

    return true
  })

  const displayedGroups = maxDisplay ? filteredGroups.slice(0, maxDisplay) : filteredGroups

  const resetFilters = () => {
    setSearchQuery('')
    setModeFilter('')
    setRankFilter('')
    setRoleFilter('')
    setOnlyOpenSlots(false)
  }

  const isFiltered = !!(searchQuery || modeFilter || rankFilter || roleFilter || onlyOpenSlots)

  return (
    <div className="space-y-6">
      {/* Top Banner: Status & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#141722] border border-[rgba(255,255,255,0.08)] text-[#A855F7] font-mono">
              <span className={`w-2 h-2 rounded-full ${realtimeActive ? 'bg-[#36D399] animate-pulse' : 'bg-[#686E80]'}`} />
              {realtimeActive ? 'CANLI LOBİ AKIŞI' : 'LOBİLER'}
            </span>
            <span className="text-xs text-[#686E80] font-mono tabular-numbers">
              {displayedGroups.length} aktif ilan
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5FA] font-heading">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A6B5] mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Quick filters row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-[#686E80]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Lobi ara..."
                className="input-game pl-8 py-1.5 text-xs w-36 sm:w-44 bg-[#0E1018]"
              />
            </div>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="input-game py-1.5 text-xs bg-[#0E1018] w-auto"
            >
              <option value="">Tüm Modlar</option>
              {VALORANT_MODES.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>

            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="input-game py-1.5 text-xs bg-[#0E1018] w-auto"
            >
              <option value="">Tüm Ranklar</option>
              {VALORANT_RANKS.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-game py-1.5 text-xs bg-[#0E1018] w-auto"
            >
              <option value="">Tüm Roller</option>
              {VALORANT_ROLES.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setOnlyOpenSlots(!onlyOpenSlots)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                onlyOpenSlots
                  ? 'border-[#36D399] bg-[#36D399]/15 text-[#36D399]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] text-[#A1A6B5]'
              }`}
            >
              Boş Yeri Olanlar
            </button>

            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-1.5 rounded-lg text-[#686E80] hover:text-white hover:bg-[#141722] transition-colors"
                title="Filtreleri Sıfırla"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Groups */}
      {displayedGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedGroups.map((group) => {
            const isJustAdded = newGroupBadge === group.id
            return (
              <div
                key={group.id}
                className={`transition-all duration-500 ${
                  isJustAdded ? 'ring-2 ring-[#A855F7] scale-[1.01] rounded-2xl' : ''
                }`}
              >
                <GroupCard group={group} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card-game p-14 text-center border-dashed border-[rgba(255,255,255,0.08)] bg-[#141722]/50">
          <Gamepad2 size={38} className="mx-auto text-[#686E80] mb-3 opacity-60" />
          <h3 className="text-base font-bold text-[#F5F5FA] mb-1 font-heading">
            {isFiltered ? 'Aramanıza Uygun Açık Lobi Bulunamadı' : 'Şu Anda Canlı Lobi Bulunmuyor'}
          </h3>
          <p className="text-xs text-[#A1A6B5] max-w-sm mx-auto mb-5 leading-relaxed">
            {isFiltered
              ? 'Filtreleri sıfırlayarak diğer oyun modlarındaki lobilere göz atabilirsin.'
              : 'Ekibin burada başlıyor. İlk grubunu oluştur ve seviyene uygun oyuncuları takımına davet et.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {isFiltered ? (
              <button
                type="button"
                onClick={resetFilters}
                className="btn-secondary text-xs py-2 px-5"
              >
                Filtreleri Temizle
              </button>
            ) : null}
            <Link href="/grup/olustur" className="btn-primary text-xs py-2 px-5">
              Grup Oluştur
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
