import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()

    const { data: messages, error } = await supabase
      .from('lobby_messages')
      .select(`
        id,
        group_id,
        sender_id,
        message,
        message_type,
        created_at,
        sender:profiles!sender_id (
          id,
          username,
          avatar_url,
          rank,
          riot_verified,
          riot_current_rr
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      // In case table is not migrated yet in Supabase, return empty array
      return NextResponse.json({ messages: [] })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Mesaj göndermek için giriş yapmalısınız.' }, { status: 401 })
    }

    const body = await req.json()
    const { message, messageType = 'user' } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Mesaj boş bırakılamaz.' }, { status: 400 })
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('lobby_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        message: message.trim().slice(0, 500),
        message_type: messageType,
      })
      .select(`
        id,
        group_id,
        sender_id,
        message,
        message_type,
        created_at,
        sender:profiles!sender_id (
          id,
          username,
          avatar_url,
          rank,
          riot_verified,
          riot_current_rr
        )
      `)
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
