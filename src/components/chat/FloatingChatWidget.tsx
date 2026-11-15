'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare, X, ChevronDown, Send, User,
  CheckCircle2, ArrowLeft, Maximize2, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import type { DirectConversation, DirectMessage, Profile } from '@/types/database'

export default function FloatingChatWidget() {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<DirectConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const partner = activeConv?.other_user

  // Check user session
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) setCurrentUser(profile)
    }

    checkAuth()
  }, [])

  // Load conversations when opened or when user changes
  useEffect(() => {
    if (!currentUser) return

    async function loadConversations() {
      try {
        const res = await fetch('/api/messages')
        if (res.ok) {
          const data = await res.json()
          if (data.conversations) {
            setConversations(data.conversations)
          }
        }
      } catch (e) {
        // silent
      }
    }

    loadConversations()
  }, [currentUser, isOpen])

  // Load active conversation messages
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }

    let isMounted = true
    setLoading(true)

    async function loadChat() {
      try {
        const res = await fetch(`/api/messages/${activeConvId}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.messages) {
            setMessages(data.messages)
          }
        }
      } catch (e) {
        // silent
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadChat()

    // Realtime listener
    const channel = supabase
      .channel(`floating-dm-${activeConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${activeConvId}`,
        },
        async (payload) => {
          const newMsg = payload.new as DirectMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [activeConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages.length])

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || !activeConvId) return

    try {
      const res = await fetch(`/api/messages/${activeConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await res.json()
      if (res.ok && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }
      setInputText('')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch {
      // silent
    }
  }

  // If not logged in, don't show floating chat
  if (!currentUser) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* POPUP CHAT WINDOW */}
      {isOpen && (
        <div className="card-game w-80 sm:w-96 h-[460px] bg-[#141722] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0E1018] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeConvId && (
                <button
                  type="button"
                  onClick={() => setActiveConvId(null)}
                  className="text-[#A1A6B5] hover:text-white p-0.5"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                  <MessageSquare size={13} />
                </div>
                <span className="text-xs font-bold text-[#F5F5FA] font-mono truncate max-w-[150px]">
                  {activeConvId && partner ? partner.username : 'Mesajlar'}
                </span>
                {partner?.riot_verified && (
                  <CheckCircle2 size={11} className="text-[#36D399]" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href="/mesajlar"
                onClick={() => setIsOpen(false)}
                className="text-[#A1A6B5] hover:text-white p-1"
                title="Tam Ekrana Genişlet"
              >
                <Maximize2 size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#A1A6B5] hover:text-white p-1"
                title="Kapat"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          {activeConvId && partner ? (
            /* Active Thread */
            <>
              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#0A0C13]/70">
                {loading ? (
                  <div className="p-4 text-center text-xs text-[#686E80]">Yükleniyor...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center p-6 text-xs text-[#686E80]">
                    Takım arkadaşına ilk selamını ver!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUser.id
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-2.5 rounded-xl text-xs break-words ${
                            isMe
                              ? 'bg-[#A855F7] text-white rounded-tr-none'
                              : 'bg-[#1C2030] text-[#E2E8F0] border border-[rgba(255,255,255,0.06)] rounded-tl-none'
                          }`}
                        >
                          <p>{m.message}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-2.5 bg-[#0E1018] border-t border-[rgba(255,255,255,0.06)] flex items-center gap-1.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Mesaj yaz..."
                  className="input-game text-xs flex-1 py-1.5"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn-primary text-xs p-2 shrink-0 disabled:opacity-50"
                >
                  <Send size={13} />
                </button>
              </form>
            </>
          ) : (
            /* Conversations List */
            <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)] bg-[#0A0C13]/60">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#686E80] space-y-1.5">
                  <Sparkles size={24} className="mx-auto text-[#A855F7] opacity-40 mb-1" />
                  <p className="font-semibold text-[#A1A6B5]">Henüz mesajınız yok</p>
                  <p className="text-[10px]">Oyuncu profillerinden mesaj başlatabilirsiniz.</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const p = c.other_user
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
                      className="w-full text-left p-3 flex items-center gap-2.5 hover:bg-[#191D2A] transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white text-[11px] font-bold overflow-hidden shrink-0">
                        {p?.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (p?.username?.[0] || '?').toUpperCase()
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#F5F5FA] truncate">
                            {p?.username}
                          </span>
                          {p?.riot_verified && (
                            <CheckCircle2 size={10} className="text-[#36D399] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#A1A6B5] truncate">
                          {c.last_message || 'Sohbet başladı'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* FLOATING TOGGLE PILL BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary py-2.5 px-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <MessageSquare size={16} />
        <span className="text-xs font-bold">Mesajlar</span>
        {conversations.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-white text-[#A855F7] text-[10px] font-black flex items-center justify-center">
            {conversations.length}
          </span>
        )}
      </button>
    </div>
  )
}
