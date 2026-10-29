import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/groups/[id]/join
// Açık lobilere (join_type === 'open') anında ve güvenli katılma uç noktası
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const supabase = await createClient()

    // 1. Oturum kontrolü - getUser kullan (daha güvenli)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Gruba katılmak için giriş yapmalısınız.' },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Grubu sorgula
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('id, owner_id, title, status, join_type, slots_total, slots_filled')
      .eq('id', groupId)
      .single()

    if (groupErr || !group) {
      return NextResponse.json({ error: 'Grup bulunamadı.' }, { status: 404 })
    }

    if (group.status !== 'active') {
      return NextResponse.json(
        { error: 'Bu lobi şu anda yeni oyuncu alımına kapalıdır.' },
        { status: 400 }
      )
    }

    if (group.join_type !== 'open') {
      return NextResponse.json(
        { error: 'Bu grup onaylı katılımdır. Lütfen başvuru formu gönderin.' },
        { status: 400 }
      )
    }

    if (group.owner_id === userId) {
      return NextResponse.json(
        { error: 'Kendi oluşturduğunuz gruba katılamazsınız.' },
        { status: 400 }
      )
    }

    // 3. Kullanıcı zaten grupta mı?
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Zaten bu grubun üyesisiniz.' },
        { status: 400 }
      )
    }

    // 4. Gerçek kontenjan kontrolü
    const { count: actualMemberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    const currentCount = actualMemberCount || 0
    if (currentCount >= group.slots_total) {
      return NextResponse.json(
        { error: 'Grup kontenjanı dolduğu için katılamazsınız.' },
        { status: 400 }
      )
    }

    // 5. Üye listesine ekle
    const { error: insertErr } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      })

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message || 'Gruba katılırken hata oluştu.' },
        { status: 500 }
      )
    }

    // 6. Doluluk durumunu güncelle
    const newFilled = currentCount + 1
    const isNowFull = newFilled >= group.slots_total

    await supabase
      .from('groups')
      .update({
        slots_filled: newFilled,
        status: isNowFull ? 'full' : 'active',
      })
      .eq('id', groupId)

    // 7. Lidere bildirim yolla
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    const joinerName = userProfile?.username || 'Bir oyuncu'

    await supabase.from('notifications').insert({
      user_id: group.owner_id,
      type: 'member_joined',
      title: 'Takımına Yeni Oyuncu Katıldı! 🎉',
      message: `${joinerName} açık olan "${group.title}" lobine katıldı.`,
      data: { group_id: groupId },
    })

    return NextResponse.json({
      success: true,
      message: 'Gruba başarıyla katıldınız!',
      isFull: isNowFull,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    )
  }
}
