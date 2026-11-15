import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALL_VALORANT_TIERS } from '@/lib/constants'

// Helper to determine rank tier proximity (within 3 tiers)
function areTiersCompatible(tierA: string, tierB: string): boolean {
  const indexA = ALL_VALORANT_TIERS.indexOf(tierA)
  const indexB = ALL_VALORANT_TIERS.indexOf(tierB)
  if (indexA === -1 || indexB === -1) return true
  return Math.abs(indexA - indexB) <= 3
}

// GET: Check queue status of current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 })
    }

    const { data: entry } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'matched')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (entry && entry.matched_group_id) {
      return NextResponse.json({
        status: 'matched',
        groupId: entry.matched_group_id,
        matchedUserId: entry.matched_user_id,
      })
    }

    return NextResponse.json({ status: 'searching' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Join queue and look for instant match
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Eşleşme kuyruğuna girmek için giriş yapmalısınız.' }, { status: 401 })
    }

    const body = await req.json()
    const {
      gameId = 'valorant',
      rankTier = 'Platin 1',
      preferredRole = null,
      micRequired = true,
      serverRegion = 'tr',
      playStyle = 'serious',
    } = body

    // 1. Fetch current active searchers in queue (excluding self)
    const { data: searchers } = await supabase
      .from('matchmaking_queue')
      .select(`
        id,
        user_id,
        rank_tier,
        preferred_role,
        mic_required,
        server_region,
        user:profiles!user_id (id, username, rank, riot_verified)
      `)
      .eq('game_id', gameId)
      .eq('status', 'searching')
      .neq('user_id', user.id)
      .order('created_at', { ascending: true })

    // Find compatible opponent
    const partner = (searchers || []).find((s: any) =>
      areTiersCompatible(s.rank_tier, rankTier) &&
      (!micRequired || s.mic_required)
    )

    // 2. If partner found, create instant Duo Lobby!
    if (partner) {
      const groupTitle = `Hızlı Duo: ${rankTier} Rekabetçi`

      // Create Group
      const { data: newGroup, error: groupErr } = await supabase
        .from('groups')
        .insert({
          owner_id: user.id,
          game_id: gameId,
          game_mode: 'Rekabetçi',
          title: groupTitle,
          description: 'Hemen Duo Bul algoritması tarafından otomatik oluşturulan hızlı eşleşme lobisi.',
          min_rank: rankTier,
          max_rank: partner.rank_tier,
          slots_total: 2,
          slots_filled: 2,
          mic_required: micRequired,
          server_region: serverRegion,
          play_style: playStyle,
          join_type: 'open',
          status: 'full',
        })
        .select('id')
        .single()

      if (!groupErr && newGroup) {
        // Add both members
        await supabase.from('group_members').insert([
          { group_id: newGroup.id, user_id: user.id, role: 'owner' },
          { group_id: newGroup.id, user_id: partner.user_id, role: 'member' },
        ])

        // Update partner's queue entry
        await supabase
          .from('matchmaking_queue')
          .update({
            status: 'matched',
            matched_group_id: newGroup.id,
            matched_user_id: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)

        // Delete self from queue if exists
        await supabase.from('matchmaking_queue').delete().eq('user_id', user.id)

        // Insert welcoming lobby message
        await supabase.from('lobby_messages').insert({
          group_id: newGroup.id,
          sender_id: user.id,
          message: '⚡ DuoRank Hızlı Eşleşme tamamlandı! Lobiye hoş geldiniz. Oyun içi parti kodunu paylaşabilirsiniz.',
          message_type: 'system',
        })

        return NextResponse.json({
          matched: true,
          groupId: newGroup.id,
          partner: partner.user,
        })
      }
    }

    // 3. No instant match, insert or update self in queue
    await supabase.from('matchmaking_queue').upsert({
      user_id: user.id,
      game_id: gameId,
      rank_tier: rankTier,
      preferred_role: preferredRole,
      mic_required: micRequired,
      server_region: serverRegion,
      play_style: playStyle,
      status: 'searching',
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ matched: false, status: 'searching' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE: Cancel matchmaking search
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
