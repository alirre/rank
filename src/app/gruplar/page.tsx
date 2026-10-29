import MainLayout from '@/components/layout/MainLayout'
import GroupCard from '@/components/ui/GroupCard'
import LiveLobbyList from '@/components/group/LiveLobbyList'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { GroupWithDetails } from '@/types/database'
import { GAMES, VALORANT_RANKS, VALORANT_ROLES, SERVERS, VALORANT_MODES } from '@/lib/constants'
import { Gamepad2, Filter, Search, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

interface GroupsPageProps {
  searchParams: Promise<{
    q?: string
    game?: string
    mode?: string
    rank?: string
    role?: string
    server?: string
    mic?: string
    style?: string
    sort?: string
  }>
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
  const params = await searchParams
  let groups: GroupWithDetails[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      let query = supabase
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
        .in('status', ['active', 'full'])

      if (params.game) {
        query = query.eq('game_id', params.game)
      }

      if (params.mode) {
        query = query.eq('game_mode', params.mode)
      }

      if (params.server) {
        query = query.eq('server_region', params.server)
      }

      if (params.mic === 'true') {
        query = query.eq('mic_required', true)
      }

      if (params.style) {
        query = query.eq('play_style', params.style)
      }

      if (params.q) {
        query = query.ilike('title', `%${params.q}%`)
      }

      if (params.sort === 'slots') {
        query = query.order('slots_filled', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data: rawGroups } = await query
      groups = (rawGroups || []) as unknown as GroupWithDetails[]
    } catch (e) {
      console.error('Failed to fetch groups:', e)
    }
  }

  if (params.role) {
    groups = groups.filter((g) => g.roles_wanted?.includes(params.role!))
  }

  if (params.rank) {
    groups = groups.filter((g) => 
      g.min_rank?.toLowerCase().includes(params.rank!.toLowerCase()) || 
      g.max_rank?.toLowerCase().includes(params.rank!.toLowerCase())
    )
  }

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Başlık ve Grup Oluştur Butonu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] uppercase tracking-wider mb-1.5 font-mono">
              <Gamepad2 size={14} />
              <span>LOBİ ARAMA</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
              Bir sonraki maçın için ekibini bul.
            </h1>
            <p className="text-[#A1A6B5] text-xs sm:text-sm mt-1">
              Aktif olarak oyuncu arayan lobilere göz at veya kendi takımını topla.
            </p>
          </div>

          <Link href="/grup/olustur" className="btn-primary text-xs py-2.5 px-5 flex-shrink-0">
            <Plus size={15} />
            <span>Grup Oluştur</span>
          </Link>
        </div>

        {/* 2 Sütunlu Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sol: Filtre Çubuğu */}
          <aside className="lg:col-span-1">
            <form
              method="GET"
              className="card-game p-5 sticky top-24 space-y-5 bg-[#141722]/90 backdrop-blur-md"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] flex items-center gap-2 font-mono">
                  <SlidersHorizontal size={14} className="text-[#A855F7]" />
                  Filtreler
                </span>
                <Link
                  href="/gruplar"
                  className="text-[11px] text-[#A1A6B5] hover:text-[#A855F7] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} />
                  Sıfırla
                </Link>
              </div>

              {/* Lobi Başlığı Ara */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Lobi Başlığı
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[#686E80]" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q || ''}
                    placeholder="Grup başlığı..."
                    className="input-game pl-8 text-xs py-2"
                  />
                </div>
              </div>

              {/* Mod */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Oyun Modu
                </label>
                <select name="mode" defaultValue={params.mode || ''} className="input-game text-xs py-2">
                  <option value="">Tüm Modlar</option>
                  {VALORANT_MODES.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Rank */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Rank Seviyesi
                </label>
                <select name="rank" defaultValue={params.rank || ''} className="input-game text-xs py-2">
                  <option value="">Tüm Ranklar</option>
                  {VALORANT_RANKS.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Rol */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Aranan Rol
                </label>
                <select name="role" defaultValue={params.role || ''} className="input-game text-xs py-2">
                  <option value="">Tümü</option>
                  {VALORANT_ROLES.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Mikrofon */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Mikrofon
                </label>
                <select name="mic" defaultValue={params.mic || ''} className="input-game text-xs py-2">
                  <option value="">Farketmez</option>
                  <option value="true">Mikrofon Şart</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5">
                <Filter size={14} />
                Grupları Filtrele
              </button>
            </form>
          </aside>

          {/* Sağ: Grup Listesi (Canlı Akış) */}
          <main className="lg:col-span-3">
            <LiveLobbyList
              initialGroups={groups}
              showFilters={false}
              title="Açık Takım Lobileri"
              subtitle="Aktif olarak oyuncu arayan canlı lobi ilanları."
            />
          </main>
        </div>
      </div>
    </MainLayout>
  )
}
