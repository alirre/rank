import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchValorantVerification } from '@/lib/riot-api'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Bu işlem için oturum açmalısınız.' }, { status: 401 })
    }

    const body = await req.json()
    const { riotId, riotTag, region = 'eu' } = body

    if (!riotId || !riotTag) {
      return NextResponse.json({ error: 'Riot ID ve Etiket (Tag) zorunludur.' }, { status: 400 })
    }

    // Call Riot verification service
    const verifiedData = await fetchValorantVerification(riotId, riotTag, region)

    // Update profile with verified data
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        riot_id: verifiedData.riotId,
        riot_tag: verifiedData.riotTag,
        rank: verifiedData.rank,
        primary_agent: verifiedData.stats.topAgents[0] || 'Jett',
        secondary_agent: verifiedData.stats.topAgents[1] || 'Reyna',
        riot_verified: true,
        riot_puuid: verifiedData.puuid,
        riot_current_tier: verifiedData.tierNumber,
        riot_current_rr: verifiedData.currentRr,
        riot_peak_rank: verifiedData.peakRank,
        riot_stats: verifiedData.stats,
        riot_last_updated: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateErr) {
      // In case column does not exist yet in live Supabase, update basic fields
      const { error: fallbackErr } = await supabase
        .from('profiles')
        .update({
          riot_id: verifiedData.riotId,
          riot_tag: verifiedData.riotTag,
          rank: verifiedData.rank,
        })
        .eq('id', user.id)

      if (fallbackErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Riot Games hesabınız ve Valorant istatistikleriniz başarıyla doğrulandı!',
      data: verifiedData,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Doğrulama sırasında bir hata oluştu.' }, { status: 500 })
  }
}
