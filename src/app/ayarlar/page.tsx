'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { Settings, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPass, setUpdatingPass] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler birbiriyle eşleşmiyor.')
      return
    }

    setUpdatingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      toast.success('Şifreniz başarıyla güncellendi!')
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Şifre güncellenirken bir hata oluştu.')
    } finally {
      setUpdatingPass(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A855F7] uppercase tracking-wider mb-1 font-mono">
            <Settings size={14} />
            <span>GÜVENLİK AYARLARI</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
            Hesap ve Şifre Güvenliği
          </h1>
          <p className="text-xs text-[#A1A6B5] mt-1">
            Giriş şifrenizi ve hesap güvenlik tercihlerinizi güncelleyin.
          </p>
        </div>

        {/* Şifre Değiştirme */}
        <div className="card-game p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-[rgba(255,255,255,0.06)]">
            <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-heading">Şifre Değiştir</h2>
              <p className="text-xs text-[#A1A6B5]">Hesabının güvenliği için güçlü bir şifre belirle.</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5 font-mono">
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="input-game text-xs py-2.5"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5 font-mono">
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifreyi doğrula"
                className="input-game text-xs py-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPass}
              className="btn-primary text-xs py-2.5 px-5 font-semibold"
            >
              <span>{updatingPass ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}
