'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import StarRating from '@/components/ui/StarRating'
import RankBadge from '@/components/ui/RankBadge'
import { timeAgo, copyToClipboard } from '@/lib/utils'
import { VALORANT_AGENTS, ALL_VALORANT_TIERS, VALORANT_ROLES } from '@/lib/constants'
import type { GroupWithDetails, GroupApplication, Profile } from '@/types/database'
import {
  Users, Gamepad2, Mic, MicOff, Globe, Copy, Check,
  Lock, Award, MessageSquare, Trash2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Sparkles, Send
} from 'lucide-react'
import toast from 'react-hot-toast'

interface GroupDetailClientProps {
  initialGroup: GroupWithDetails
  currentUser: Profile | null
  initialApplications: GroupApplication[]
  isMember: boolean
  isOwner: boolean
}

export default function GroupDetailClient({
  initialGroup,
  currentUser,
  initialApplications,
  isMember,
  isOwner,
}: GroupDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [group, setGroup] = useState<GroupWithDetails>(initialGroup)
  const [applications, setApplications] = useState<GroupApplication[]>(initialApplications)
  const [copied, setCopied] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Güvenli Lobi Kodu State'i (Sunucu API'sinden çekilir)
  const [secureLobbyCode, setSecureLobbyCode] = useState<string | null>(null)
  const [loadingLobbyCode, setLoadingLobbyCode] = useState(false)

  // Başvuru Formu State'leri
  const [applyRank, setApplyRank] = useState(currentUser?.rank || 'Platin 1')
  const [applyPrimaryAgent, setApplyPrimaryAgent] = useState(currentUser?.primary_agent || 'Jett')
  const [applyRole, setApplyRole] = useState(currentUser?.preferred_roles?.[0] || 'Düellocu')
  const [applyMic, setApplyMic] = useState(currentUser?.microphone ?? true)
  const [applyMsg, setApplyMsg] = useState('')
  const [submittingApply, setSubmittingApply] = useState(false)

  const slotsLeft = group.slots_total - group.slots_filled
  const canAccessCode = isOwner || isMember

  // Yetkili kullanıcı için lobi kodunu sunucudan güvenli getirme
  useEffect(() => {
    if (canAccessCode && group.status !== 'cancelled' && group.status !== 'closed') {
      const fetchLobbyCode = async () => {
        setLoadingLobbyCode(true)
        try {
          const res = await fetch(`/api/groups/${group.id}/lobby-code`)
          const data = await res.json()
          if (res.ok && data.lobby_code) {
            setSecureLobbyCode(data.lobby_code)
          }
        } catch {
          // Kod alınamadıysa sessizce kalır
        } finally {
          setLoadingLobbyCode(false)
        }
      }
      fetchLobbyCode()
    }
  }, [group.id, canAccessCode, group.status])

  // Supabase Realtime Değişiklik Dinleyicisi
  useEffect(() => {
    const channel = supabase
      .channel(`group-${group.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${group.id}` },
        (payload: any) => {
          setGroup((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_members', filter: `group_id=eq.${group.id}` },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [group.id])

  const handleCopyCode = async () => {
    if (!secureLobbyCode) return
    await copyToClipboard(secureLobbyCode)
    setCopied(true)
    toast.success('Valorant parti kodu panoya kopyalandı!')
    setTimeout(() => setCopied(false), 2500)
  }

  // Açık Gruba Doğrudan Katıl (join_type === 'open')
  const handleDirectJoin = async () => {
    if (!currentUser) {
      toast.error('Gruba katılmak için giriş yapmalısınız.')
      router.push(`/giris?redirect=/grup/${group.id}`)
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/groups/${group.id}/join`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Katılma işlemi başarısız.')
      }

      toast.success('Gruba katıldınız! Lobi kodu aktif edildi.')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Katılma işlemi sırasında hata oluştu.')
    } finally {
      setActionLoading(false)
    }
  }

  // Başvuru Gönder (Oyuncunun özellikleri lider onayına iletilir)
  const handleSendApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      toast.error('Başvuru yapmak için giriş yapmalısınız.')
      router.push(`/giris?redirect=/grup/${group.id}`)
      return
    }

    setSubmittingApply(true)
    try {
      const { error } = await supabase.from('group_applications').insert({
        group_id: group.id,
        applicant_id: currentUser.id,
        applicant_rank: applyRank,
        applicant_primary_agent: applyPrimaryAgent,
        applicant_role: applyRole,
        applicant_microphone: applyMic,
        message: applyMsg.trim() || null,
        status: 'pending',
      })

      if (error) {
        if (error.code === '23505') {
          toast.error('Bu gruba zaten bir başvuru gönderdiniz.')
          return
        }
        throw error
      }

      // Lidere bildirim yolla
      await supabase.from('notifications').insert({
        user_id: group.owner_id,
        type: 'group_application',
        title: 'Yeni Takım Başvurusu',
        message: `${currentUser.username} (${applyRank} - ${applyPrimaryAgent}) "${group.title}" lobine katılmak istiyor.`,
        data: { group_id: group.id },
      })

      toast.success('Başvurun grup liderine iletildi! Onaylandığında kod açılacaktır.')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Başvuru yapılırken hata oluştu.')
    } finally {
      setSubmittingApply(false)
    }
  }

  // Lider Başvuru Onay / Red İşlemi (Sunucu API ile atomik)
  const handleDecideApplication = async (appId: string, action: 'accept' | 'reject') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/groups/${group.id}/applications/${appId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'İşlem başarısız oldu.')
      }

      toast.success(data.message)
      setApplications(applications.filter((a) => a.id !== appId))
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'İşlem tamamlanamadı.')
    } finally {
      setActionLoading(false)
    }
  }

  // Üyeyi Gruptan Çıkar
  const handleKickMember = async (userId: string) => {
    if (!confirm('Bu oyuncuyu gruptan çıkarmak istediğinize emin misiniz?')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', userId)

      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'kicked_from_group',
        title: 'Gruptan Çıkarıldın',
        message: `"${group.title}" lobisinden lider tarafından çıkarıldınız.`,
        data: { group_id: group.id },
      })

      toast.success('Üye gruptan çıkarıldı.')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Üye çıkarılamadı.')
    } finally {
      setActionLoading(false)
    }
  }

  // Oyunu Tamamla ve Değerlendirmeyi Başlat
  const handleCompleteGroup = async () => {
    if (!confirm('Oyunu tamamlandı olarak işaretlemek istiyor musunuz? Oyuncular birbirini değerlendirebilecek.')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'completed' })
        .eq('id', group.id)

      if (error) throw error

      for (const m of group.members) {
        await supabase.from('notifications').insert({
          user_id: m.user_id,
          type: 'review_available',
          title: 'Maç Sonu: Takımını Puanla! ⭐',
          message: `"${group.title}" oyunu tamamlandı. Takım arkadaşlarını değerlendirebilirsin.`,
          data: { group_id: group.id },
        })
      }

      toast.success('Grup tamamlandı! Değerlendirme ekranına yönlendiriliyorsunuz.')
      router.push(`/degerlendir/${group.id}`)
    } catch (err: any) {
      toast.error(err.message || 'İşlem sırasında bir hata oluştu.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Üst Lobi Başlığı ve Durum Bannerı */}
        <div className="card-game p-6 sm:p-8 mb-8 relative overflow-hidden bg-[#141722]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="badge-role bg-[#A855F7]/15 text-[#C084FC]">
                  Valorant
                </span>
                <span className="text-xs text-[#A1A6B5] font-medium">• {group.game_mode}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    group.status === 'active'
                      ? 'bg-[#36D399]/15 text-[#36D399] border border-[#36D399]/30'
                      : group.status === 'completed'
                      ? 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30'
                      : 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30'
                  }`}
                >
                  {group.status === 'active' ? 'Aktif Aranıyor' :
                   group.status === 'completed' ? 'Tamamlandı' : 'Kadro Dolu'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5FA] font-heading">
                {group.title}
              </h1>
              <span className="text-xs text-[#686E80] block mt-1">
                Oluşturulma: {timeAgo(group.created_at)}
              </span>
            </div>

            <div className="bg-[#0E1018] border border-[rgba(255,255,255,0.06)] p-3.5 rounded-xl text-left sm:text-right">
              <span className="text-[10px] text-[#686E80] uppercase tracking-wider font-mono block">
                Kadro Doluluk
              </span>
              <div className="text-2xl font-black text-white tabular-numbers font-heading">
                {group.slots_filled} / {group.slots_total}
              </div>
            </div>
          </div>

          {group.description && (
            <p className="text-xs sm:text-sm text-[#A1A6B5] leading-relaxed mb-6 bg-[#0E1018]/80 p-4 rounded-xl border border-[rgba(255,255,255,0.04)]">
              {group.description}
            </p>
          )}

          {/* OYUN İÇİ GRUP KODU ALANI - EN ÖNEMLİ İŞ KURALI */}
          <div className="p-4.5 rounded-xl bg-[#0E1018] border border-[rgba(168,85,247,0.3)] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_15px_-5px_rgba(168,85,247,0.2)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-[#A855F7] uppercase tracking-wider font-mono font-bold">
                  VALORANT OYUN İÇİ PARTİ / LOBİ KODU
                </span>
                <span className="badge-role text-[9px] py-0">Gizli & Korumalı</span>
              </div>

              {canAccessCode ? (
                secureLobbyCode ? (
                  <div>
                    <span className="text-xl font-mono font-bold text-white tracking-widest block">
                      {secureLobbyCode}
                    </span>
                    <span className="text-[11px] text-[#36D399] mt-0.5 block">
                      ✓ Bu kod yalnızca kabul edilmiş takım üyelerine açıktır.
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#A1A6B5] italic">
                    {loadingLobbyCode ? 'Lobi kodu doğrulanıyor...' : 'Grup lideri henüz oyun içi parti kodu girmedi.'}
                  </span>
                )
              ) : (
                <div className="space-y-0.5">
                  <span className="text-xs text-[#F5F5FA] font-medium flex items-center gap-1.5">
                    <Lock size={13} className="text-[#A855F7]" />
                    Lobi kodu gizlidir.
                  </span>
                  <p className="text-[11px] text-[#686E80]">
                    Kodu görebilmek için gruba başvurmalı ve grup lideri tarafından onaylanmalısınız.
                  </p>
                </div>
              )}
            </div>

            {canAccessCode && secureLobbyCode && (
              <button
                onClick={handleCopyCode}
                className="btn-primary text-xs py-2 px-4 shadow-none flex items-center gap-1.5 flex-shrink-0"
              >
                {copied ? <Check size={14} className="text-[#36D399]" /> : <Copy size={14} />}
                <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
              </button>
            )}
          </div>

          {/* Lider Tamamlama Butonu */}
          {isOwner && (
            <div className="flex items-center gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)] flex-wrap">
              <button
                onClick={handleCompleteGroup}
                disabled={actionLoading || group.status === 'completed'}
                className="btn-primary text-xs py-2 px-4"
              >
                <Award size={14} />
                <span>Oyunu Tamamlandı İşaretle & Takımı Puanla</span>
              </button>
            </div>
          )}
        </div>

        {/* 2 Kolon Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon: Kadro & Lidere Özel Başvuru Yönetim Paneli */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mevcut Kadro */}
            <div className="card-game p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#F5F5FA] font-mono mb-4 flex items-center gap-2">
                <Users size={16} className="text-[#A855F7]" />
                <span>Takım Kadrosu ({group.members.length} / {group.slots_total})</span>
              </h2>

              <div className="space-y-3">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#0E1018]/90 border border-[rgba(255,255,255,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white font-bold text-xs shadow-inner">
                        {member.user?.avatar_url ? (
                          <img src={member.user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (member.user?.username?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profil/${member.user_id}`}
                            className="text-xs font-bold text-[#F5F5FA] hover:text-[#A855F7] transition-colors"
                          >
                            {member.user?.username}
                          </Link>
                          {member.role === 'owner' ? (
                            <span className="badge-role text-[9px] py-0.5">Lider</span>
                          ) : (
                            <span className="badge-role bg-[#36D399]/10 text-[#36D399] border-[#36D399]/20 text-[9px] py-0.5">
                              Onaylandı
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          {member.user?.rank && (
                            <RankBadge rank={member.user.rank} size="xs" />
                          )}
                          {member.user && member.user.review_count > 0 ? (
                            <StarRating rating={member.user.avg_rating} reviewCount={member.user.review_count} size="xs" />
                          ) : (
                            <span className="text-[10px] text-[#686E80]">Yeni Üye</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isOwner && member.role !== 'owner' && (
                      <button
                        onClick={() => handleKickMember(member.user_id)}
                        className="p-2 rounded-lg text-[#686E80] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer"
                        title="Gruptan Çıkar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* LİDER YÖNETİM PANELİ: GELEN BAŞVURULARI İNCELEME & ONAYLAMA */}
            {isOwner && (
              <div className="card-game p-6 border-[#A855F7]/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#A855F7] font-mono flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span>Gelen Oyuncu Başvuruları ({applications.length})</span>
                  </h2>
                </div>

                {applications.length > 0 ? (
                  <div className="space-y-3.5">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white font-bold text-xs">
                              {(app.applicant?.username?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/profil/${app.applicant_id}`}
                                  className="text-xs font-bold text-[#F5F5FA] hover:text-[#A855F7]"
                                >
                                  {app.applicant?.username}
                                </Link>
                                {app.applicant && app.applicant.review_count > 0 ? (
                                  <StarRating rating={app.applicant.avg_rating} reviewCount={app.applicant.review_count} size="xs" />
                                ) : (
                                  <span className="text-[10px] text-[#686E80]">Henüz değerlendirme yok</span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#686E80] font-mono block">
                                Başvuru: {timeAgo(app.created_at)}
                              </span>
                            </div>
                          </div>

                          {/* Başvuran Oyuncunun Beyan Ettiği Nitelikler */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {app.applicant_rank && (
                              <RankBadge rank={app.applicant_rank} size="xs" />
                            )}
                            {app.applicant_primary_agent && (
                              <span className="badge-role">{app.applicant_primary_agent}</span>
                            )}
                            {app.applicant_role && (
                              <span className="badge-role bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20">
                                {app.applicant_role}
                              </span>
                            )}
                            {app.applicant_microphone !== null && (
                              <span className="text-[11px] text-[#686E80] flex items-center gap-1">
                                {app.applicant_microphone ? (
                                  <span className="text-[#36D399] flex items-center gap-1 font-medium">
                                    <Mic size={12} /> Mic
                                  </span>
                                ) : (
                                  <span className="text-[#686E80] flex items-center gap-1">
                                    <MicOff size={12} /> Yok
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {app.message && (
                          <p className="text-xs text-[#A1A6B5] italic bg-[#141722] p-2.5 rounded-lg border border-[rgba(255,255,255,0.04)]">
                            "{app.message}"
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[rgba(255,255,255,0.04)]">
                          <button
                            onClick={() => handleDecideApplication(app.id, 'accept')}
                            disabled={actionLoading || slotsLeft <= 0}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <CheckCircle2 size={13} />
                            <span>Kabul Et ve Kodu Göster</span>
                          </button>
                          <button
                            onClick={() => handleDecideApplication(app.id, 'reject')}
                            disabled={actionLoading}
                            className="btn-secondary text-xs py-1.5 px-3 hover:text-[#F87171]"
                          >
                            <XCircle size={13} />
                            <span>Reddet</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#686E80] italic text-center py-4">
                    Şu an bekleyen yeni bir katılım başvurusu bulunmuyor.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sağ Kolon: Katılma / Başvuru Formu & Grup Gereksinimleri */}
          <div className="space-y-6">
            {/* AÇIK GRUP: DOĞRUDAN KATILMA BUTONU */}
            {!isMember && !isOwner && group.status === 'active' && group.join_type === 'open' && (
              <div className="card-game p-6 space-y-4">
                <div className="border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <span className="badge-role bg-[#36D399]/15 text-[#36D399] border-[#36D399]/30 text-[10px] mb-1.5 inline-block font-mono">
                    Açık Lobi (Onaysız Giriş)
                  </span>
                  <h3 className="text-sm font-bold text-[#F5F5FA] font-heading">
                    Takıma Doğrudan Katıl
                  </h3>
                  <p className="text-xs text-[#A1A6B5] mt-0.5">
                    Bu grup açık katılımlıdır. Lider onayı beklemeden hemen takıma katılabilir ve parti kodunu görebilirsiniz.
                  </p>
                </div>

                <button
                  onClick={handleDirectJoin}
                  disabled={actionLoading || slotsLeft <= 0}
                  className="btn-primary w-full py-2.5 text-xs font-semibold justify-center"
                >
                  <Users size={14} />
                  <span>{actionLoading ? 'Katılınıyor...' : slotsLeft <= 0 ? 'Kontenjan Dolu' : 'Hemen Gruba Katıl ve Kodu Gör'}</span>
                </button>
              </div>
            )}

            {/* ONAYLI GRUP: BAŞVURU FORMU */}
            {!isMember && !isOwner && group.status === 'active' && group.join_type !== 'open' && (
              <div className="card-game p-6 space-y-4">
                <div className="border-b border-[rgba(255,255,255,0.06)] pb-3">
                  <h3 className="text-sm font-bold text-[#F5F5FA] font-heading">
                    Gruba Katılmak İçin Başvur
                  </h3>
                  <p className="text-xs text-[#A1A6B5] mt-0.5">
                    Lider özelliklerini inceledikten sonra onay verdiğinde oyun içi lobi koduna erişebilirsin.
                  </p>
                </div>

                <form onSubmit={handleSendApplication} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A6B5] block mb-1">
                      Mevcut Rankın
                    </label>
                    <select
                      value={applyRank}
                      onChange={(e) => setApplyRank(e.target.value)}
                      className="input-game text-xs"
                    >
                      {ALL_VALORANT_TIERS.map((tier) => (
                        <option key={tier} value={tier}>{tier}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#A1A6B5] block mb-1">
                        Oynayacağın Ajan
                      </label>
                      <select
                        value={applyPrimaryAgent}
                        onChange={(e) => setApplyPrimaryAgent(e.target.value)}
                        className="input-game text-xs"
                      >
                        {VALORANT_AGENTS.map((agent) => (
                          <option key={agent.id} value={agent.name}>{agent.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#A1A6B5] block mb-1">
                        Ajan Rolü
                      </label>
                      <select
                        value={applyRole}
                        onChange={(e) => setApplyRole(e.target.value)}
                        className="input-game text-xs"
                      >
                        {VALORANT_ROLES.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A6B5] block mb-1">
                      Mikrofon Durumu
                    </label>
                    <select
                      value={applyMic ? 'true' : 'false'}
                      onChange={(e) => setApplyMic(e.target.value === 'true')}
                      className="input-game text-xs"
                    >
                      <option value="true">Mikrofon kullanıyorum</option>
                      <option value="false">Mikrofon kullanmıyorum</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#A1A6B5] block mb-1">
                      Lidere Kısa Mesaj (İsteğe Bağlı)
                    </label>
                    <textarea
                      value={applyMsg}
                      onChange={(e) => setApplyMsg(e.target.value)}
                      placeholder="Örn: Smokes oynarım, commslarım temiz..."
                      className="input-game text-xs min-h-[70px] resize-none"
                      maxLength={180}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingApply || slotsLeft <= 0}
                    className="btn-primary w-full py-2.5 text-xs font-semibold justify-center"
                  >
                    <Send size={13} />
                    <span>{submittingApply ? 'İletiliyor...' : 'Lobiye Başvur'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Grup Gereksinimleri */}
            <div className="card-game p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono border-b border-[rgba(255,255,255,0.06)] pb-3">
                Liderin Aradığı Özellikler
              </h3>

              <div className="flex justify-between items-center text-[#A1A6B5] py-1 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-[#686E80]">Hedef Rank:</span>
                <span className="text-white font-medium">{group.min_rank} → {group.max_rank}</span>
              </div>

              {group.roles_wanted && group.roles_wanted.length > 0 && (
                <div className="py-1 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#686E80] block mb-1">Aranan Roller:</span>
                  <div className="flex flex-wrap gap-1">
                    {group.roles_wanted.map((r) => (
                      <span key={r} className="badge-role text-[10px]">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {group.agents_wanted && group.agents_wanted.length > 0 && (
                <div className="py-1 border-b border-[rgba(255,255,255,0.04)]">
                  <span className="text-[#686E80] block mb-1">Tercih Edilen Ajanlar:</span>
                  <div className="flex flex-wrap gap-1">
                    {group.agents_wanted.map((a) => (
                      <span key={a} className="badge-role bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20 text-[10px]">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-[#A1A6B5] py-1 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-[#686E80]">Mikrofon:</span>
                <span className="text-white font-medium">
                  {group.mic_required ? (
                    <span className="text-[#36D399] flex items-center gap-1">
                      <Mic size={13} />
                      Zorunlu
                    </span>
                  ) : (
                    <span className="text-[#686E80] flex items-center gap-1">
                      <MicOff size={13} />
                      İsteğe Bağlı
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#A1A6B5] py-1 border-b border-[rgba(255,255,255,0.04)]">
                <span className="text-[#686E80]">Sunucu:</span>
                <span className="text-white font-medium">{group.server_region?.toUpperCase()}</span>
              </div>

              {group.discord_username && (
                <div className="flex justify-between items-center text-[#A1A6B5] pt-1">
                  <span className="text-[#686E80]">Lider Discord:</span>
                  <span className="text-[#A855F7] font-mono font-medium">{group.discord_username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
