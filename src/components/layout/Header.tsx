'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import {
  Bell, Menu, X, ChevronDown, LogOut, User, Settings,
  Shield, Users, Gamepad2, Plus, Search, Sparkles, MessageSquare
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import Logo from '@/components/ui/Logo'
import toast from 'react-hot-toast'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setUser(data)

          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('is_read', false)
          setUnreadCount(count || 0)
        }
      } catch (err) {
        console.error('Header auth check error:', err)
      } finally {
        setLoading(false)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          setUser(null)
          setUnreadCount(0)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    toast.success('Çıkış yapıldı')
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/oyuncular', label: 'Oyuncular' },
    { href: '/gruplar', label: 'Gruplar' },
    { href: '/mesajlar', label: 'Mesajlar' },
    { href: '/#nasil-calisir', label: 'Nasıl Çalışır?' },
  ]

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-50 h-[76px] bg-[#090A0F]/85 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] transition-all">
      <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Sol Logo */}
        <Link href="/" className="flex items-center">
          <Logo size={36} />
        </Link>

        {/* Orta Navigasyon Linkleri */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#141722]/80 border border-[rgba(255,255,255,0.06)] px-2 py-1.5 rounded-full shadow-inner">
          <Link
            href="/gruplar"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              isActive('/gruplar')
                ? 'bg-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A6B5] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            Gruplar
          </Link>
          <Link
            href="/oyuncular"
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
              isActive('/oyuncular')
                ? 'bg-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                : 'text-[#A1A6B5] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            Oyuncular
          </Link>
          <Link
            href="/#nasil-calisir"
            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-[#A1A6B5] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all"
          >
            Nasıl Çalışır?
          </Link>
        </nav>

        {/* Sağ Alan: Arama, Giriş/Kayıt veya Kullanıcı Profil */}
        <div className="flex items-center gap-3">
          <Link
            href="/oyuncular"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] text-[#A1A6B5] hover:text-white hover:border-[#A855F7]/40 transition-all"
            title="Hızlı Arama"
          >
            <Search size={16} />
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    href="/grup/olustur"
                    className="hidden sm:inline-flex btn-primary text-xs py-2 px-4"
                  >
                    <Plus size={15} />
                    <span>Grup Aç</span>
                  </Link>

                  {/* Mesajlar */}
                  <Link
                    href="/mesajlar"
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] text-[#A1A6B5] hover:text-white hover:border-[#A855F7]/40 transition-all"
                    title="Özel Mesajlar"
                  >
                    <MessageSquare size={16} />
                  </Link>

                  {/* Bildirimler */}
                  <Link
                    href="/bildirimler"
                    className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] text-[#A1A6B5] hover:text-white hover:border-[#A855F7]/40 transition-all"
                  >
                    <Bell size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#A855F7] rounded-full text-white text-[9px] flex items-center justify-center font-bold ring-2 ring-[#090A0F]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Profil Açılır Menü */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] hover:border-[#A855F7]/50 transition-all cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-inner">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(user.username)
                        )}
                      </div>
                      <span className="hidden sm:block text-xs font-semibold text-[#F5F5FA] max-w-[90px] truncate">
                        {user.username}
                      </span>
                      <ChevronDown size={14} className="text-[#686E80] hidden sm:block" />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#141722] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl z-30 overflow-hidden animate-in-fast">
                          <div className="p-3.5 border-b border-[rgba(255,255,255,0.08)] bg-[#191D2A]/60">
                            <p className="text-[#F5F5FA] font-semibold text-xs truncate">{user.username}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[#FBBF24] text-xs">★</span>
                              <span className="text-[#A1A6B5] text-[11px] tabular-numbers font-medium">
                                {user.avg_rating > 0 ? user.avg_rating.toFixed(1) : 'Yeni'} ({user.review_count} değerlendirme)
                              </span>
                            </div>
                          </div>
                          <div className="p-1.5 space-y-0.5 text-xs">
                            <Link
                              href={`/profil/${user.id}`}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A1A6B5] hover:text-white hover:bg-[#1E2333] transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User size={15} />
                              Profilim
                            </Link>
                            <Link
                              href="/mesajlar"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A1A6B5] hover:text-white hover:bg-[#1E2333] transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <MessageSquare size={15} />
                              Mesajlarım
                            </Link>
                            <Link
                              href="/basvurular"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A1A6B5] hover:text-white hover:bg-[#1E2333] transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Search size={15} />
                              Başvurularım
                            </Link>
                            <Link
                              href="/ayarlar"
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A1A6B5] hover:text-white hover:bg-[#1E2333] transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Settings size={15} />
                              Ayarlar
                            </Link>
                            {user.is_admin && (
                              <Link
                                href="/admin"
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A855F7] hover:bg-[#A855F7]/10 transition-colors font-medium"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Shield size={15} />
                                Yönetici Paneli
                              </Link>
                            )}
                            <div className="border-t border-[rgba(255,255,255,0.08)] my-1" />
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#F87171] hover:bg-[#F87171]/10 transition-colors text-left"
                            >
                              <LogOut size={15} />
                              Çıkış Yap
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/giris"
                    className="text-xs font-semibold text-[#A1A6B5] hover:text-white px-3 py-2 transition-colors"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/kayit"
                    className="btn-primary text-xs py-2 px-4"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobil Menü Butonu */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-[#141722] border border-[rgba(255,255,255,0.08)] text-[#A1A6B5] hover:text-white transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobil Açılır Menü */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0E1018] border-b border-[rgba(255,255,255,0.08)] px-5 py-4 space-y-3 animate-in-fast">
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A6B5] hover:text-white hover:bg-[#141722] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/grup/olustur"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-[#A855F7] bg-[#A855F7]/10 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                + Grup Oluştur
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
