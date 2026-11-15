import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        message,
        is_read,
        created_at,
        sender:profiles!sender_id (
          id, username, avatar_url, rank, riot_verified, riot_current_rr
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(150)

    if (error) {
      return NextResponse.json({ messages: [] })
    }

    // Mark unread messages received by current user as read
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)

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
    const { id: conversationId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 })
    }

    const body = await req.json()
    const { message, receiverId } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Mesaj boş bırakılamaz.' }, { status: 400 })
    }

    // If receiverId not provided, look up conversation
    let resolvedReceiverId = receiverId
    if (!resolvedReceiverId) {
      const { data: conv } = await supabase
        .from('direct_conversations')
        .select('user1_id, user2_id')
        .eq('id', conversationId)
        .single()

      if (conv) {
        resolvedReceiverId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
      }
    }

    if (!resolvedReceiverId) {
      return NextResponse.json({ error: 'Alıcı kullanıcı tespit edilemedi.' }, { status: 400 })
    }

    const trimmedMsg = message.trim().slice(0, 1000)

    // Insert direct message
    const { data: inserted, error: insertErr } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: resolvedReceiverId,
        message: trimmedMsg,
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        receiver_id,
        message,
        is_read,
        created_at,
        sender:profiles!sender_id (
          id, username, avatar_url, rank, riot_verified, riot_current_rr
        )
      `)
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // Update conversation last_message timestamp
    await supabase
      .from('direct_conversations')
      .update({
        last_message: trimmedMsg,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    return NextResponse.json({ success: true, message: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
