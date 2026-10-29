'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import {
  ALL_VALORANT_TIERS,
  VALORANT_ROLES,
  SERVERS,
  PLAY_STYLES
} from '@/lib/constants'
import { calculateProfileCompletion } from '@/lib/profile-utils'
import AgentSelector from '@/components/ui/AgentSelector'
import SkinSelectorModal from '@/components/profile/SkinSelectorModal'
import SkinShowcase from '@/components/profile/SkinShowcase'
import {
  Save, ArrowLeft, User, Gamepad2, Sparkles,
  ShieldCheck, Clock, CheckCircle2, Lock, Flame
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface EditProfileClientProps {
  initialProfile: any
}

export default function EditProfileClient({ initialProfile }: EditProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)

  // Profile fields
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [riotId, setRiotId] = useState(initialProfile?.riot_id || '')
  const [riotTag, setRiotTag] = useState(initialProfile?.riot_tag || '')
  const [rank, setRank] = useState(initialProfile?.rank || 'Platin 1')
  const [primaryAgent, setPrimaryAgent] = useState(initialProfile?.primary_agent || 'Jett')
  const [secondaryAgent, setSecondaryAgent] = useState(initialProfile?.secondary_agent || 'Reyna')
  const [preferredRoles, setPreferredRoles] = useState<string[]>(initialProfile?.preferred_roles || ['Düellocu'])
  const [serverRegion, setServerRegion] = useState(initialProfile?.server_region || 'tr')
  const [playStyle, setPlayStyle] = useState(initialProfile?.play_style || 'serious')
  const [microphone, setMicrophone] = useState(initialProfile?.microphone ?? true)
  const [privacyLastSeen, setPrivacyLastSeen] = useState(initialProfile?.privacy_last_seen ?? true)
  const [privacyShowClips, setPrivacyShowClips] = useState(initialProfile?.privacy_show_clips ?? true)
  const [privacyShowSkins, setPrivacyShowSkins] = useState(initialProfile?.privacy_show_skins ?? true)
  const [usualHours, setUsualHours] = useState<string[]>(initialProfile?.usual_hours || ['evening'])
  const [favoriteSkins, setFavoriteSkins] = useState<any[]>(initialProfile?.favorite_skins || [])
  const [skinModalOpen, setSkinModalOpen] = useState(false)

  // Calculate live completion based on current form state
  const currentCompletion = calculateProfileCompletion({
    ...initialProfile,
    display_name: displayName,
    bio,
    riot_id: riotId,
    riot_tag: riotTag,
    rank,
    primary_agent: primaryAgent,
    secondary_agent: secondaryAgent,
    preferred_roles: preferredRoles,
    favorite_skins: favoriteSkins,
  }, true)

  const toggleRole = (roleName: string) => {
    if (preferredRoles.includes(roleName)) {
      setPreferredRoles(preferredRoles.filter((r) => r !== roleName))
    } else {
      setPreferredRoles([...preferredRoles, roleName])
    }
  }

  const toggleHour = (hour: string) => {
    if (usualHours.includes(hour)) {
      setUsualHours(usualHours.filter((h) => h !== hour))
    } else {
      setUsualHours([...usualHours, hour])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== initialProfile.id) {
        toast.error('Yalnızca kendi profilinizi düzenleyebilirsiniz.')
        return
      }

      const cleanRiotTag = riotTag.trim().replace(/^#/, '')
      if (cleanRiotTag && cleanRiotTag.length > 20) {
        toast.error('Riot Tag çok uzun.')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim().slice(0, 50) || null,
          bio: bio.trim().slice(0, 300) || null,
          riot_id: riotId.trim().slice(0, 50) || null,
          riot_tag: cleanRiotTag.slice(0, 20) || null,
          rank,
          primary_agent: primaryAgent,
          secondary_agent: secondaryAgent,
          preferred_roles: preferredRoles,
          server_region: serverRegion,
          play_style: playStyle,
          microphone,
          privacy_last_seen: privacyLastSeen,
          privacy_show_clips: privacyShowClips,
          privacy_show_skins: privacyShowSkins,
          usual_hours: usualHours,
          favorite_skins: favoriteSkins,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', initialProfile.id)

      if (error) throw error

      toast.success('Oyuncu profilin başarıyla güncellendi!')
      router.push(`/profil/${initialProfile.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Profil güncellenirken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/profil/${initialProfile.id}`}
              className="p-2 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] text-[#A1A6B5] hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] font-mono">
                KİMLİK BİLGİLERİ
              </span>
              <h1 className="text-2xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
                Oyuncu Profilini Düzenle
              </h1>
            </div>
          </div>
        </div>

        {/* PROFIL TAMAMLAMA YÜZDESİ KARTI */}
        <div className="card-game p-5 mb-6 bg-[#141722] border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#36D399]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono">
                Profil Tamamlama Oranı
              </span>
            </div>
            <span className="text-sm font-extrabold text-[#36D399] font-mono tabular-numbers">
              %{currentCompletion.score}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#0E1018] overflow-hidden mb-3 border border-[rgba(255,255,255,0.04)]">
            <div
              className="h-full bg-gradient-to-r from-[#A855F7] via-[#7C3AED] to-[#36D399] rounded-full transition-all duration-300"
              style={{ width: `${currentCompletion.score}%` }}
            />
          </div>

          {currentCompletion.missingFields.length > 0 ? (
            <div>
              <span className="text-[11px] text-[#A1A6B5] block mb-1.5 font-medium">
                Profilini %100 yapmak için tamamlayabileceğin alanlar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentCompletion.missingFields.map((f) => (
                  <span
                    key={f.key}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#0E1018] text-[#A855F7] border border-[#A855F7]/30"
                  >
                    + {f.label} (+%{f.weight})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className="text-xs text-[#36D399] font-medium flex items-center gap-1.5">
              🎉 Harika! Profil kartın %100 eksiksiz tamamlandı.
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. VALORANT OYUN KİMLİĞİ VE RIOT ID */}
          <div className="card-game p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3 flex items-center gap-2">
              <Gamepad2 size={15} className="text-[#A855F7]" />
              <span>Valorant Kimliği & Rank</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                  Riot ID (Oyun İçi İsim)
                </label>
                <input
                  type="text"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  placeholder="Örn: TenZ"
                  className="input-game text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                  Etiket (#Tag)
                </label>
                <input
                  type="text"
                  value={riotTag}
                  onChange={(e) => setRiotTag(e.target.value)}
                  placeholder="Örn: TR1"
                  className="input-game text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                  Mevcut Rank Kademesi
                </label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="input-game text-xs"
                >
                  {ALL_VALORANT_TIERS.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                  Sunucu Bölgesi
                </label>
                <select
                  value={serverRegion}
                  onChange={(e) => setServerRegion(e.target.value)}
                  className="input-game text-xs"
                >
                  {SERVERS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. GÖRSEL AJAN KATALOĞU VE ROL SEÇİMİ */}
          <div className="card-game p-6 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-[#A855F7]" />
              <span>Görsel Ajan & Rol Havuzu</span>
            </h2>

            {/* Birincil Ajan Görsel Seçici */}
            <div>
              <AgentSelector
                mode="single"
                label="En Çok Güvendiğin Ajan (Birincil Tercih)"
                subtitle="Profilinde ana ajan olarak sergilenecek görsel ajan kartı."
                selectedAgents={primaryAgent ? [primaryAgent] : []}
                onChange={(selected) => setPrimaryAgent(selected[0] || 'Jett')}
              />
            </div>

            {/* İkincil Ajan Görsel Seçici */}
            <div className="pt-3 border-t border-[rgba(255,255,255,0.04)]">
              <AgentSelector
                mode="single"
                label="İkinci Tercih Ettiğin Ajan (Yedek)"
                subtitle="Takım ihtiyacına göre geçiş yapabildiğin alternatif ajan."
                selectedAgents={secondaryAgent ? [secondaryAgent] : []}
                onChange={(selected) => setSecondaryAgent(selected[0] || 'Reyna')}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#A1A6B5] block mb-2">
                Oynayabildiğin Roller
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VALORANT_ROLES.map((role) => {
                  const selected = preferredRoles.includes(role.name)
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.name)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selected
                          ? 'border-[#A855F7] bg-[#A855F7]/20 text-white shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                          : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] text-[#A1A6B5] hover:border-[rgba(255,255,255,0.15)]'
                      }`}
                    >
                      <span>{role.icon}</span>
                      <span>{role.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 3. FAVORİ SİLAH DESENLERİ */}
          <div className="card-game p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono flex items-center gap-2">
                <Sparkles size={15} className="text-[#FBBF24]" />
                <span>Favori Silah Desenlerin ({favoriteSkins.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setSkinModalOpen(true)}
                className="btn-secondary text-xs py-1 px-3"
              >
                {favoriteSkins.length > 0 ? 'Desenleri Değiştir' : '+ Desen Ekle'}
              </button>
            </div>

            <SkinShowcase
              skins={favoriteSkins}
              isOwner={true}
              onEditClick={() => setSkinModalOpen(true)}
            />
          </div>

          {/* 4. MÜSAİTLİK VE SAATLER */}
          <div className="card-game p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3 flex items-center gap-2">
              <Clock size={15} className="text-[#38BDF8]" />
              <span>Genel Müsaitlik Saatlerin</span>
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#A1A6B5] block mb-2">
                Genellikle Hangi Saatlerde Aktifsin?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'morning', label: 'Sabah (09:00 - 12:00)' },
                  { id: 'afternoon', label: 'Öğle (12:00 - 18:00)' },
                  { id: 'evening', label: 'Akşam (18:00 - 00:00)' },
                  { id: 'night', label: 'Gece (00:00 - 04:00)' },
                ].map((hour) => {
                  const selected = usualHours.includes(hour.id)
                  return (
                    <button
                      key={hour.id}
                      type="button"
                      onClick={() => toggleHour(hour.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                        selected
                          ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white'
                          : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] text-[#A1A6B5]'
                      }`}
                    >
                      {hour.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 5. KİŞİSEL BİLGİLER VE OYUN TARZI */}
          <div className="card-game p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3 flex items-center gap-2">
              <User size={15} className="text-[#A855F7]" />
              <span>Hakkında & Oyun Tarzı</span>
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Görünen Ad</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Örn: Ali İhsan"
                className="input-game text-xs"
                maxLength={40}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Biyografi</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Takım arkadaşlarına oyun hedeflerinden ve alışkanlıklarından bahset..."
                className="input-game text-xs min-h-[90px] resize-none"
                maxLength={300}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Oyun Tarzı</label>
                <select
                  value={playStyle}
                  onChange={(e) => setPlayStyle(e.target.value)}
                  className="input-game text-xs"
                >
                  {PLAY_STYLES.map((p) => (
                    <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Mikrofon Durumu</label>
                <select
                  value={microphone ? 'true' : 'false'}
                  onChange={(e) => setMicrophone(e.target.value === 'true')}
                  className="input-game text-xs"
                >
                  <option value="true">Mikrofon kullanıyorum</option>
                  <option value="false">Mikrofon kullanmıyorum</option>
                </select>
              </div>
            </div>
          </div>

          {/* 6. GİZLİLİK AYARLARI */}
          <div className="card-game p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3 flex items-center gap-2">
              <Lock size={15} className="text-[#36D399]" />
              <span>Profil Gizlilik Ayarları</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#F5F5FA] block">Son Görülme Zamanı</span>
                  <span className="text-[11px] text-[#686E80]">Profilinde aktif olduğun son saat görünsün.</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyLastSeen}
                  onChange={(e) => setPrivacyLastSeen(e.target.checked)}
                  className="w-4 h-4 accent-[#A855F7] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)]">
                <div>
                  <span className="font-semibold text-[#F5F5FA] block">Vuruş Klipleri Galerisi</span>
                  <span className="text-[11px] text-[#686E80]">Paylaştığın en iyi vuruş videoları herkese açık olsun.</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyShowClips}
                  onChange={(e) => setPrivacyShowClips(e.target.checked)}
                  className="w-4 h-4 accent-[#A855F7] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.04)]">
                <div>
                  <span className="font-semibold text-[#F5F5FA] block">Silah Vitrini</span>
                  <span className="text-[11px] text-[#686E80]">Favori silah desenlerin profilinde gösterilsin.</span>
                </div>
                <input
                  type="checkbox"
                  checked={privacyShowSkins}
                  onChange={(e) => setPrivacyShowSkins(e.target.checked)}
                  className="w-4 h-4 accent-[#A855F7] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3 text-xs font-semibold justify-center"
          >
            <Save size={15} />
            <span>{saving ? 'Kaydediliyor...' : 'Tüm Değişiklikleri Kaydet'}</span>
          </button>
        </form>

        {/* Silah Seçim Modalı */}
        <SkinSelectorModal
          isOpen={skinModalOpen}
          onClose={() => setSkinModalOpen(false)}
          selectedSkins={favoriteSkins}
          onSave={(updated) => setFavoriteSkins(updated)}
        />
      </div>
    </MainLayout>
  )
}
