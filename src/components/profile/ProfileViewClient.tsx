'use client'

import { useState } from 'react'
import type { Profile, ProfileClip, Review } from '@/types/database'
import { calculateProfileCompletion, calculateBadges } from '@/lib/profile-utils'
import SkinShowcase from '@/components/profile/SkinShowcase'
import ClipGallery from '@/components/profile/ClipGallery'
import AddClipModal from '@/components/profile/AddClipModal'
import SkinSelectorModal from '@/components/profile/SkinSelectorModal'
import {
  Heart, Send, CheckCircle2, Award, Clock,
  Sparkles, ShieldCheck, Flame, Star
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ProfileViewClientProps {
  profile: Profile
  initialClips: ProfileClip[]
  initialIsFavorited: boolean
  isOwnProfile: boolean
  currentUserId?: string
  reviewsCount: number
  avgRating: number
  completedGroupsCount: number
}

export default function ProfileViewClient({
  profile,
  initialClips = [],
  initialIsFavorited = false,
  isOwnProfile = false,
  currentUserId,
  reviewsCount,
  avgRating,
  completedGroupsCount,
}: ProfileViewClientProps) {
  const router = useRouter()

  const [clips, setClips] = useState<ProfileClip[]>(initialClips)
  const [isFavorited, setIsFavorited] = useState<boolean>(initialIsFavorited)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [rematchLoading, setRematchLoading] = useState(false)
  const [addClipOpen, setAddClipOpen] = useState(false)
  const [skinModalOpen, setSkinModalOpen] = useState(false)
  const [favoriteSkins, setFavoriteSkins] = useState<any[]>(profile.favorite_skins || [])

  // Calculate live completion and badges
  const completion = calculateProfileCompletion(profile, isOwnProfile)
  const badges = calculateBadges({
    profile,
    reviewsCount,
    avgRating,
    groupsCount: completedGroupsCount,
    clipsCount: clips.length,
  })

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      toast.error('Favorilere eklemek için giriş yapmalısınız.')
      router.push('/giris')
      return
    }

    setFavoriteLoading(true)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız')

      setIsFavorited(data.isFavorited)
      toast.success(data.message)
    } catch (err: any) {
      toast.error(err.message || 'Favori güncellenemedi.')
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Send Rematch Invitation
  const handleSendRematch = async () => {
    if (!currentUserId) {
      toast.error('Davet göndermek için giriş yapmalısınız.')
      router.push('/giris')
      return
    }

    setRematchLoading(true)
    try {
      const res = await fetch('/api/rematch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: profile.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Davet gönderilemedi')

      toast.success(data.message || 'Tekrar oynama daveti iletildi!')
    } catch (err: any) {
      toast.error(err.message || 'Davet gönderilemedi.')
    } finally {
      setRematchLoading(false)
    }
  }

  // Refresh clips after add/delete
  const refreshClips = async () => {
    try {
      const res = await fetch(`/api/clips?userId=${profile.id}`)
      const data = await res.json()
      if (data.clips) {
        setClips(data.clips)
      }
    } catch (e) {
      console.error('Failed to reload clips:', e)
    }
  }

  // Save skins directly from modal
  const handleSaveSkins = async (updatedSkins: any[]) => {
    try {
      setFavoriteSkins(updatedSkins)
      const res = await fetch('/api/profile/skins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skins: updatedSkins }),
      })
      if (!res.ok) {
        // Fallback: router refresh
        router.refresh()
      }
      toast.success('Silah vitrinin güncellendi!')
    } catch (e) {
      toast.error('Desenler kaydedilemedi.')
    }
  }

  const hourLabels: Record<string, string> = {
    morning: 'Sabah (09:00 - 12:00)',
    afternoon: 'Öğle (12:00 - 18:00)',
    evening: 'Akşam (18:00 - 00:00)',
    night: 'Gece (00:00 - 04:00)',
  }

  return (
    <div className="space-y-8">
      {/* Action Buttons for visitors */}
      {!isOwnProfile && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className={`btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              isFavorited
                ? 'border-[#EC4899] text-[#EC4899] bg-[#EC4899]/10'
                : 'hover:border-[#EC4899]/40'
            }`}
          >
            <Heart size={14} className={isFavorited ? 'fill-[#EC4899]' : ''} />
            <span>{isFavorited ? 'Favorilerinde' : 'Favorilere Ekle'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendRematch}
            disabled={rematchLoading}
            className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            title="Daha önce birlikte oynadığın bu oyuncuya maç daveti gönder"
          >
            <Send size={14} />
            <span>{rematchLoading ? 'İletiliyor...' : 'Tekrar Oynayalım'}</span>
          </button>
        </div>
      )}

      {/* Profil Tamamlama Çubuğu */}
      <div className="card-game p-5 bg-[#141722] border border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#36D399]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono">
              Profil Doluluk Oranı
            </span>
          </div>
          <span className="text-sm font-extrabold text-[#36D399] font-mono tabular-numbers">
            %{completion.score}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#0E1018] overflow-hidden border border-[rgba(255,255,255,0.04)]">
          <div
            className="h-full bg-gradient-to-r from-[#A855F7] to-[#36D399] rounded-full transition-all duration-300"
            style={{ width: `${completion.score}%` }}
          />
        </div>
      </div>

      {/* Kazanılan Rozetler */}
      {badges.length > 0 && (
        <div className="card-game p-5 space-y-3 bg-[#141722]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
            <Award size={15} className="text-[#FBBF24]" />
            <span>Kazanılan Rozetler ({badges.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="p-3 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-start gap-2.5"
              >
                <span className="text-xl leading-none">{badge.icon}</span>
                <div>
                  <span className="text-xs font-bold text-[#F5F5FA] block leading-tight">
                    {badge.title}
                  </span>
                  <span className="text-[10px] text-[#A1A6B5] block mt-0.5 leading-snug">
                    {badge.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Silah Vitrini */}
      {(profile.privacy_show_skins ?? true) && (
        <SkinShowcase
          skins={favoriteSkins}
          isOwner={isOwnProfile}
          onEditClick={() => setSkinModalOpen(true)}
        />
      )}

      {/* Müsaitlik Saatleri */}
      {profile.usual_hours && profile.usual_hours.length > 0 && (
        <div className="card-game p-5 space-y-3 bg-[#141722]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] font-mono flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] pb-3">
            <Clock size={15} className="text-[#38BDF8]" />
            <span>Aktif Olduğu Saatler</span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {profile.usual_hours.map((hour) => (
              <span
                key={hour}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0E1018] border border-[rgba(255,255,255,0.08)] text-[#F5F5FA] flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#36D399]" />
                {hourLabels[hour] || hour}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* En İyi Vuruşlarım / Klip Galerisi */}
      {(profile.privacy_show_clips ?? true) && (
        <ClipGallery
          clips={clips}
          isOwner={isOwnProfile}
          onAddClipClick={() => setAddClipOpen(true)}
          onClipDeleted={refreshClips}
        />
      )}

      {/* Klip Ekleme Modalı */}
      <AddClipModal
        isOpen={addClipOpen}
        onClose={() => setAddClipOpen(false)}
        onSuccess={refreshClips}
      />

      {/* Silah Seçim Modalı */}
      {isOwnProfile && (
        <SkinSelectorModal
          isOpen={skinModalOpen}
          onClose={() => setSkinModalOpen(false)}
          selectedSkins={favoriteSkins}
          onSave={handleSaveSkins}
        />
      )}
    </div>
  )
}
