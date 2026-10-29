import MainLayout from '@/components/layout/MainLayout'
import PlayerCard from '@/components/ui/PlayerCard'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { ProfileWithGames } from '@/types/database'
import { VALORANT_RANKS, VALORANT_ROLES, SERVERS, PLAY_STYLES } from '@/lib/constants'
import { Users, Filter, Search, RotateCcw, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

interface PlayersPageProps {
  searchParams: Promise<{
    q?: string
    rank?: string
    role?: string
    server?: string
    mic?: string
    style?: string
    minRating?: string
    sort?: string
  }>
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams
  let players: ProfileWithGames[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      let query = supabase
        .from('profiles')
        .select(`
          *,
          game_profiles(*, game:games(*))
        `)
        .eq('is_suspended', false)

      if (params.q) {
        query = query.ilike('username', `%${params.q}%`)
      }

      if (params.server) {
        query = query.eq('server_region', params.server)
      }

      if (params.mic === 'true') {
        query = query.eq('microphone', true)
      }

      if (params.style) {
        query = query.eq('play_style', params.style)
      }

      if (params.minRating) {
        query = query.gte('avg_rating', parseFloat(params.minRating))
      }

      // Sorting
      if (params.sort === 'reviews') {
        query = query.order('review_count', { ascending: false })
      } else if (params.sort === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else {
        // Default: Önerilen (High rating, then reviews)
        query = query.order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
      }

      const { data: rawPlayers } = await query
      players = (rawPlayers || []) as unknown as ProfileWithGames[]
    } catch (e) {
      console.error('Failed to fetch players:', e)
    }
  }

  // In-memory filter for game profile properties or direct profile properties (Valorant v1)
  if (params.rank) {
    players = players.filter((p) =>
      p.rank?.toLowerCase().includes(params.rank!.toLowerCase()) ||
      p.game_profiles?.some((gp: { rank?: string }) => gp.rank?.toLowerCase().includes(params.rank!.toLowerCase()))
    )
  }

  if (params.role) {
    players = players.filter((p) =>
      p.preferred_roles?.includes(params.role!) ||
      p.game_profiles?.some((gp: { preferred_roles?: string[] }) => gp.preferred_roles?.includes(params.role!))
    )
  }

  // Active filters list for chips
  const activeFilters = [
    params.q && { key: 'q', label: `Arama: "${params.q}"` },
    params.rank && { key: 'rank', label: `Rank: ${params.rank}` },
    params.role && { key: 'role', label: `Rol: ${params.role}` },
    params.server && { key: 'server', label: `Sunucu: ${params.server.toUpperCase()}` },
    params.mic === 'true' && { key: 'mic', label: 'Mikrofon Şart' },
    params.style && { key: 'style', label: `Tarz: ${params.style}` },
  ].filter(Boolean) as { key: string; label: string }[]

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] uppercase tracking-wider mb-1.5 font-mono">
              <Users size={14} />
              <span>OYUNCU HAVUZU</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
              Oyuncu Keşfet
            </h1>
            <p className="text-[#A1A6B5] text-xs sm:text-sm mt-1">
              Seviyene, oynadığın rollere ve tarzına en uygun oyuncularla eşleş.
            </p>
          </div>

          {/* Gerçek Sonuç Sayısı */}
          {players.length > 0 && (
            <div className="text-xs text-[#A1A6B5] bg-[#141722] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-lg tabular-numbers">
              <strong className="text-white font-bold">{players.length}</strong> oyuncu listeleniyor
            </div>
          )}
        </div>

        {/* 2 Sütunlu Layout: Sol Filtre Paneli, Sağ Kart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sol: Filtre Paneli */}
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
                  href="/oyuncular"
                  className="text-[11px] text-[#A1A6B5] hover:text-[#A855F7] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} />
                  Sıfırla
                </Link>
              </div>

              {/* Kullanıcı Adı Arama */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-[#686E80]" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={params.q || ''}
                    placeholder="Kullanıcı ara..."
                    className="input-game pl-8 text-xs py-2"
                  />
                </div>
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
                  Oyun Rolü
                </label>
                <select name="role" defaultValue={params.role || ''} className="input-game text-xs py-2">
                  <option value="">Tüm Roller</option>
                  {VALORANT_ROLES.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Sunucu */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Sunucu / Bölge
                </label>
                <select name="server" defaultValue={params.server || ''} className="input-game text-xs py-2">
                  <option value="">Tümü</option>
                  {SERVERS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
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

              {/* Oyun Tarzı */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Oyun Tarzı
                </label>
                <select name="style" defaultValue={params.style || ''} className="input-game text-xs py-2">
                  <option value="">Tümü</option>
                  {PLAY_STYLES.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              {/* Sıralama */}
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5">
                  Sıralama
                </label>
                <select name="sort" defaultValue={params.sort || ''} className="input-game text-xs py-2">
                  <option value="">Önerilen (Yüksek Puan)</option>
                  <option value="reviews">En Çok Değerlendirilen</option>
                  <option value="newest">Yeni Oyuncular</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5">
                <Filter size={14} />
                Sonuçları Filtrele
              </button>
            </form>
          </aside>

          {/* Sağ: Oyuncu Kartları & Aktif Filtre Etiketleri */}
          <main className="lg:col-span-3 space-y-6">
            {/* Aktif Filtre Çipleri */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pb-1">
                <span className="text-[11px] text-[#686E80] font-medium">Uygulanan Filtreler:</span>
                {activeFilters.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#141722] border border-[rgba(168,85,247,0.3)] text-[#C084FC]"
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            )}

            {players.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            ) : (
              <div className="card-game p-16 text-center border-dashed border-[rgba(255,255,255,0.1)]">
                <Users size={40} className="mx-auto text-[#686E80] mb-3" />
                <h3 className="text-base font-bold text-[#F5F5FA] mb-1 font-heading">
                  Aradığın kriterlerde oyuncu bulamadık
                </h3>
                <p className="text-xs text-[#A1A6B5] max-w-sm mx-auto mb-5 leading-relaxed">
                  Filtreleri değiştirmeyi veya sıfırlamayı deneyerek daha geniş bir arama yapabilirsin.
                </p>
                <Link href="/oyuncular" className="btn-secondary text-xs py-2 px-4 inline-flex">
                  Filtreleri Sıfırla
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </MainLayout>
  )
}
