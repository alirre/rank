import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const body = await req.json()
    const { targetUserId } = body

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json({ error: 'Geçersiz hedef oyuncu.' }, { status: 400 })
    }

    // Doğrulama: Bu iki oyuncu daha önce aynı grupta bulunmuş mu?
    const { data: sharedGroup } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    const groupIds = (sharedGroup || []).map((g) => g.group_id)

    let hasPlayedTogether = false
    if (groupIds.length > 0) {
      const { data: targetInSameGroup } = await supabase
        .from('group_members')
        .select('id')
        .in('group_id', groupIds)
        .eq('user_id', targetUserId)
        .limit(1)

      if (targetInSameGroup && targetInSameGroup.length > 0) {
        hasPlayedTogether = true
      }
    }

    if (!hasPlayedTogether) {
      return NextResponse.json({
        error: 'Tekrar oynama daveti yalnızca daha önce birlikte maç yaptığınız oyunculara gönderilebilir.'
      }, { status: 403 })
    }

    // Gönderici profil bilgisi
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.username || 'Bir takım arkadaşın'

    // Bildirim gönder
    const { error: notifErr } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: 'rematch_request',
        title: 'Tekrar Oynama Daveti 🎯',
        message: `${senderName} seninle tekrar maça girmek istiyor!`,
        data: { sender_id: user.id },
      })

    if (notifErr) {
      return NextResponse.json({ error: notifErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Tekrar oynama daveti iletildi!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Davet gönderilemedi.' }, { status: 500 })
  }
}
