import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/groups/[id]/lobby-code
// Güvenli sunucu kontrolü:
// Yalnızca giriş yapmış, grup sahibi veya kabul edilmiş grup üyelerine kodu döner!
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()

    // 1. Oturum kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Bu veriyi görüntülemek için giriş yapmalısınız.' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Grubun varlığı ve aktifliği
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('id, owner_id, status, join_type')
      .eq('id', groupId)
      .single()

    if (groupErr || !group) {
      return NextResponse.json({ error: 'Grup bulunamadı.' }, { status: 404 })
    }

    // Grup kapanmış veya iptal edilmişse kod sunulmaz
    if (group.status === 'cancelled' || group.status === 'closed') {
      return NextResponse.json(
        { error: 'Bu grup oturumu sona erdiği için lobi kodu artık kullanılamaz.' },
        { status: 403 }
      )
    }

    // 3. Yetki kontrolü: Lider mi?
    const isOwner = group.owner_id === userId

    // 4. Yetki kontrolü: Kabul edilmiş üye mi?
    let isMember = false
    if (!isOwner) {
      const { data: member } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle()

      if (member) {
        isMember = true
      }
    }

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: 'Lobi koduna yalnızca kabul edilmiş takım üyeleri erişebilir.' },
        { status: 403 }
      )
    }

    // 5. Kod çekimi: group_secrets tablosundan çek (güvenli RLS veya fallback)
    let lobbyCode: string | null = null

    const { data: secretData } = await supabase
      .from('group_secrets')
      .select('lobby_code')
      .eq('group_id', groupId)
      .maybeSingle()

    if (secretData?.lobby_code) {
      lobbyCode = secretData.lobby_code
    } else {
      // Geriye dönük uyumluluk kontrolü (migration öncesi veri için)
      const { data: fallbackGroup } = await supabase
        .from('groups')
        .select('lobby_code')
        .eq('id', groupId)
        .maybeSingle()
      lobbyCode = (fallbackGroup as any)?.lobby_code || null
    }

    // Yetki başarılı -> Lobi kodunu güvenle dön
    return NextResponse.json({
      lobby_code: lobbyCode,
      message: lobbyCode ? 'Kod başarıyla alındı.' : 'Lider henüz bir parti kodu girmedi.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    )
  }
}
