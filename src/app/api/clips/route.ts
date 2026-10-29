import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseVideoEmbedUrl } from '@/lib/profile-utils'

// GET clips for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı kimliği zorunludur.' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: clips, error } = await supabase
      .from('profile_clips')
      .select('*')
      .eq('user_id', userId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clips: clips || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 })
  }
}

// POST new clip
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const body = await req.json()
    const { title, agent, videoUrl, description, isFeatured } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Klip başlığı zorunludur.' }, { status: 400 })
    }

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
      return NextResponse.json({ error: 'Geçerli bir video bağlantısı girin.' }, { status: 400 })
    }

    // Video URL validation
    const parsed = parseVideoEmbedUrl(videoUrl.trim())
    if (parsed.type === 'invalid') {
      return NextResponse.json({
        error: 'Desteklenmeyen video formatı. Lütfen YouTube, Medal.tv veya Streamable linki girin.'
      }, { status: 400 })
    }

    // Check maximum clips limit (max 10 clips per user)
    const { count } = await supabase
      .from('profile_clips')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count || 0) >= 10) {
      return NextResponse.json({ error: 'En fazla 10 klip ekleyebilirsiniz.' }, { status: 400 })
    }

    // If marked featured, unfeature others
    if (isFeatured) {
      await supabase
        .from('profile_clips')
        .update({ is_featured: false })
        .eq('user_id', user.id)
    }

    const { data: clip, error: insertErr } = await supabase
      .from('profile_clips')
      .insert({
        user_id: user.id,
        title: title.trim().slice(0, 80),
        agent: agent ? String(agent).slice(0, 30) : null,
        video_url: videoUrl.trim(),
        description: description ? String(description).trim().slice(0, 200) : null,
        is_featured: !!isFeatured,
      })
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, clip })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Klip kaydedilemedi.' }, { status: 500 })
  }
}

// DELETE clip
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const clipId = searchParams.get('id')

    if (!clipId) {
      return NextResponse.json({ error: 'Klip kimliği eksik.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profile_clips')
      .delete()
      .eq('id', clipId)
      .eq('user_id', user.id) // Strict ownership check

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Klip silinemedi.' }, { status: 500 })
  }
}
