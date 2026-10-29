import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MainLayout from '@/components/layout/MainLayout'
import { ShieldAlert, Users, Gamepad2, AlertTriangle, Award, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = await createClient()

  // CRITICAL: Use getUser() for auth (not getSession which can be spoofed)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/giris')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/')
  }

  // 1. Fetch pending User Reports
  const { data: userReports } = await supabase
    .from('user_reports')
    .select(`
      *,
      reporter:profiles!reporter_id(username),
      reported:profiles!reported_id(username, is_suspended)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  // 2. Fetch recent flagged reviews for inspection
  const { data: flaggedReviews } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:profiles!reviewer_id(username),
      reviewee:profiles!reviewee_id(username)
    `)
    .eq('flagged_for_review', true)
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Platform Counts
  const [
    { count: totalUsers },
    { count: totalGroups },
    { count: totalReviews },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('groups').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ])

  return (
    <MainLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#C084FC] text-xs font-semibold mb-2 font-mono">
            <ShieldAlert size={14} />
            <span>YÖNETİCİ KONTROL PANELİ</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
            Moderasyon & Denetim
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A6B5] mt-1">
            Gelen oyuncu şikayetlerini, sahte değerlendirmeleri ve platform durumunu yönetin.
          </p>
        </div>

        {/* Gerçek İstatistikler Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="card-game p-5">
            <span className="text-[10px] text-[#686E80] font-bold uppercase tracking-wider font-mono">
              Toplam Kayıtlı Oyuncu
            </span>
            <div className="text-2xl font-black text-white mt-1 tabular-numbers font-heading">
              {totalUsers || 0}
            </div>
          </div>
          <div className="card-game p-5">
            <span className="text-[10px] text-[#686E80] font-bold uppercase tracking-wider font-mono">
              Toplam Açılan Lobi
            </span>
            <div className="text-2xl font-black text-[#A855F7] mt-1 tabular-numbers font-heading">
              {totalGroups || 0}
            </div>
          </div>
          <div className="card-game p-5">
            <span className="text-[10px] text-[#686E80] font-bold uppercase tracking-wider font-mono">
              Doğrulanmış Değerlendirme
            </span>
            <div className="text-2xl font-black text-[#36D399] mt-1 tabular-numbers font-heading">
              {totalReviews || 0}
            </div>
          </div>
        </div>

        {/* Bekleyen Şikayetler */}
        <div className="card-game p-6 mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F5F5FA] font-mono mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#F87171]" />
            <span>Bekleyen Şikayet Raporları ({userReports?.length || 0})</span>
          </h2>

          {userReports && userReports.length > 0 ? (
            <div className="space-y-3">
              {userReports.map((report: any) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#686E80]">Şikayetçi:</span>
                      <strong className="text-white">{report.reporter?.username}</strong>
                      <span className="text-[#686E80]">→</span>
                      <span className="text-[#686E80]">Hedef Oyuncu:</span>
                      <strong className="text-[#F87171]">{report.reported?.username}</strong>
                    </div>

                    <div className="text-[11px] text-[#FBBF24] font-medium mt-1 font-mono">
                      Gerekçe: {report.reason}
                    </div>

                    {report.details && (
                      <p className="text-xs text-[#A1A6B5] italic mt-1 bg-[#141722] p-2 rounded border border-[rgba(255,255,255,0.04)]">
                        "{report.details}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-[#686E80] font-mono flex-shrink-0">
                    {formatDate(report.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#686E80]">
              İncelenmesi gereken bekleyen şikayet bulunmuyor.
            </div>
          )}
        </div>

        {/* Son Değerlendirmeler */}
        <div className="card-game p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F5F5FA] font-mono mb-4">
            Son Tamamlanan Değerlendirmeler
          </h2>

          <div className="space-y-2.5">
            {flaggedReviews?.map((rev: any) => (
              <div
                key={rev.id}
                className="p-3 rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.04)] flex items-center justify-between text-xs"
              >
                <div>
                  <span className="text-white font-semibold">{rev.reviewer?.username}</span>
                  <span className="text-[#686E80]"> → </span>
                  <span className="text-white font-semibold">{rev.reviewee?.username}</span>
                  <span className="text-[#686E80]"> için </span>
                  <span className="text-[#FBBF24] font-bold tabular-numbers font-mono">★ {rev.rating}</span>
                  <span className="text-[#686E80]"> verdi.</span>

                  {rev.comment && (
                    <p className="text-xs text-[#A1A6B5] italic mt-0.5">"{rev.comment}"</p>
                  )}
                </div>

                <span className="text-[10px] text-[#686E80] font-mono">{formatDate(rev.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
