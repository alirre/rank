import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/reviews
// Güvenli sunucu tarafı oyuncu değerlendirme uç noktası
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Oturum kontrolü - getUser kullan (daha güvenli)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Değerlendirme yapmak için giriş yapmalısınız.' },
        { status: 401 }
      )
    }

    const reviewerId = user.id
    const body = await request.json()
    const { reviewee_id, group_id, rating, comment, tags } = body

    // 2. Girdi doğrulamaları
    if (!reviewee_id || !group_id || typeof rating !== 'number') {
      return NextResponse.json(
        { error: 'Eksik veya geçersiz değerlendirme verisi.' },
        { status: 400 }
      )
    }

    if (reviewerId === reviewee_id) {
      return NextResponse.json(
        { error: 'Kendi kendinizi değerlendiremezsiniz.' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Puan 1 ile 5 arasında bir tam sayı olmalıdır.' },
        { status: 400 }
      )
    }

    // 3. Grubun durumu kontrolü
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('id, title, status')
      .eq('id', group_id)
      .single()

    if (groupErr || !group) {
      return NextResponse.json(
        { error: 'Değerlendirilen oturum/grup bulunamadı.' },
        { status: 404 }
      )
    }

    if (group.status !== 'completed') {
      return NextResponse.json(
        { error: 'Yalnızca tamamlanmış oyun oturumları için değerlendirme yapılabilir.' },
        { status: 400 }
      )
    }

    // 4. Oturuma katılım kontrolü: Hem değerlendiren hem değerlendirilen bu grupta olmalı
    const { data: members, error: memberErr } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', group_id)
      .in('user_id', [reviewerId, reviewee_id])

    if (memberErr || !members || members.length < 2) {
      return NextResponse.json(
        { error: 'Yalnızca aynı oyun oturumunda yer alan takım arkadaşları birbirini değerlendirebilir.' },
        { status: 403 }
      )
    }

    // 5. Mükerrer değerlendirme kontrolü
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewerId)
      .eq('reviewee_id', reviewee_id)
      .eq('group_id', group_id)
      .maybeSingle()

    if (existingReview) {
      return NextResponse.json(
        { error: 'Bu oyuncuyu bu maç için zaten değerlendirdiniz.' },
        { status: 400 }
      )
    }

    // 6. Değerlendirmeyi kaydet
    const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 500) || null : null
    const cleanTags = Array.isArray(tags) ? tags.filter((t) => typeof t === 'string' && t.length < 50).slice(0, 10) : null

    const { error: insertErr } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: reviewerId,
        reviewee_id,
        group_id,
        rating,
        comment: cleanComment,
        tags: cleanTags,
        is_valid: true,
      })

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message || 'Değerlendirme kaydedilemedi.' },
        { status: 500 }
      )
    }

    // 7. Oyuncuya bildirim gönder
    const { data: reviewerProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', reviewerId)
      .single()

    const reviewerName = reviewerProfile?.username || 'Takım arkadaşın'

    await supabase.from('notifications').insert({
      user_id: reviewee_id,
      type: 'new_review',
      title: 'Yeni Takım Değerlendirmesi Aldın! ⭐',
      message: `${reviewerName} seni "${group.title}" maçı için ${rating} yıldızla değerlendirdi.`,
      data: { group_id },
    })

    return NextResponse.json({
      success: true,
      message: 'Değerlendirmeniz başarıyla kaydedildi!',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    )
  }
}
