'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

function ReportForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportedUserId = searchParams.get('user')
  const reviewId = searchParams.get('review')

  const supabase = createClient()

  const [reason, setReason] = useState('toxic_behavior')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Rapor göndermek için giriş yapmalısınız.')
        router.push('/giris')
        return
      }

      if (reportedUserId) {
        const { error } = await supabase.from('user_reports').insert({
          reporter_id: user.id,
          reported_id: reportedUserId,
          reason,
          details: details.trim() || null,
          status: 'pending',
        })
        if (error) throw error
      } else if (reviewId) {
        const { error } = await supabase.from('review_reports').insert({
          reporter_id: user.id,
          review_id: reviewId,
          reason,
          status: 'pending',
        })
        if (error) throw error
      } else {
        toast.error('Rapor edilecek hedef bulunamadı.')
        return
      }

      toast.success('Raporunuz iletildi. Moderasyon ekibimiz inceleyecektir.')
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Rapor gönderilirken bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card bg-[#111118] border-[#2a2a3a] p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#2a2a3a]">
        <div className="w-10 h-10 rounded-xl bg-[#e63946]/15 text-[#e63946] flex items-center justify-center">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">İhlal veya Uygunsuz Davranış Bildir</h1>
          <p className="text-xs text-[#8b8b9e]">Topluluk kurallarını ihlal eden durumları raporlayın.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Şikayet Nedeni</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input text-sm"
          >
            <option value="toxic_behavior">Toksik Davranış / Hakaret</option>
            <option value="game_throwing">Oyunu Terk Etme / Troll Davranış</option>
            <option value="hate_speech">Nefret Söylemi veya Hedef Gösterme</option>
            <option value="fake_account">Sahte Hesap / Puan Kasıtlılığı</option>
            <option value="other">Diğer İhlaller</option>
          </select>
        </div>

        <div>
          <label className="label">Detaylı Açıklama (İsteğe Bağlı)</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Yaşanan olayı, oyun oturumunu veya rahatsız edici durumu açıklayın..."
            className="input text-sm min-h-[100px] resize-none"
            maxLength={400}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full py-2.5 text-sm font-semibold justify-center shadow-lg shadow-[#e63946]/20"
        >
          {submitting ? 'Gönderiliyor...' : 'Raporu Gönder'}
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  )
}

export default function ReportPage() {
  return (
    <MainLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={<div className="text-center text-[#8b8b9e] py-12">Yükleniyor...</div>}>
          <ReportForm />
        </Suspense>
      </div>
    </MainLayout>
  )
}
