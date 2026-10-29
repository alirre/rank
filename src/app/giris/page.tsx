'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import Logo from '@/components/ui/Logo'
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Trophy, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg('E-posta adresi veya şifre hatalı.')
        setLoading(false)
        return
      }

      toast.success('Giriş başarılı!')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setErrorMsg('Giriş yapılırken bir hata meydana geldi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[960px] w-full grid grid-cols-1 lg:grid-cols-12 card-game overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#141722] shadow-2xl">
          {/* Sol Kolon: Giriş Formu */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            <div className="mb-6">
              <Link href="/" className="inline-block mb-3">
                <Logo size={32} />
              </Link>
              <h1 className="text-2xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
                Tekrar Hoş Geldin
              </h1>
              <p className="text-xs text-[#A1A6B5] mt-1">
                Takımın maç için seni bekliyor, hemen giriş yap.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-5 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#F87171]">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5 font-mono">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-3.5 text-[#686E80]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="oyuncu@ornek.com"
                    className="input-game pl-10 text-xs py-2.5"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider font-mono">
                    Şifre
                  </label>
                  <Link
                    href="/sifremi-unuttum"
                    className="text-[11px] text-[#A855F7] hover:underline"
                  >
                    Şifremi Unuttum
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3.5 text-[#686E80]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-game pl-10 pr-10 text-xs py-2.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#686E80] hover:text-[#A1A6B5] transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs font-semibold justify-center mt-2"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="text-center text-xs text-[#A1A6B5] pt-6 mt-6 border-t border-[rgba(255,255,255,0.06)]">
              Henüz bir hesabın yok mu?{' '}
              <Link href="/kayit" className="text-[#A855F7] font-semibold hover:underline">
                Hemen Kaydol
              </Link>
            </div>
          </div>

          {/* Sağ Kolon: Görsel ve Değer Odaklı Kart (Desktop only) */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#0E1018] p-10 flex-col justify-between border-l border-[rgba(255,255,255,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#A855F7]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A855F7] font-mono">
                DUORANK PLATFORMU
              </span>
              <h3 className="text-xl font-bold text-[#F5F5FA] font-heading leading-tight">
                "İyi takım arkadaşları tesadüf olmasın."
              </h3>
              <p className="text-xs text-[#A1A6B5] leading-relaxed">
                Toksik olmayan, seviyene tam oturan ve iletişim kurabilen oyuncularla sıralamada yüksel.
              </p>
            </div>

            <div className="space-y-3 relative z-10 pt-8 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#A1A6B5]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#36D399]" />
                <span>Doğrulanmış oyuncu değerlendirmeleri</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-[#A855F7]" />
                <span>Özel lobi ve parti kodu paylaşımı</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Trophy size={16} className="text-[#FBBF24]" />
                <span>Rank ve rol odaklı akıllı eşleşme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
