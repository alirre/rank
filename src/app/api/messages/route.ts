import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: List all direct conversations for current user
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from('direct_conversations')
      .select(`
        id,
        user1_id,
        user2_id,
        last_message,
        last_message_at,
        created_at,
        updated_at,
        user1:profiles!user1_id (
          id, username, display_name, avatar_url, rank, riot_verified, riot_current_rr
        ),
        user2:profiles!user2_id (
          id, username, display_name, avatar_url, rank, riot_verified, riot_current_rr
        )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    if (error) {
      // In case table is not yet created, return empty list gracefully
      return NextResponse.json({ conversations: [] })
    }

    // Map other user into a convenient field
    const formatted = (conversations || []).map((c: any) => {
      const otherUser = c.user1_id === user.id ? c.user2 : c.user1
      return {
        ...c,
        other_user: otherUser,
      }
    })

    return NextResponse.json({ conversations: formatted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Start or retrieve an existing conversation with a target user
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 })
    }

    const body = await req.json()
    const { targetUserId } = body

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: 'Geçersiz hedef kullanıcı.' }, { status: 400 })
    }

    // Check if conversation already exists (either user1/user2 order)
    const { data: existing } = await supabase
      .from('direct_conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ conversationId: existing.id })
    }

    // Create new conversation
    const { data: created, error: createErr } = await supabase
      .from('direct_conversations')
      .insert({
        user1_id: user.id,
        user2_id: targetUserId,
        last_message: null,
      })
      .select('id')
      .single()

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    return NextResponse.json({ conversationId: created.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
