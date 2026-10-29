'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import Logo from '@/components/ui/Logo'
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck, Trophy, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (username.length < 3) {
      setErrorMsg('Kullanıcı adı en az 3 karakter olmalıdır.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setLoading(true)

    try {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle()

      if (existingUser) {
        setErrorMsg('Bu kullanıcı adı zaten alınmış.')
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      toast.success('Hesabınız oluşturuldu! Yönlendiriliyorsunuz...')
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setErrorMsg('Kayıt olurken beklenmedik bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[960px] w-full grid grid-cols-1 lg:grid-cols-12 card-game overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#141722] shadow-2xl">
          {/* Sol Kolon: Kayıt Formu */}
          <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
            <div className="mb-6">
              <Link href="/" className="inline-block mb-3">
                <Logo size={32} />
              </Link>
              <h1 className="text-2xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
                DuoRank'e Katıl
              </h1>
              <p className="text-xs text-[#A1A6B5] mt-1">
                Kendi seviyende oyuncularla takım kur, rank kas ve kazan.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-5 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl flex items-center gap-2.5 text-xs text-[#F87171]">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5 font-mono">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-3.5 text-[#686E80]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="oyuncu_adi"
                    className="input-game pl-10 text-xs py-2.5"
                  />
                </div>
                <span className="text-[10px] text-[#686E80] mt-1 block">
                  Küçük harf, rakam ve alt çizgi kullanılabilir.
                </span>
              </div>

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
                <label className="text-[11px] font-semibold text-[#A1A6B5] uppercase tracking-wider block mb-1.5 font-mono">
                  Şifre
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3.5 text-[#686E80]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
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
                {loading ? 'Kayıt Yapılıyor...' : 'Hesap Oluştur'}
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="text-center text-xs text-[#A1A6B5] pt-6 mt-6 border-t border-[rgba(255,255,255,0.06)]">
              Zaten bir hesabın var mı?{' '}
              <Link href="/giris" className="text-[#A855F7] font-semibold hover:underline">
                Giriş Yap
              </Link>
            </div>
          </div>

          {/* Sağ Kolon: Tanıtım Paneli */}
          <div className="hidden lg:flex lg:col-span-5 bg-[#0E1018] p-10 flex-col justify-between border-l border-[rgba(255,255,255,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#A855F7]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#A855F7] font-mono">
                DUORANK EKOSİSTEMİ
              </span>
              <h3 className="text-xl font-bold text-[#F5F5FA] font-heading leading-tight">
                "Rank'ini tek başına kasma."
              </h3>
              <p className="text-xs text-[#A1A6B5] leading-relaxed">
                Senin oyun tarzında, hedefine odaklı oyuncularla tanış ve ekibini kur.
              </p>
            </div>

            <div className="space-y-3 relative z-10 pt-8 border-t border-[rgba(255,255,255,0.06)] text-xs text-[#A1A6B5]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#36D399]" />
                <span>Toksik ve troll oyunculara karşı şeffaf puanlama</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-[#A855F7]" />
                <span>Tek tıkla lobi katılımı ve anlık davetler</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Trophy size={16} className="text-[#FBBF24]" />
                <span>Gelişmiş istatistik ve oyun kimlik kartı</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
