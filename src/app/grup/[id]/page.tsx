import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GroupDetailClient from '@/components/group/GroupDetailClient'
import type { GroupWithDetails, GroupApplication, Profile } from '@/types/database'

interface GroupPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function GroupDetailPage({ params }: GroupPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch current session
  const { data: { user } } = await supabase.auth.getUser()
  let currentUser: Profile | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    currentUser = profile
  }

  // 2. Fetch Group Details (Lobi kodu asla genel sayfaya dahil edilmez!)
  const { data: groupData, error: groupError } = await supabase
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

  if (groupError || !groupData) {
    notFound()
  }

  // Güvenlik: Her ihtimale karşı hassas veriyi temizle
  if ('lobby_code' in groupData) {
    delete (groupData as any).lobby_code
  }

  const group = groupData as unknown as GroupWithDetails

  // 3. Check membership & ownership
  const isOwner = currentUser?.id === group.owner_id
  const isMember = group.members.some((m) => m.user_id === currentUser?.id)

  // 4. Fetch pending applications if owner
  let applications: GroupApplication[] = []
  if (isOwner) {
    const { data: appData } = await supabase
      .from('group_applications')
      .select(`
        *,
        applicant:profiles(*)
      `)
      .eq('group_id', id)
      .eq('status', 'pending')

    applications = (appData || []) as unknown as GroupApplication[]
  }

  return (
    <GroupDetailClient
      initialGroup={group}
      currentUser={currentUser}
      initialApplications={applications}
      isMember={isMember}
      isOwner={isOwner}
    />
  )
}
