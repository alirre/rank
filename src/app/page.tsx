import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import GroupCard from '@/components/ui/GroupCard'
import PlayerCard from '@/components/ui/PlayerCard'
import HeroVisualMock from '@/components/ui/HeroVisualMock'
import LiveLobbyList from '@/components/group/LiveLobbyList'
import QuickMatchTrigger from '@/components/matchmaking/QuickMatchTrigger'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { GroupWithDetails, ProfileWithGames } from '@/types/database'
import { Users, Gamepad2, Award, Shield, ArrowRight, CheckCircle2, Sparkles, Trophy } from 'lucide-react'

export default async function HomePage() {
  const configured = isSupabaseConfigured()
  const supabase = await createClient()

  let userCount: number | null = 0
  let groupCount: number | null = 0
  let reviewCount: number | null = 0
  let activeGroups: GroupWithDetails[] = []
  let trustedPlayers: ProfileWithGames[] = []

  if (configured) {
    try {
      // 1. Fetch Real Stats with timeout safeguard
      const statsPromise = Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_valid', true),
      ])

      // 2. Fetch Real Active Groups
      const groupsPromise = supabase
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
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)

      // 3. Fetch Real Trusted Players
      const playersPromise = supabase
        .from('profiles')
        .select(`
          *,
          game_profiles(*, game:games(*))
        `)
        .gt('review_count', 0)
        .order('avg_rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(4)

      const [statsRes, groupsRes, playersRes] = await Promise.all([
        statsPromise,
        groupsPromise,
        playersPromise,
      ])

      userCount = statsRes[0].count
      groupCount = statsRes[1].count
      reviewCount = statsRes[2].count
      activeGroups = (groupsRes.data || []) as unknown as GroupWithDetails[]
      trustedPlayers = (playersRes.data || []) as unknown as ProfileWithGames[]
    } catch (e) {
      console.error('Database fetch timeout or error on HomePage:', e)
    }
  }

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-20 sm:pb-28 border-b border-[rgba(255,255,255,0.08)] bg-grid-subtle">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Sol: Hero Metin & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Üst Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141722] border border-[rgba(168,85,247,0.3)] shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]">
                <span className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse" />
                <span className="text-[11px] font-bold tracking-widest text-[#F5F5FA] uppercase font-mono">
                  REKABETÇİ OYUNCULAR İÇİN
                </span>
              </div>

              {/* Ana Başlık */}
              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-[#F5F5FA] leading-[1.08] font-heading">
                Rank'ini tek <br />
                <span className="text-gradient-purple">başına kasma.</span>
              </h1>

              {/* Alt Açıklama */}
              <p className="text-base sm:text-lg text-[#A1A6B5] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Senin seviyende oyuncuları bul, takımını kur ve maçlara hazır gir. İyi takım arkadaşları tesadüf olmasın.
              </p>

              {/* CTA Butonları */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <QuickMatchTrigger />
                <Link
                  href="/oyuncular"
                  className="btn-secondary w-full sm:w-auto text-sm py-3 px-6"
                >
                  <Users size={17} />
                  <span>Oyuncu Ara</span>
                </Link>
                <Link
                  href="/grup/olustur"
                  className="btn-secondary w-full sm:w-auto text-sm py-3 px-6 hidden sm:inline-flex"
                >
                  <Gamepad2 size={17} />
                  <span>Grup Oluştur</span>
                </Link>
              </div>

              {/* Güven ve Süreç Metni */}
              <div className="pt-2 text-xs text-[#686E80] font-medium tracking-wide">
                Profilini oluştur · Ekibini bul · Birlikte yüksel
              </div>
            </div>

            {/* Sağ: Mock Kompozisyonu */}
            <div className="lg:col-span-5 flex justify-center">
              <HeroVisualMock />
            </div>
          </div>

          {/* Gerçek İstatistik Sayaçları (Real Data only) */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto lg:mx-0 mt-16 pt-8 border-t border-[rgba(255,255,255,0.06)] text-center lg:text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F5F5FA] tabular-numbers font-heading">
                {userCount !== null ? userCount : '0'}
              </div>
              <div className="text-xs text-[#686E80] font-medium mt-1">Kayıtlı Oyuncu</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#A855F7] tabular-numbers font-heading">
                {groupCount !== null ? groupCount : '0'}
              </div>
              <div className="text-xs text-[#686E80] font-medium mt-1">Aktif Lobi / Grup</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#36D399] tabular-numbers font-heading">
                {reviewCount !== null ? reviewCount : '0'}
              </div>
              <div className="text-xs text-[#686E80] font-medium mt-1">Yapılan Değerlendirme</div>
            </div>
          </div>
        </div>
      </section>

      {/* AKTİF GRUPLAR BÖLÜMÜ (CANLI REALTIME LOBİ) */}
      <section className="py-20 border-b border-[rgba(255,255,255,0.08)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <LiveLobbyList
            initialGroups={activeGroups}
            title="Ekibini Bul."
            subtitle="Seninle aynı hedefe oynayan oyuncuların anlık açık lobileri."
            maxDisplay={6}
          />
        </div>
      </section>

      {/* NASIL ÇALIŞIR? */}
      <section id="nasil-calisir" className="py-20 border-b border-[rgba(255,255,255,0.08)] bg-[#0E1018]/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5FA] font-heading mb-2">
              Nasıl Çalışır?
            </h2>
            <p className="text-sm text-[#A1A6B5]">
              Rank kaybetmeden, iletişim sorunu yaşamadan doğru takımı bulmak 3 adımda mümkündür.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-game p-7 relative">
              <span className="text-4xl font-black text-[rgba(255,255,255,0.05)] absolute top-4 right-5 select-none font-mono">
                01
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] flex items-center justify-center mb-5">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-[#F5F5FA] mb-2 font-heading">
                1. Profilini Oluştur
              </h3>
              <p className="text-xs text-[#A1A6B5] leading-relaxed">
                Rank'ini, oynadığın ajanları, oyun tarzını ve mikrofon tercihini belirterek oyuncu kimlik kartını hazırla.
              </p>
            </div>

            <div className="card-game p-7 relative">
              <span className="text-4xl font-black text-[rgba(255,255,255,0.05)] absolute top-4 right-5 select-none font-mono">
                02
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#A855F7] flex items-center justify-center mb-5">
                <Gamepad2 size={20} />
              </div>
              <h3 className="text-base font-bold text-[#F5F5FA] mb-2 font-heading">
                2. Ekibe Katıl veya Lobi Aç
              </h3>
              <p className="text-xs text-[#A1A6B5] leading-relaxed">
                İhtiyacın olan rolleri arayan gruplara başvur veya kendi lobi kodunla özel bir ilan oluştur.
              </p>
            </div>

            <div className="card-game p-7 relative">
              <span className="text-4xl font-black text-[rgba(255,255,255,0.05)] absolute top-4 right-5 select-none font-mono">
                03
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#36D399]/15 border border-[#36D399]/30 text-[#36D399] flex items-center justify-center mb-5">
                <Award size={20} />
              </div>
              <h3 className="text-base font-bold text-[#F5F5FA] mb-2 font-heading">
                3. Maç Sonu Değerlendir
              </h3>
              <p className="text-xs text-[#A1A6B5] leading-relaxed">
                Oyun sonrası takım arkadaşlarının iletişimini ve tavrını yıldız sistemiyle puanla, topluluk temiz kalsın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GÜVENİLİR OYUNCULAR */}
      <section className="py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#36D399] uppercase tracking-wider mb-1.5">
                <CheckCircle2 size={14} />
                <span>YÜKSEK GÜVENİLİRLİK</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5FA] font-heading">
                Topluluğun Önerdiği Oyuncular
              </h2>
              <p className="text-[#A1A6B5] text-sm mt-1">
                Yüksek değerlendirme puanına ve temiz oyun geçmişine sahip oyuncular.
              </p>
            </div>
            <Link
              href="/oyuncular"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] hover:text-[#C084FC] transition-colors"
            >
              <span>Tüm oyuncuları keşfet</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {trustedPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustedPlayers.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          ) : (
            <div className="card-game p-12 text-center border-dashed border-[rgba(255,255,255,0.1)]">
              <Users size={36} className="mx-auto text-[#686E80] mb-3" />
              <p className="text-xs text-[#A1A6B5]">
                Henüz değerlendirme almış oyuncu bulunmuyor. İlk maçını tamamlayıp arkadaşlarını puanlayabilirsin.
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  )
}
