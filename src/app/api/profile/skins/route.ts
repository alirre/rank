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
    const { skins } = body

    if (!Array.isArray(skins)) {
      return NextResponse.json({ error: 'Geçersiz veri formatı.' }, { status: 400 })
    }

    // Max 8 skins allowed
    const validSkins = skins.slice(0, 8)

    const { error } = await supabase
      .from('profiles')
      .update({
        favorite_skins: validSkins,
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, skins: validSkins })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Kaydedilemedi.' }, { status: 500 })
  }
}
