import type { Profile, Review, Group, ProfileClip } from '@/types/database'

export interface MissingProfileField {
  key: string
  label: string
  weight: number
  section: string
}

export interface ProfileCompletionResult {
  score: number // 0 - 100
  missingFields: MissingProfileField[]
  completedFieldsCount: number
  totalFieldsCount: number
}

/**
 * Profil tamamlama yüzdesini gerçek alanlara göre ağırlıklandırarak hesaplar.
 * Asla sabit yüzde döndürmez; başkaları baktığında gizli alanları ifşa etmez.
 */
export function calculateProfileCompletion(
  profile: Partial<Profile> | null | undefined,
  isOwner: boolean = false
): ProfileCompletionResult {
  if (!profile) {
    return { score: 0, missingFields: [], completedFieldsCount: 0, totalFieldsCount: 0 }
  }

  const checklist: { key: string; label: string; weight: number; isFilled: boolean; section: string }[] = [
    {
      key: 'avatar_url',
      label: 'Profil Fotoğrafı / Avatar',
      weight: 10,
      isFilled: !!profile.avatar_url,
      section: 'genel'
    },
    {
      key: 'riot_id',
      label: 'Riot ID & Etiket (#Tag)',
      weight: 15,
      isFilled: !!(profile.riot_id && profile.riot_tag),
      section: 'oyun'
    },
    {
      key: 'rank',
      label: 'Valorant Rekabetçi Rank',
      weight: 15,
      isFilled: !!profile.rank && profile.rank !== 'Demir 1',
      section: 'oyun'
    },
    {
      key: 'primary_agent',
      label: 'Birincil Tercih Ettiğin Ajan',
      weight: 15,
      isFilled: !!profile.primary_agent,
      section: 'ajan'
    },
    {
      key: 'secondary_agent',
      label: 'İkinci Tercih Ettiğin Ajan',
      weight: 10,
      isFilled: !!profile.secondary_agent,
      section: 'ajan'
    },
    {
      key: 'preferred_roles',
      label: 'Oynayabildiğin Roller',
      weight: 10,
      isFilled: Array.isArray(profile.preferred_roles) && profile.preferred_roles.length > 0,
      section: 'ajan'
    },
    {
      key: 'bio',
      label: 'Biyografi / Hakkında Yazısı',
      weight: 10,
      isFilled: !!(profile.bio && profile.bio.trim().length >= 10),
      section: 'genel'
    },
    {
      key: 'play_style',
      label: 'Oyun Tarzı ve Mikrofon Tercihi',
      weight: 10,
      isFilled: !!profile.play_style,
      section: 'genel'
    },
    {
      key: 'favorite_skins',
      label: 'Favori Silah Desenleri',
      weight: 5,
      isFilled: Array.isArray(profile.favorite_skins) && profile.favorite_skins.length > 0,
      section: 'desen'
    },
  ]

  let earnedScore = 0
  const missing: MissingProfileField[] = []
  let completedCount = 0

  checklist.forEach((item) => {
    if (item.isFilled) {
      earnedScore += item.weight
      completedCount++
    } else if (isOwner) {
      missing.push({
        key: item.key,
        label: item.label,
        weight: item.weight,
        section: item.section,
      })
    }
  })

  return {
    score: Math.min(100, earnedScore),
    missingFields: missing,
    completedFieldsCount: completedCount,
    totalFieldsCount: checklist.length,
  }
}

export interface EarnedBadge {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

/**
 * Kullanıcının hak ettiği rozetleri gerçek metrikler üzerinden hesaplar.
 */
export function calculateBadges(params: {
  profile: Partial<Profile> | null
  reviewsCount?: number
  avgRating?: number
  groupsCount?: number
  clipsCount?: number
}): EarnedBadge[] {
  const { profile, reviewsCount = 0, avgRating = 0, groupsCount = 0, clipsCount = 0 } = params
  if (!profile) return []

  const badges: EarnedBadge[] = []

  // 1. Topluluk Yıldızı (5+ onaylı inceleme ve 4.5+ puan)
  if (reviewsCount >= 5 && avgRating >= 4.5) {
    badges.push({
      id: 'community_star',
      title: 'Topluluk Yıldızı',
      description: '5+ maçı 4.5 ve üzeri yüksek güvenilirlikle tamamladı.',
      icon: '⭐',
      color: '#FBBF24',
    })
  }

  // 2. Kıdemli Lider (3+ oluşturulan ve tamamlanan grup)
  if (groupsCount >= 3) {
    badges.push({
      id: 'veteran_leader',
      title: 'Kıdemli Takım Lideri',
      description: '3 veya daha fazla başarılı takım lobisi kurdu.',
      icon: '🛡️',
      color: '#A855F7',
    })
  }

  // 3. Eksiksiz Profil (%100 tamamlanmış profil)
  const completion = calculateProfileCompletion(profile, false)
  if (completion.score >= 100) {
    badges.push({
      id: 'profile_master',
      title: 'Eksiksiz Oyuncu Kartı',
      description: 'Profilindeki tüm kimlik ve oyun bilgilerini eksiksiz doldurdu.',
      icon: '🎯',
      color: '#36D399',
    })
  }

  // 4. Klip Ustası (1+ vuruş klibi paylaşmış)
  if (clipsCount >= 1) {
    badges.push({
      id: 'clip_master',
      title: 'Klip Ustası',
      description: 'En iyi vuruşlarını toplulukla paylaştı.',
      icon: '🎬',
      color: '#EC4899',
    })
  }

  // 5. Çok Yönlü Oyuncu (3 veya daha fazla rol oynayabilen)
  if (profile.preferred_roles && profile.preferred_roles.length >= 3) {
    badges.push({
      id: 'flex_player',
      title: 'Çok Yönlü (Flex)',
      description: 'Takımın ihtiyacına göre en az 3 farklı rolde oynayabiliyor.',
      icon: '⚔️',
      color: '#38BDF8',
    })
  }

  return badges
}

/**
 * Klip video URL'ini güvenli iframe embed URL'ine dönüştürür.
 */
export function parseVideoEmbedUrl(rawUrl: string): { type: 'iframe' | 'video' | 'invalid'; src: string } {
  if (!rawUrl) return { type: 'invalid', src: '' }

  try {
    const url = new URL(rawUrl.trim())

    // YouTube
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      let videoId = ''
      if (url.hostname.includes('youtu.be')) {
        videoId = url.pathname.slice(1)
      } else if (url.pathname.includes('/shorts/')) {
        videoId = url.pathname.split('/shorts/')[1]
      } else {
        videoId = url.searchParams.get('v') || ''
      }

      if (videoId) {
        return {
          type: 'iframe',
          src: `https://www.youtube-nocookie.com/embed/${videoId.split('&')[0]}?rel=0`,
        }
      }
    }

    // Streamable
    if (url.hostname.includes('streamable.com')) {
      const code = url.pathname.slice(1)
      if (code) {
        return {
          type: 'iframe',
          src: `https://streamable.com/e/${code}`,
        }
      }
    }

    // Medal.tv
    if (url.hostname.includes('medal.tv')) {
      return {
        type: 'iframe',
        src: rawUrl,
      }
    }

    // Direct MP4/WebM video
    if (url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm')) {
      return {
        type: 'video',
        src: rawUrl,
      }
    }

    // Fallback safe link
    return {
      type: 'invalid',
      src: rawUrl,
    }
  } catch {
    return { type: 'invalid', src: '' }
  }
}
