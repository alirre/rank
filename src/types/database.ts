export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  riot_id: string | null
  riot_tag: string | null
  rank: string | null // e.g. "Elmas 2"
  primary_agent: string | null // e.g. "Omen"
  secondary_agent: string | null // e.g. "Clove"
  preferred_roles: string[] | null // e.g. ["Kontrol Uzmanı", "Öncü"]
  country: string | null
  server_region: string | null
  play_style: string | null
  microphone: boolean
  avg_rating: number
  review_count: number
  is_admin: boolean
  is_suspended: boolean
  suspension_reason: string | null
  privacy_last_seen: boolean
  privacy_profile_public: boolean
  favorite_skins?: {
    id: string
    name: string
    weapon: string
    icon_url: string
    rarity?: string
  }[] | null
  availability_schedule?: {
    weekdays: string[]
    weekend: string[]
    timezone: string
  } | null
  privacy_show_clips?: boolean
  privacy_show_skins?: boolean
  usual_hours?: string[] | null
  riot_verified?: boolean
  riot_puuid?: string | null
  riot_current_tier?: number | null
  riot_current_rr?: number | null
  riot_peak_rank?: string | null
  riot_stats?: {
    kd: number
    win_rate: number
    top_agents: string[]
    matches_analyzed?: number
  } | null
  riot_last_updated?: string | null
  discord_voice_url?: string | null
  created_at: string
  last_seen_at: string | null
}

export interface Group {
  id: string
  owner_id: string
  game_id: string
  game_mode: string | null
  title: string
  description: string | null
  min_rank: string | null
  max_rank: string | null
  slots_total: number
  slots_filled: number
  roles_wanted: string[] | null
  agents_wanted: string[] | null
  mic_required: boolean
  server_region: string | null
  play_style: string | null
  join_type: 'open' | 'application'
  discord_username: string | null
  status: 'active' | 'full' | 'completed' | 'cancelled' | 'closed'
  created_at: string
  updated_at: string
  // Joins
  owner?: Profile
}

export interface GroupSecret {
  group_id: string
  lobby_code: string | null
  updated_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  user?: Profile
}

export interface GroupApplication {
  id: string
  group_id: string
  applicant_id: string
  applicant_rank: string | null
  applicant_primary_agent: string | null
  applicant_role: string | null
  applicant_microphone: boolean | null
  message: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
  updated_at: string
  // Joins
  applicant?: Profile
  group?: Group
}

export interface Review {
  id: string
  reviewer_id: string
  reviewee_id: string
  group_id: string
  rating: number
  comment: string | null
  tags: string[] | null
  is_valid: boolean
  created_at: string
  // Joins
  reviewer?: Profile
  reviewee?: Profile
  group?: Group
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Json | null
  is_read: boolean
  created_at: string
}

export interface UserReport {
  id: string
  reporter_id: string
  reported_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  created_at: string
}

export interface ProfileClip {
  id: string
  user_id: string
  title: string
  agent: string | null
  video_url: string
  thumbnail_url: string | null
  description: string | null
  is_featured: boolean
  views_count: number
  created_at: string
  updated_at: string
  user?: Profile
}

export interface UserFavorite {
  id: string
  user_id: string
  favorite_user_id: string
  created_at: string
  favorite_user?: Profile
}

export interface GroupWithDetails extends Group {
  owner: Profile
  game?: { id: string; name: string; slug: string; icon_url?: string }
  members: (GroupMember & { user: Profile })[]
}

export interface ProfileWithGames extends Profile {
  game_profiles?: {
    id: string
    user_id: string
    game_id: string
    in_game_name?: string
    in_game_id?: string
    rank?: string
    preferred_roles?: string[]
    game?: { id: string; name: string }
  }[]
}

export interface LobbyMessage {
  id: string
  group_id: string
  sender_id: string
  message: string
  message_type: 'user' | 'system' | 'discord_link'
  created_at: string
  sender?: Partial<Profile> | null
}

export interface DirectConversation {
  id: string
  user1_id: string
  user2_id: string
  last_message: string | null
  last_message_at: string
  created_at: string
  updated_at: string
  other_user?: Partial<Profile> | null
}

export interface DirectMessage {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  message: string
  is_read: boolean
  created_at: string
  sender?: Partial<Profile> | null
}

export interface MatchmakingQueueEntry {
  id: string
  user_id: string
  game_id: string
  rank_tier: string
  preferred_role: string | null
  mic_required: boolean
  server_region: string
  play_style: string
  status: 'searching' | 'matched' | 'cancelled'
  matched_group_id: string | null
  matched_user_id: string | null
  created_at: string
  updated_at: string
  user?: Profile
}

