'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/ayarlar`,
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch (err: any) {
      setErrorMsg('Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 card bg-[#111118] border-[#2a2a3a] p-8 shadow-2xl relative">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Şifremi Unuttum
            </h2>
            <p className="text-sm text-[#8b8b9e] mt-1">
              E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
            </p>
          </div>

          {sent ? (
            <div className="p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl text-center space-y-3">
              <CheckCircle2 size={32} className="text-[#22c55e] mx-auto" />
              <h3 className="text-white font-semibold text-base">E-posta Gönderildi!</h3>
              <p className="text-xs text-[#8b8b9e] leading-relaxed">
                Şifre sıfırlama talimatları <strong>{email}</strong> adresine yollandı. Lütfen gelen kutunu ve spam klasörünü kontrol et.
              </p>
              <Link href="/giris" className="btn btn-secondary w-full text-xs py-2 mt-2">
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-[#e63946]/10 border border-[#e63946]/30 rounded-lg flex items-center gap-2 text-sm text-[#e63946]">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form className="mt-8 space-y-5" onSubmit={handleReset}>
                <div>
                  <label className="label">Kayıtlı E-Posta Adresi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5a5a6e]">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="input pl-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-2.5 text-sm font-semibold justify-center shadow-lg shadow-[#e63946]/20"
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="text-center text-xs text-[#8b8b9e] pt-4 border-t border-[#2a2a3a]">
                <Link href="/giris" className="text-[#8b8b9e] hover:text-white transition-colors">
                  Giriş sayfasına geri dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
