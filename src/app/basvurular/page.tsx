'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { timeAgo } from '@/lib/utils'
import { Search, ArrowRight, Gamepad2 } from 'lucide-react'

export default function ApplicationsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/giris?redirect=/basvurular')
        return
      }

      const { data } = await supabase
        .from('group_applications')
        .select(`
          *,
          group:groups(id, owner_id, title, status, join_type, slots_total, slots_filled, server_region, game_mode, min_rank, max_rank, created_at, owner:profiles(*))
        `)
        .eq('applicant_id', session.user.id)
        .order('created_at', { ascending: false })

      setApplications(data || [])
      setLoading(false)
    }

    fetchApplications()
  }, [])

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] uppercase tracking-wider mb-1 font-mono">
            <Search size={14} />
            <span>KATILIM GEÇMİŞİ</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
            Grup Başvurularım
          </h1>
          <p className="text-xs text-[#A1A6B5] mt-1">
            Katılmak için başvurduğunuz lobi ve grupların onay durumları.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#686E80] text-xs">Yükleniyor...</div>
        ) : applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="card-game p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-white font-heading">
                      {app.group?.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'accepted'
                          ? 'bg-[#36D399]/15 text-[#36D399] border border-[#36D399]/30'
                          : app.status === 'rejected'
                          ? 'bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30'
                          : 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30'
                      }`}
                    >
                      {app.status === 'accepted' ? 'Kabul Edildi' :
                       app.status === 'rejected' ? 'Reddedildi' : 'Onay Bekliyor'}
                    </span>
                  </div>

                  <div className="text-xs text-[#A1A6B5]">
                    Grup Lideri: <strong className="text-white">{app.group?.owner?.username}</strong>
                  </div>

                  {app.message && (
                    <p className="text-xs text-[#A1A6B5] italic mt-2 bg-[#0E1018] p-2 rounded-lg border border-[rgba(255,255,255,0.04)]">
                      Mesajınız: "{app.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-[11px] text-[#686E80] tabular-numbers font-mono">
                    {timeAgo(app.created_at)}
                  </span>
                  <Link
                    href={`/grup/${app.group_id}`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <span>Grubu Gör</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-game p-16 text-center border-dashed border-[rgba(255,255,255,0.1)]">
            <Gamepad2 size={36} className="mx-auto text-[#686E80] mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-[#F5F5FA] mb-1 font-heading">
              Henüz bir gruba başvuru göndermedin
            </h3>
            <p className="text-xs text-[#A1A6B5] max-w-sm mx-auto mb-4">
              Açık lobilere göz atabilir ve seviyene en uygun takıma dahil olabilirsin.
            </p>
            <Link href="/gruplar" className="btn-primary text-xs py-2 px-4 inline-flex">
              Açık Grupları Keşfet
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
