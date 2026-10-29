'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import { timeAgo } from '@/lib/utils'
import type { Notification } from '@/types/database'
import { Bell, CheckCheck, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/giris?redirect=/bildirimler')
        return
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setNotifications(data || [])
      setLoading(false)
    }

    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })))
      toast.success('Tüm bildirimler okundu olarak işaretlendi.')
    } catch (err) {
      toast.error('İşlem başarısız oldu.')
    }
  }

  const markSingleAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A855F7] font-mono">
                MERKEZ
              </span>
              <h1 className="text-2xl font-extrabold text-[#F5F5FA] font-heading tracking-tight">
                Bildirimler
              </h1>
            </div>
          </div>

          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllAsRead}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#A1A6B5] hover:text-white"
            >
              <CheckCheck size={14} />
              <span>Tümünü Okundu Say</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#686E80] text-xs">Yükleniyor...</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((item) => {
              const groupId = (item.data as any)?.group_id
              return (
                <div
                  key={item.id}
                  onClick={() => !item.is_read && markSingleAsRead(item.id)}
                  className={`card-game p-4.5 transition-all flex items-start justify-between gap-4 cursor-pointer ${
                    item.is_read
                      ? 'bg-[#141722]/50 border-[rgba(255,255,255,0.04)] text-[#A1A6B5]'
                      : 'bg-[#191D2A] border-[#A855F7]/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.2)]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]" />
                      )}
                      <h3 className="text-xs font-bold text-[#F5F5FA] font-heading">{item.title}</h3>
                    </div>
                    <p className="text-xs text-[#A1A6B5] leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-[#686E80] block pt-1">
                      {timeAgo(item.created_at)}
                    </span>
                  </div>

                  {groupId && (
                    <Link
                      href={`/grup/${groupId}`}
                      className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
                    >
                      <span>Gruba Git</span>
                      <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card-game p-16 text-center border-dashed border-[rgba(255,255,255,0.1)]">
            <Bell size={36} className="mx-auto text-[#686E80] mb-2 opacity-50" />
            <h3 className="text-sm font-semibold text-[#F5F5FA] mb-1 font-heading">
              Bildirim kutun temiz
            </h3>
            <p className="text-xs text-[#A1A6B5]">Yeni başvuru, davet veya değerlendirme aldığında burada göreceksin.</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
