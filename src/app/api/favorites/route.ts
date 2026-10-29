import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isFavorited: false })
    }

    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'Kullanıcı kimliği eksik' }, { status: 400 })
    }

    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('favorite_user_id', targetUserId)
      .maybeSingle()

    return NextResponse.json({ isFavorited: !!data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Geçersiz hedef kullanıcı.' }, { status: 400 })
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('favorite_user_id', targetUserId)
      .maybeSingle()

    if (existing) {
      // Remove from favorites
      await supabase
        .from('user_favorites')
        .delete()
        .eq('id', existing.id)

      return NextResponse.json({ isFavorited: false, message: 'Favorilerden çıkarıldı.' })
    } else {
      // Add to favorites
      await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          favorite_user_id: targetUserId,
        })

      return NextResponse.json({ isFavorited: true, message: 'Favorilere eklendi.' })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'İşlem başarısız.' }, { status: 500 })
  }
}
