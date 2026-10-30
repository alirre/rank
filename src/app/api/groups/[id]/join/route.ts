// Dosya yolu: src/app/api/groups/[id]/join/route.ts
// Bu dosyayı mevcut haliyle değiştirin.
//
// Değişiklik: Kontenjan kontrolü ve ekleme artık veritabanındaki
// join_open_group RPC'sinde, satır kilidi (FOR UPDATE) altında yapılıyor.
// Böylece aynı anda gelen iki istek kontenjanı aşamaz.
// Lidere bildirim de RPC içinde gönderildiği için burada tekrar gönderilmiyor.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/groups/[id]/join
// Açık lobilere (join_type === 'open') atomik ve güvenli katılım
export async function POST(
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
        { error: 'Gruba katılmak için giriş yapmalısınız.' },
        { status: 401 }
      )
    }

    // 2. Atomik katılım (kilit, kontrol, ekleme, slot güncelleme, bildirim tek transaction)
    const { data, error: rpcError } = await supabase.rpc('join_open_group', {
      target_group_id: groupId,
    })

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message || 'Gruba katılırken hata oluştu.' },
        { status: 500 }
      )
    }

    const result = data as { success: boolean; error?: string; message?: string }

    if (!result?.success) {
      // Grup bulunamadı, kapalı, dolu, zaten üye vb. durumlar
      const notFound = result?.error === 'Grup bulunamadı.'
      return NextResponse.json(
        { error: result?.error || 'Gruba katılınamadı.' },
        { status: notFound ? 404 : 400 }
      )
    }

    // 3. Grubun yeni durumunu oku (arayüz için isFull bilgisi)
    const { data: updated } = await supabase
      .from('groups')
      .select('status')
      .eq('id', groupId)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      message: result.message || 'Gruba başarıyla katıldınız!',
      isFull: updated?.status === 'full',
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Sunucu hatası oluştu.' },
      { status: 500 }
    )
  }
}
