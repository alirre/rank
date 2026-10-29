import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'
import StarRating from '@/components/ui/StarRating'
import RankBadge from '@/components/ui/RankBadge'
import ProfileViewClient from '@/components/profile/ProfileViewClient'
import { timeAgo, formatDate } from '@/lib/utils'
import type { ProfileWithGames, Review, ProfileClip } from '@/types/database'
import {
  ShieldCheck, Globe, Mic, MicOff, Clock,
  Calendar, Star, AlertTriangle, Send, UserCheck, MessageSquare, Award
} from 'lucide-react'

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Current Session
  const { data: { session } } = await supabase.auth.getSession()
  const isOwnProfile = session?.user?.id === id

  // 2. Fetch Player Profile
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select(`
      *,
      game_profiles(*, game:games(*))
    `)
    .eq('id', id)
    .single()

  if (profileErr || !profileData) {
    notFound()
  }

  const profile = profileData as unknown as ProfileWithGames
  const primaryGame = profile.game_profiles?.[0]
  const rank = profile.rank || primaryGame?.rank || 'Demir 1'
  const inGameName = (profile.riot_id ? `${profile.riot_id}${profile.riot_tag ? '#' + profile.riot_tag : ''}` : null) ||
    (primaryGame?.in_game_name ? `${primaryGame.in_game_name}${primaryGame.in_game_id ? '#' + primaryGame.in_game_id : ''}` : null)
  const displayRoles = (profile.preferred_roles && profile.preferred_roles.length > 0)
    ? profile.preferred_roles
    : (primaryGame?.preferred_roles || [])

  // 3. Fetch Valid Reviews
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles(*),
      group:groups(*)
    `)
    .eq('reviewee_id', id)
    .eq('is_valid', true)
    .order('created_at', { ascending: false })

  const reviews = (reviewsData || []) as unknown as (Review & { reviewer: any; group: any })[]

  // 4. Fetch Clips
  const { data: clipsData } = await supabase
    .from('profile_clips')
    .select('*')
    .eq('user_id', id)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  const clips = (clipsData || []) as unknown as ProfileClip[]

  // 5. Fetch Completed Groups Count
  const { count: completedGroupsCount } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', id)
    .eq('status', 'completed')

  // 6. Check Favorite status
  let isFavorited = false
  if (session?.user?.id && !isOwnProfile) {
    const { data: fav } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('favorite_user_id', id)
      .maybeSingle()
    isFavorited = !!fav
  }

  // Star Distribution Counts (1 to 5)
  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  reviews.forEach((r) => {
    if (starCounts[r.rating] !== undefined) {
      starCounts[r.rating]++
    }
  })

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile Identity Hero Banner */}
        <div className="card-game p-6 sm:p-8 mb-8 relative overflow-hidden bg-[#141722]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white font-extrabold text-3xl shadow-xl overflow-hidden border border-[rgba(255,255,255,0.15)]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                  ) : (
                    (profile.username?.[0] || '?').toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#36D399] border-2 border-[#141722]" />
              </div>

              {/* Username & ID */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5FA] font-heading">
                    {profile.username}
                  </h1>
                  {profile.is_admin && (
                    <span className="badge-role bg-[#A855F7]/15 text-[#C084FC]">Yönetici</span>
                  )}
                </div>

                {inGameName ? (
                  <p className="text-xs text-[#A1A6B5] font-mono mt-0.5">
                    {inGameName}
                  </p>
                ) : (
                  <p className="text-xs text-[#686E80] mt-0.5">Oyun içi ID belirtilmedi</p>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-[#686E80]">
                  <div className="flex items-center gap-1">
                    <Calendar size={13} />
                    <span>Üyelik: {formatDate(profile.created_at)}</span>
                  </div>
                  {profile.privacy_last_seen && profile.last_seen_at && (
                    <div className="flex items-center gap-1">
                      <Clock size={13} />
                      <span>Aktif: {timeAgo(profile.last_seen_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rating Stats & Action CTA */}
            <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
              <div className="bg-[#0E1018] border border-[rgba(255,255,255,0.06)] p-3.5 rounded-xl text-left sm:text-right">
                {profile.review_count > 0 ? (
                  <>
                    <StarRating rating={profile.avg_rating} reviewCount={profile.review_count} size="lg" />
                    <span className="text-[10px] text-[#686E80] block mt-1">Topluluk Güvenilirlik Skoru</span>
                  </>
                ) : (
                  <span className="text-xs text-[#686E80] italic">Henüz değerlendirme almadı</span>
                )}
              </div>

              {isOwnProfile ? (
                <Link href="/profil/duzenle" className="btn-secondary text-xs py-2 px-4 w-full sm:w-auto">
                  Profili Düzenle
                </Link>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    href={`/rapor?user=${profile.id}`}
                    className="btn-secondary text-xs py-2 px-3 text-[#F87171] hover:bg-[#F87171]/10 border-[#F87171]/20"
                    title="Oyuncuyu Bildir"
                  >
                    <AlertTriangle size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs sm:text-sm text-[#A1A6B5] leading-relaxed mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
              {profile.bio}
            </p>
          )}
        </div>

        {/* 2 Kolon Grid: Sol Detaylar, Sağ Değerlendirme & Dağılım */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon: Oyun ve Profil Nitelikleri */}
          <div className="space-y-6">
            <div className="card-game p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3">
                Oyun ve Tercihler
              </h2>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.04)]">
                <div>
                  <span className="text-[10px] text-[#686E80] block font-mono">REKABETÇİ SEVİYE</span>
                  <span className="text-sm font-bold text-white font-heading">{rank}</span>
                </div>
                <RankBadge rank={rank} size="sm" showName={false} />
              </div>

              {displayRoles && displayRoles.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-[#686E80] uppercase tracking-wider block mb-2">
                    Tercih Edilen Roller
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {displayRoles.map((r: string) => (
                      <span key={r} className="badge-role">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profile.primary_agent || profile.secondary_agent) && (
                <div>
                  <label className="text-[11px] font-semibold text-[#686E80] uppercase tracking-wider block mb-2">
                    Ajan Havuzu
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.primary_agent && (
                      <span className="badge-role bg-[#A855F7]/15 text-[#C084FC] border-[#A855F7]/30">
                        ★ {profile.primary_agent} (Ana)
                      </span>
                    )}
                    {profile.secondary_agent && (
                      <span className="badge-role bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20">
                        {profile.secondary_agent} (Yedek)
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2.5 text-xs pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <div className="flex justify-between items-center text-[#A1A6B5]">
                  <span className="text-[#686E80]">Mikrofon Kullanımı:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    {profile.microphone ? (
                      <span className="text-[#36D399] flex items-center gap-1">
                        <Mic size={13} />
                        Kullanıyor
                      </span>
                    ) : (
                      <span className="text-[#686E80] flex items-center gap-1">
                        <MicOff size={13} />
                        Kullanmıyor
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#A1A6B5]">
                  <span className="text-[#686E80]">Sunucu / Bölge:</span>
                  <span className="text-white font-medium">{profile.server_region?.toUpperCase() || 'TR'}</span>
                </div>

                <div className="flex justify-between items-center text-[#A1A6B5]">
                  <span className="text-[#686E80]">Oyun Tarzı:</span>
                  <span className="text-white font-medium">
                    {profile.play_style === 'serious' ? '🎯 Ciddi Rekabetçi' :
                     profile.play_style === 'casual' ? '😎 Rahat' : '🎉 Eğlence Odaklı'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Profil Etkileşimi, Rozetler, Klipler & Değerlendirmeler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gelişmiş Profil İstemci Bileşeni (Rozetler, Klipler, Silah Vitrini, Favori/Davet) */}
            <ProfileViewClient
              profile={profile}
              initialClips={clips}
              initialIsFavorited={isFavorited}
              isOwnProfile={isOwnProfile}
              currentUserId={session?.user?.id}
              reviewsCount={reviews.length}
              avgRating={profile.avg_rating || 0}
              completedGroupsCount={completedGroupsCount || 0}
            />

            <div className="card-game p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)] mb-6">
                <div>
                  <h2 className="text-base font-bold text-[#F5F5FA] font-heading flex items-center gap-2">
                    <Star size={17} className="text-[#FBBF24]" />
                    <span>Takım Arkadaşı İncelemeleri</span>
                  </h2>
                  <p className="text-xs text-[#A1A6B5] mt-0.5">
                    Yalnızca aynı lobi oturumunda oynayan doğrulanmış oyuncuların puanlarıdır.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#A855F7] tabular-numbers font-mono">
                  {reviews.length} Toplam
                </span>
              </div>

              {/* Gerçek Puanlardan Üretilen Yıldız Dağılım Çubukları */}
              {reviews.length > 0 && (
                <div className="p-4 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.04)] mb-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((s) => {
                    const cnt = starCounts[s] || 0
                    const pct = reviews.length > 0 ? Math.round((cnt / reviews.length) * 100) : 0
                    return (
                      <div key={s} className="flex items-center gap-3 text-xs">
                        <span className="w-12 text-[#A1A6B5] font-mono text-[11px]">{s} Yıldız</span>
                        <div className="flex-1 h-2 rounded-full bg-[#141722] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#A855F7] to-[#7C3AED] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] text-[#686E80] font-mono tabular-numbers">
                          {cnt}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* İnceleme Listesi */}
              {reviews.length > 0 ? (
                <div className="space-y-3.5">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-[#0E1018]/70 border border-[rgba(255,255,255,0.04)] space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white font-bold text-xs">
                            {(rev.reviewer?.username?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/profil/${rev.reviewer_id}`}
                              className="text-xs font-semibold text-[#F5F5FA] hover:text-[#A855F7] transition-colors"
                            >
                              {rev.reviewer?.username}
                            </Link>
                            <span className="text-[10px] text-[#686E80] block">
                              {timeAgo(rev.created_at)}
                            </span>
                          </div>
                        </div>

                        <StarRating rating={rev.rating} size="xs" />
                      </div>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rev.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#141722] text-[#A1A6B5] border border-[rgba(255,255,255,0.06)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {rev.comment && (
                        <p className="text-xs text-[#A1A6B5] leading-relaxed italic bg-[#141722]/50 p-2.5 rounded-lg border border-[rgba(255,255,255,0.04)]">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#686E80]">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Bu oyuncu henüz değerlendirme almadı.</p>
                  <p className="text-[11px] text-[#686E80] mt-1">Birlikte oynadıktan sonra deneyimini paylaşabilirsin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
