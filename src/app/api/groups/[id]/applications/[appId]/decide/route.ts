import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/groups/[id]/applications/[appId]/decide
// Güvenli atomik lider onay/red akışı ve son kontenjan kontrolü
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  try {
    const { id: groupId, appId } = await params
    const body = await request.json()
    const { action } = body // 'accept' or 'reject'

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Session check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Giriş yapmalısınız.' }, { status: 401 })
    }

    const currentUserId = user.id

    // 2. Fetch Group & Verify Owner
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('id, owner_id, title, slots_total, slots_filled, status')
      .eq('id', groupId)
      .single()

    if (groupErr || !group) {
      return NextResponse.json({ error: 'Grup bulunamadı.' }, { status: 404 })
    }

    if (group.owner_id !== currentUserId) {
      return NextResponse.json({ error: 'Yalnızca grup lideri başvuruları yönetebilir.' }, { status: 403 })
    }

    // 3. Fetch Application
    const { data: application, error: appErr } = await supabase
      .from('group_applications')
      .select('id, applicant_id, status')
      .eq('id', appId)
      .eq('group_id', groupId)
      .single()

    if (appErr || !application) {
      return NextResponse.json({ error: 'Başvuru bulunamadı.' }, { status: 404 })
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Bu başvuru daha önce sonuçlandırılmış.' }, { status: 400 })
    }

    // REDDETME İŞLEMİ
    if (action === 'reject') {
      await supabase
        .from('group_applications')
        .update({ status: 'rejected' })
        .eq('id', appId)

      // Başvurana nazik bildirim
      await supabase.from('notifications').insert({
        user_id: application.applicant_id,
        type: 'application_rejected',
        title: 'Başvuru Durumu',
        message: `"${group.title}" grubuna yaptığınız başvuru lider tarafından onaylanmadı. Başka açık lobilere göz atabilirsiniz.`,
        data: { group_id: groupId },
      })

      return NextResponse.json({ success: true, message: 'Başvuru reddedildi.' })
    }

    // KABUL ETME İŞLEMİ: Kontenjan Kontrolü
    const { count: currentMemberCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    const actualMembers = currentMemberCount || 0
    if (actualMembers >= group.slots_total) {
      return NextResponse.json(
        { error: 'Grup kontenjanı dolduğu için yeni oyuncu kabul edilemez.' },
        { status: 400 }
      )
    }

    // A. Başvuruyu kabul et
    await supabase
      .from('group_applications')
      .update({ status: 'accepted' })
      .eq('id', appId)

    // B. Üye listesine ekle
    await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: application.applicant_id,
        role: 'member',
      })

    // C. Doluluk durumunu güncelle
    const newFilledCount = actualMembers + 1
    const isNowFull = newFilledCount >= group.slots_total

    await supabase
      .from('groups')
      .update({
        slots_filled: newFilledCount,
        status: isNowFull ? 'full' : 'active',
      })
      .eq('id', groupId)

    // D. Kabul edilen oyuncuya bildirim gönder
    await supabase.from('notifications').insert({
      user_id: application.applicant_id,
      type: 'application_accepted',
      title: 'Başvurun Kabul Edildi! 🎉',
      message: `Tebrikler! "${group.title}" grubuna katıldın. Artık oyun içi parti kodunu görebilirsin.`,
      data: { group_id: groupId },
    })

    return NextResponse.json({
      success: true,
      message: 'Oyuncu başarıyla gruba alındı.',
      isFull: isNowFull,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sunucu hatası oluştu.' }, { status: 500 })
  }
}
