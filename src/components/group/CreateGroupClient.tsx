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
import RankBadge from '@/components/ui/RankBadge'
import AgentSelector from '@/components/ui/AgentSelector'
import {
  Zap, ChevronDown, ChevronUp, Lock, Users,
  Gamepad2, Sparkles, ShieldCheck, ArrowRight,
  CheckCircle2, AlertCircle, Eye, SlidersHorizontal
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface CreateGroupClientProps {
  currentUser: any
}

export default function CreateGroupClient({ currentUser }: CreateGroupClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // 1. HIZLI İLAN BAŞLANGIÇ DEĞERLERİ (VARSAYILANLAR)
  // Oyun modu: Derecesiz
  // Aranan oyuncu sayısı: 2
  // Oyun tarzı: Ciddi (serious)
  const [gameMode, setGameMode] = useState<string>('Derecesiz')
  const [playersNeeded, setPlayersNeeded] = useState<number>(2)
  const [playStyle, setPlayStyle] = useState<string>('serious')

  // Gelişmiş Seçenekler (Başlangıçta kapalı)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)

  // Akıllı Profil Varsayılanları (Kullanıcının profilinden otomatik çekilir)
  const [customTitle, setCustomTitle] = useState<string>('')
  const [customDescription, setCustomDescription] = useState<string>('')
  const [minRank, setMinRank] = useState<string>(currentUser?.rank || 'Platin 1')
  const [maxRank, setMaxRank] = useState<string>(currentUser?.rank || 'Elmas 3')
  const [rolesWanted, setRolesWanted] = useState<string[]>(currentUser?.preferred_roles || [])
  const [agentsWanted, setAgentsWanted] = useState<string[]>([])
  const [micRequired, setMicRequired] = useState<boolean>(currentUser?.microphone ?? true)
  const [serverRegion, setServerRegion] = useState<string>(currentUser?.server_region || 'tr')
  const [joinType, setJoinType] = useState<'application' | 'open'>('application')
  const [lobbyCode, setLobbyCode] = useState<string>('')
  const [discordUsername, setDiscordUsername] = useState<string>('')

  // Durum Yönetimi
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Otomatik Üretilen Başlık: "Valorant Derecesiz — 2 Oyuncu Aranıyor"
  const generatedTitle = `Valorant ${gameMode} — ${playersNeeded} Oyuncu Aranıyor`
  const displayTitle = customTitle.trim() || generatedTitle

  // Kontenjan Hesabı: Lider (1 kişi) + Aranan oyuncu sayısı
  const totalSlots = 1 + playersNeeded

  const toggleRole = (roleName: string) => {
    if (rolesWanted.includes(roleName)) {
      setRolesWanted(rolesWanted.filter((r) => r !== roleName))
    } else {
      setRolesWanted([...rolesWanted, roleName])
    }
  }

  // İlan Oluşturma Eylemi
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return // Çift tıklama / duplicate koruması

    setErrorMsg(null)
    setLoading(true)

    try {
      // 1. Kimlik Doğrulama Kontrolü (Sunucu Tarafı Güvenliği)
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        toast.error('Grup oluşturmak için lütfen giriş yapın.')
        router.push('/giris?redirect=/grup/olustur')
        return
      }

      const finalTitle = customTitle.trim() || generatedTitle

      // 2. Groups Tablosuna Kayıt
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .insert({
          owner_id: user.id,
          game_id: 'valorant',
          game_mode: gameMode,
          title: finalTitle,
          description: customDescription.trim() || null,
          min_rank: minRank,
          max_rank: maxRank,
          slots_total: totalSlots,
          slots_filled: 1, // Lider dahil 1 kişi
          roles_wanted: rolesWanted.length > 0 ? rolesWanted : null,
          agents_wanted: agentsWanted.length > 0 ? agentsWanted : null,
          mic_required: micRequired,
          server_region: serverRegion,
          play_style: playStyle,
          join_type: joinType,
          discord_username: discordUsername.trim() || null,
          status: 'active',
        })
        .select()
        .single()

      if (groupErr) throw groupErr

      // 3. Lideri Group Members Tablosuna Ekle
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberErr) throw memberErr

      // 4. Lobi Kodu Girildiyse Sadece Güvenli group_secrets Tablosuna Kaydet
      if (lobbyCode.trim()) {
        try {
          await supabase.from('group_secrets').insert({
            group_id: group.id,
            lobby_code: lobbyCode.trim(),
          })
        } catch (e) {
          console.warn('group_secrets insertion fallback:', e)
        }
      }

      toast.success('İlanın başarıyla yayınlandı!')
      router.push(`/grup/${group.id}`)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'İlan oluşturulurken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Başlık Alanı */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] uppercase tracking-wider mb-1 font-mono">
            <Zap size={14} className="fill-[#A855F7]" />
            <span>30 SANİYEDE HIZLI İLAN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
            Valorant Takım İlanı Oluştur
          </h1>
          <p className="text-[#A1A6B5] text-xs sm:text-sm mt-1">
            Modunu ve aradığın kişi sayısını seç, anında lobi akışına düşsün.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-6 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#F87171]">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sol Kolon: Hızlı İlan Formu */}
          <div className="lg:col-span-7">
            <form onSubmit={handleCreateGroup} className="card-game p-6 sm:p-8 space-y-6 bg-[#141722]">
              {/* 1. OYUN MODU SEÇİMİ (Kart / Segment Kontrolü) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#A1A6B5] block mb-2 font-mono">
                  1. Oyun Modu
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Derecesiz', label: 'Derecesiz', desc: 'Chill maçlar' },
                    { id: 'Dereceli', label: 'Dereceli', desc: 'Rank kasma' },
                    { id: 'Özel Oyun', label: 'Özel Oyun', desc: 'Custom / 10-man' },
                  ].map((mode) => {
                    const isSelected = gameMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setGameMode(mode.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#A855F7] bg-[#A855F7]/15 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-[#A855F7]'
                            : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#191D2A]'
                        }`}
                      >
                        <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-[#F5F5FA]'}`}>
                          {mode.label}
                        </span>
                        <span className="text-[10px] text-[#686E80] mt-0.5 block">
                          {mode.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. ARANAN OYUNCU SAYISI (1, 2, 3, 4 Kişi) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#A1A6B5] font-mono">
                    2. Aranan Oyuncu Sayısı (Lider Hariç)
                  </label>
                  <span className="text-[11px] text-[#A855F7] font-mono">
                    Toplam Kadro: {totalSlots} Kişi
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((count) => {
                    const isSelected = playersNeeded === count
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPlayersNeeded(count)}
                        className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A855F7] bg-[#A855F7]/20 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)] ring-1 ring-[#A855F7]'
                            : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] text-[#A1A6B5] hover:border-[rgba(255,255,255,0.15)] hover:text-white'
                        }`}
                      >
                        <span className="text-sm font-extrabold block font-mono">+{count}</span>
                        <span className="text-[10px] text-[#686E80] block mt-0.5">
                          {count === 1 ? 'Duo' : count === 2 ? 'Trio' : count === 4 ? '5-Stack' : 'Kişi'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. OYUN TARZI SEÇİMİ (Ciddi, Farketmez, Eğlence) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#A1A6B5] block mb-2 font-mono">
                  3. Oyun Tarzı
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'serious', label: 'Ciddi', sub: 'Tryhard / Kazanma odaklı', icon: '🎯' },
                    { id: 'casual', label: 'Farketmez', sub: 'Dengeli & Sakin', icon: '⚖️' },
                    { id: 'fun', label: 'Eğlence', sub: 'Sohbet & Rahat oyun', icon: '😎' },
                  ].map((style) => {
                    const isSelected = playStyle === style.id
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setPlayStyle(style.id)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#A855F7] bg-[#A855F7]/15 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-[#A855F7]'
                            : 'border-[rgba(255,255,255,0.06)] bg-[#0E1018] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#191D2A]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{style.icon}</span>
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#F5F5FA]'}`}>
                            {style.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#686E80] block leading-tight">
                          {style.sub}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* HIZLI OLUŞTUR BUTONU (İLK EKRANDA BELİRGİN) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm font-bold justify-center shadow-lg shadow-[#A855F7]/30 hover:shadow-[#A855F7]/50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <span>İlanın Yayınlanıyor...</span>
                  ) : (
                    <>
                      <Zap size={16} className="fill-white" />
                      <span>Hemen İlanı Yayınla (30sn)</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
                <span className="text-[11px] text-[#686E80] text-center block mt-2">
                  Başlık ve detaylar otomatik ayarlanır. İstersen aşağıdan özelleştirebilirsin.
                </span>
              </div>

              {/* GELİŞMİŞ SEÇENEKLER (AKORDİYON - BAŞLANGIÇTA KAPALI) */}
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] text-xs font-semibold text-[#A1A6B5] hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-[#A855F7]" />
                    <span>Gelişmiş Seçenekler (Özel Başlık, Ajanlar, Rank, Kod)</span>
                  </span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-5 rounded-2xl bg-[#0E1018]/60 border border-[rgba(255,255,255,0.06)] space-y-5 animate-in-fast">
                    {/* Özel Başlık ve Açıklama */}
                    <div>
                      <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                        Özel Başlık (İsteğe Bağlı)
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder={`Varsayılan: ${generatedTitle}`}
                        className="input-game text-xs"
                        maxLength={80}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                        Özel Açıklama (İsteğe Bağlı)
                      </label>
                      <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Oyun tarzın, takım arkadaşlarından beklentilerin veya stratejin..."
                        className="input-game text-xs min-h-[75px] resize-none"
                        maxLength={250}
                      />
                    </div>

                    {/* Hedef Rank Aralığı */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                          Minimum Rank
                        </label>
                        <select
                          value={minRank}
                          onChange={(e) => setMinRank(e.target.value)}
                          className="input-game text-xs"
                        >
                          {ALL_VALORANT_TIERS.map((tier) => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                          Maksimum Rank
                        </label>
                        <select
                          value={maxRank}
                          onChange={(e) => setMaxRank(e.target.value)}
                          className="input-game text-xs"
                        >
                          {ALL_VALORANT_TIERS.map((tier) => (
                            <option key={tier} value={tier}>{tier}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* İhtiyaç Duyulan Rol */}
                    <div>
                      <label className="text-xs font-semibold text-[#A1A6B5] block mb-2">
                        Aranan Roller
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {VALORANT_ROLES.map((role) => {
                          const selected = rolesWanted.includes(role.name)
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => toggleRole(role.name)}
                              className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#A855F7] bg-[#A855F7]/20 text-white'
                                  : 'border-[rgba(255,255,255,0.06)] bg-[#141722] text-[#A1A6B5]'
                              }`}
                            >
                              <span>{role.icon}</span>
                              <span>{role.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Görsel Ajan Seçici */}
                    <div>
                      <AgentSelector
                        label="Özellikle Aranan Ajanlar"
                        subtitle="Takımında mutlaka görmek istediğin ajanları kartlara tıklayarak belirle."
                        selectedAgents={agentsWanted}
                        onChange={setAgentsWanted}
                      />
                    </div>

                    {/* Mikrofon, Sunucu ve Katılım Türü */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Mikrofon</label>
                        <select
                          value={micRequired ? 'true' : 'false'}
                          onChange={(e) => setMicRequired(e.target.value === 'true')}
                          className="input-game text-xs"
                        >
                          <option value="true">Mikrofon Zorunlu</option>
                          <option value="false">Farketmez / İsteğe Bağlı</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Sunucu</label>
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

                      <div>
                        <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">Katılım</label>
                        <select
                          value={joinType}
                          onChange={(e) => setJoinType(e.target.value as any)}
                          className="input-game text-xs"
                        >
                          <option value="application">Başvurulu (Önerilen)</option>
                          <option value="open">Açık Doğrudan Katılım</option>
                        </select>
                      </div>
                    </div>

                    {/* Oyun İçi Parti Kodu */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-[#A1A6B5] font-mono">
                          Valorant Oyun İçi Parti Kodu
                        </label>
                        <span className="text-[10px] text-[#36D399] flex items-center gap-1 font-mono">
                          <Lock size={10} />
                          Yalnızca onaylanan üyelere gösterilir
                        </span>
                      </div>
                      <input
                        type="text"
                        value={lobbyCode}
                        onChange={(e) => setLobbyCode(e.target.value)}
                        placeholder="Örn: TR1-9482 (Oyuna girince de ekleyebilirsin)"
                        className="input-game text-xs font-mono tracking-wider"
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Sağ Kolon: Canlı Kart Önizlemesi */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#A1A6B5] flex items-center gap-1.5 font-mono">
              <Eye size={13} className="text-[#A855F7]" />
              <span>Canlı İlan Kartı Önizlemesi</span>
            </div>

            <div className="card-game p-5 relative overflow-hidden bg-[#141722] border border-[rgba(255,255,255,0.08)]">
              {/* Üst Başlık & Mod */}
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-xs font-bold text-[#A855F7]">
                    VAL
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] block">
                      Valorant
                    </span>
                    <span className="text-[11px] text-[#A1A6B5] font-medium">
                      {gameMode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#36D399] shadow-[0_0_8px_#36D399]" />
                </div>
              </div>

              {/* İlan Başlığı */}
              <h3 className="text-base font-bold text-[#F5F5FA] line-clamp-1 mb-2 font-heading">
                {displayTitle}
              </h3>

              {/* Açıklama veya Otomatik Özellikler */}
              {customDescription ? (
                <p className="text-xs text-[#A1A6B5] line-clamp-2 leading-relaxed mb-4">
                  {customDescription}
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-[#0E1018] text-[#F5F5FA] border border-[rgba(255,255,255,0.06)]">
                    {gameMode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#0E1018] text-[#36D399] border border-[rgba(255,255,255,0.06)]">
                    {micRequired ? '🎙️ Mikrofon Şart' : 'Mikrofon Serbest'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#0E1018] text-[#A1A6B5] border border-[rgba(255,255,255,0.06)]">
                    {playStyle === 'serious' ? '🎯 Ciddi' : playStyle === 'casual' ? '😎 Rahat' : '🎉 Eğlence'}
                  </span>
                </div>
              )}

              {/* Rank Aralığı */}
              <div className="flex items-center gap-2 mb-4">
                <RankBadge rank={minRank} size="xs" />
                <span className="text-[#686E80] text-xs">→</span>
                <RankBadge rank={maxRank} size="xs" />
              </div>

              {/* Roller */}
              {rolesWanted.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {rolesWanted.map((role) => (
                    <span key={role} className="badge-role">
                      {role}
                    </span>
                  ))}
                </div>
              )}

              {/* Aranan Kişi Durumu */}
              <div className="p-3 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.04)] text-xs flex justify-between items-center text-[#A1A6B5]">
                <span>Kadro Durumu</span>
                <span className="text-white font-semibold">
                  1 / {totalSlots} ({playersNeeded} aranıyor)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
