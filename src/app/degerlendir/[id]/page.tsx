import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RateClient from '@/components/review/RateClient'
import type { GroupWithDetails, Profile } from '@/types/database'

interface RatePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RatePage({ params }: RatePageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Session check - use getUser for security
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect(`/giris?redirect=/degerlendir/${id}`)
  }

  // 2. Current User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/giris')
  }

  // 3. Fetch Group with Members
  const { data: groupData, error } = await supabase
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
    .eq('id', id)
    .single()

  if (error || !groupData) {
    notFound()
  }

  const group = groupData as unknown as GroupWithDetails

  // 4. Grup tamamlandı mı kontrol et (tamamlanmamış gruplarda erken değerlendirme engeli)
  if (group.status !== 'completed') {
    redirect(`/grup/${id}`)
  }

  // 5. Verify user was actually in this group
  const isUserMember = group.members.some((m) => m.user_id === user.id)
  if (!isUserMember) {
    redirect(`/grup/${id}`)
  }

  // 6. Get teammates to rate (exclude current user)
  const teammates = group.members
    .filter((m) => m.user_id !== user.id && m.user)
    .map((m) => m.user) as Profile[]

  // 7. Check existing reviews from this user for this group
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('reviewee_id')
    .eq('group_id', id)
    .eq('reviewer_id', user.id)

  const existingMap: Record<string, boolean> = {}
  existingReviews?.forEach((r) => {
    existingMap[r.reviewee_id] = true
  })

  return (
    <RateClient
      group={group}
      currentUser={profile}
      teammatesToRate={teammates}
      existingRatings={existingMap}
    />
  )
}
