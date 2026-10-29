'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import StarRating from '@/components/ui/StarRating'
import { REVIEW_TAGS_POSITIVE, REVIEW_TAGS_NEGATIVE } from '@/lib/constants'
import type { GroupWithDetails, Profile } from '@/types/database'
import { Award, CheckCircle2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface RateClientProps {
  group: GroupWithDetails
  currentUser: Profile
  teammatesToRate: Profile[]
  existingRatings: Record<string, boolean>
}

export default function RateClient({
  group,
  currentUser,
  teammatesToRate,
  existingRatings,
}: RateClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(
    teammatesToRate.find((p) => !existingRatings[p.id]) || null
  )

  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [ratedMap, setRatedMap] = useState<Record<string, boolean>>(existingRatings)

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName))
    } else {
      setSelectedTags([...selectedTags, tagName])
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlayer) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewee_id: selectedPlayer.id,
          group_id: group.id,
          rating,
          comment: comment.trim() || null,
          tags: selectedTags,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Değerlendirme kaydedilemedi.')
      }

      toast.success(`${selectedPlayer.username} değerlendirildi!`)

      const updatedRated = { ...ratedMap, [selectedPlayer.id]: true }
      setRatedMap(updatedRated)

      setComment('')
      setSelectedTags([])
      setRating(5)

      const nextPlayer = teammatesToRate.find((p) => !updatedRated[p.id])
      setSelectedPlayer(nextPlayer || null)
    } catch (err: any) {
      toast.error(err.message || 'Değerlendirme kaydedilemedi.')
    } finally {
      setSubmitting(false)
    }
  }

  const allDone = teammatesToRate.length > 0 && teammatesToRate.every((p) => ratedMap[p.id])

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] uppercase tracking-wider mb-1 font-mono">
            <Award size={14} />
            <span>GÜVENİLİRLİK DEĞERLENDİRMESİ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
            Takım nasıldı?
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A6B5] mt-1">
            Birlikte oynadığın oyuncuları değerlendirerek topluluğu daha güvenilir hâle getir.
          </p>
        </div>

        {allDone ? (
          <div className="card-game p-14 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#36D399]/15 text-[#36D399] flex items-center justify-center mx-auto border border-[#36D399]/30">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-white font-heading">
              Tüm Oyuncular Puanlandı!
            </h2>
            <p className="text-xs text-[#A1A6B5] leading-relaxed">
              Bu lobiye katılan tüm takım arkadaşlarını puanladınız. Değerlendirmeleriniz oyuncuların profillerine ve platform güvenilirlik skoruna yansıtıldı.
            </p>
            <div className="pt-3 flex justify-center gap-3">
              <Link href={`/grup/${group.id}`} className="btn-secondary text-xs py-2 px-4">
                Gruba Dön
              </Link>
              <Link href="/gruplar" className="btn-primary text-xs py-2 px-4">
                Yeni Lobi Bul
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Sol: Takım Arkadaşları Listesi */}
            <div className="md:col-span-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686E80] block font-mono">
                Değerlendirilecek Oyuncular
              </span>

              {teammatesToRate.map((teammate) => {
                const isRated = ratedMap[teammate.id]
                const isSelected = selectedPlayer?.id === teammate.id

                return (
                  <button
                    key={teammate.id}
                    onClick={() => !isRated && setSelectedPlayer(teammate)}
                    disabled={isRated}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#191D2A] border-[#A855F7] shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]'
                        : isRated
                        ? 'bg-[#0E1018]/50 border-[rgba(255,255,255,0.04)] opacity-50 cursor-not-allowed'
                        : 'bg-[#141722] border-[rgba(255,255,255,0.08)] hover:border-[#A855F7]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white font-bold text-xs">
                        {(teammate.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#F5F5FA] block">
                          {teammate.username}
                        </span>
                        <span className="text-[10px] text-[#686E80]">
                          {teammate.review_count > 0 ? `★ ${teammate.avg_rating.toFixed(1)}` : 'Yeni Üye'}
                        </span>
                      </div>
                    </div>

                    {isRated ? (
                      <span className="text-[10px] text-[#36D399] font-medium font-mono">
                        Tamamlandı ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#A855F7] font-semibold">Puanla →</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Sağ: Puanlama Modal / Form Kartı */}
            <div className="md:col-span-8">
              {selectedPlayer ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="card-game p-6 sm:p-8 space-y-6 bg-[#141722]"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)]">
                    <div>
                      <span className="text-[10px] text-[#686E80] uppercase tracking-wider font-mono">
                        OYUNCU DEĞERLENDİRİLİYOR
                      </span>
                      <h3 className="text-lg font-bold text-white font-heading">
                        {selectedPlayer.username}
                      </h3>
                    </div>
                  </div>

                  {/* 1. Yıldız Puanı */}
                  <div>
                    <label className="text-xs font-semibold text-[#A1A6B5] block mb-2 font-mono uppercase tracking-wider">
                      1. Yıldız Puanı Seç (1 - 5)
                    </label>
                    <div className="p-4 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                      <StarRating
                        rating={rating}
                        interactive
                        size="lg"
                        onRate={(val) => setRating(val)}
                      />
                    </div>
                  </div>

                  {/* 2. Davranış Etiketleri */}
                  <div>
                    <label className="text-xs font-semibold text-[#A1A6B5] block mb-2 font-mono uppercase tracking-wider">
                      2. Davranış Etiketleri
                    </label>

                    {/* Olumlu Etiketler */}
                    <div className="mb-3">
                      <span className="text-[10px] font-bold text-[#36D399] uppercase tracking-wider block mb-2 font-mono">
                        Olumlu Davranışlar
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {REVIEW_TAGS_POSITIVE.map((t) => {
                          const active = selectedTags.includes(t.name)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTag(t.name)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#36D399]/20 border-[#36D399] text-[#36D399]'
                                  : 'bg-[#0E1018] border-[rgba(255,255,255,0.06)] text-[#A1A6B5] hover:border-[rgba(255,255,255,0.15)]'
                              }`}
                            >
                              {t.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Olumsuz Etiketler */}
                    <div>
                      <span className="text-[10px] font-bold text-[#F87171] uppercase tracking-wider block mb-2 font-mono">
                        Olumsuz Davranışlar
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {REVIEW_TAGS_NEGATIVE.map((t) => {
                          const active = selectedTags.includes(t.name)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => toggleTag(t.name)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                active
                                  ? 'bg-[#F87171]/20 border-[#F87171] text-[#F87171]'
                                  : 'bg-[#0E1018] border-[rgba(255,255,255,0.06)] text-[#A1A6B5] hover:border-[rgba(255,255,255,0.15)]'
                              }`}
                            >
                              {t.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 3. Yorum */}
                  <div>
                    <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5 font-mono uppercase tracking-wider">
                      3. Kısa Yorum (İsteğe Bağlı)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Oyuncunun iletişimi, oyun bilgisi veya takım uyumu hakkında..."
                      className="input-game text-xs min-h-[85px] resize-none"
                      maxLength={250}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-3 text-xs font-semibold"
                  >
                    {submitting ? 'Kaydediliyor...' : 'Değerlendirmeyi Gönder'}
                    <ArrowRight size={14} />
                  </button>
                </form>
              ) : (
                <div className="card-game p-16 text-center text-[#686E80]">
                  Sol taraftan puanlamak istediğiniz takım arkadaşını seçin.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
