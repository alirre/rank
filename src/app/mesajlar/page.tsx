'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/MainLayout'
import RankBadge from '@/components/ui/RankBadge'
import {
  MessageSquare, Send, Search, User, ShieldCheck,
  CheckCircle2, ArrowLeft, Sparkles, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { DirectConversation, DirectMessage, Profile } from '@/types/database'

function MessagesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('userId')
  const initialConvId = searchParams.get('convId')

  const supabase = createClient()
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<DirectConversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find((c) => c.id === activeConvId)
  const otherUser = activeConv?.other_user

  // 1. Fetch current user and conversations
  useEffect(() => {
    let isMounted = true

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/giris?next=/mesajlar')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (isMounted) setCurrentUser(profile)

        // Load conversations
        const res = await fetch('/api/messages')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.conversations) {
            setConversations(data.conversations)

            // If targetUserId query param is passed, start or find conversation
            if (targetUserId) {
              const existing = data.conversations.find(
                (c: any) => c.user1_id === targetUserId || c.user2_id === targetUserId
              )
              if (existing) {
                setActiveConvId(existing.id)
              } else {
                // Create new
                const createRes = await fetch('/api/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetUserId }),
                })
                const createData = await createRes.json()
                if (createData.conversationId) {
                  // Reload list and set active
                  const reloadRes = await fetch('/api/messages')
                  const reloadData = await reloadRes.json()
                  if (reloadData.conversations) {
                    setConversations(reloadData.conversations)
                  }
                  setActiveConvId(createData.conversationId)
                }
              }
            } else if (!initialConvId && data.conversations.length > 0) {
              // Default to first conversation on desktop
              setActiveConvId(data.conversations[0].id)
            }
          }
        }
      } catch (e) {
        console.error('Init messages failed:', e)
      } finally {
        if (isMounted) setLoadingList(false)
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, [targetUserId, initialConvId])

  // 2. Fetch messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }

    let isMounted = true
    setLoadingChat(true)

    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages/${activeConvId}`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.messages) {
            setMessages(data.messages)
          }
        }
      } catch (e) {
        console.error('Failed to load chat messages:', e)
      } finally {
        if (isMounted) setLoadingChat(false)
      }
    }

    loadMessages()

    // Realtime channel for this conversation
    const channel = supabase
      .channel(`dm-chat-${activeConvId}`)
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
          if (newMsg.sender_id) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('id, username, avatar_url, rank, riot_verified, riot_current_rr')
              .eq('id', newMsg.sender_id)
              .single()

            if (senderProfile) {
              newMsg.sender = senderProfile as any
            }
          }

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

  // 3. Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || !activeConvId || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/${activeConvId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mesaj iletilemedi.')

      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })

        // Update last message in local conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, last_message: trimmed, last_message_at: new Date().toISOString() }
              : c
          )
        )
      }
      setInputText('')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (err: any) {
      toast.error(err.message || 'Mesaj iletilemedi.')
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const name = c.other_user?.username?.toLowerCase() || ''
    return name.includes(searchQuery.toLowerCase())
  })

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-game bg-[#141722] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden shadow-2xl h-[700px] flex">
          {/* LEFT: Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-[rgba(255,255,255,0.06)] bg-[#0E1018] flex flex-col ${
              activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-sm font-bold uppercase tracking-wider text-[#F5F5FA] font-mono flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#A855F7]" />
                  <span>Özel Mesajlar</span>
                </h1>
                <span className="text-[10px] text-[#A1A6B5] bg-[#141722] px-2 py-0.5 rounded-full border border-[rgba(255,255,255,0.06)]">
                  {conversations.length} Sohbet
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#686E80]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Oyuncu ara..."
                  className="input-game text-xs pl-8 py-1.5 w-full bg-[#141722]"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.04)]">
              {loadingList ? (
                <div className="p-6 text-center text-xs text-[#686E80]">
                  Sohbetler yükleniyor...
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#686E80] space-y-2">
                  <MessageSquare size={32} className="mx-auto text-[#A855F7] opacity-40" />
                  <p className="font-semibold text-[#A1A6B5]">Henüz mesajınız yok</p>
                  <p className="text-[11px] text-[#686E80]">
                    Oyuncular sayfasından veya profillerden "Mesaj Gönder" butonuna basarak ilk sohbetinizi başlatın.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId
                  const partner = conv.other_user

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#191D2A] border-l-2 border-[#A855F7]'
                          : 'hover:bg-[#141722]'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {partner?.avatar_url ? (
                            <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (partner?.username?.[0] || '?').toUpperCase()
                          )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#36D399] border-2 border-[#0E1018]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-[#F5F5FA] truncate">
                              {partner?.username || 'Bilinmeyen'}
                            </span>
                            {partner?.riot_verified && (
                              <CheckCircle2 size={11} className="text-[#36D399] shrink-0" />
                            )}
                          </div>
                          {conv.last_message_at && (
                            <span className="text-[9px] text-[#686E80] font-mono shrink-0">
                              {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#A1A6B5] truncate">
                          {conv.last_message || 'Sohbet başladı'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT: Active Chat View */}
          <div
            className={`flex-1 flex flex-col bg-[#141722] ${
              !activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConvId && otherUser ? (
              <>
                {/* Active Chat Header */}
                <div className="px-5 py-3.5 bg-[#0E1018] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConvId(null)}
                      className="md:hidden text-[#A1A6B5] hover:text-white p-1"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                      {otherUser.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (otherUser.username?.[0] || '?').toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#F5F5FA]">
                          {otherUser.username}
                        </span>
                        {otherUser.riot_verified && (
                          <span className="text-[9px] bg-[#36D399]/20 text-[#36D399] px-1.5 py-0.2 rounded font-bold border border-[#36D399]/30">
                            ✓ Riot Onaylı
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {otherUser.rank && <RankBadge rank={otherUser.rank} size="xs" />}
                        {otherUser.riot_current_rr !== undefined && (
                          <span className="text-[10px] text-[#38BDF8] font-mono">
                            {otherUser.riot_current_rr} RR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/profil/${otherUser.id}`}
                    className="btn-secondary text-[11px] py-1 px-3 flex items-center gap-1"
                  >
                    <User size={12} />
                    <span>Profili</span>
                  </Link>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#0A0C13]/70">
                  {loadingChat ? (
                    <div className="flex items-center justify-center h-full text-xs text-[#686E80] gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>Mesajlar yükleniyor...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[#686E80] p-6">
                      <Sparkles size={28} className="text-[#A855F7] opacity-60 mb-2" />
                      <span className="text-xs font-semibold text-[#A1A6B5]">Yeni bir sohbet!</span>
                      <p className="text-[11px] max-w-xs mt-1">
                        Takım arkadaşınla maç planı yapmak için ilk mesajını gönder.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === currentUser?.id

                      return (
                        <div
                          key={m.id}
                          className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                              isMe
                                ? 'bg-[#A855F7] text-white rounded-tr-none'
                                : 'bg-[#1C2030] text-[#E2E8F0] border border-[rgba(255,255,255,0.06)] rounded-tl-none'
                            }`}
                          >
                            <p>{m.message}</p>
                            <span
                              className={`block text-[9px] mt-1 font-mono ${
                                isMe ? 'text-white/70 text-right' : 'text-[#686E80]'
                              }`}
                            >
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Footer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3.5 bg-[#0E1018] border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Mesajınızı yazın... (Enter ile gönder)"
                    className="input-game text-xs flex-1 py-2"
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="btn-primary text-xs py-2 px-4 shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>Gönder</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-[#686E80] p-8">
                <MessageSquare size={44} className="text-[#A855F7] opacity-30 mb-3" />
                <h3 className="text-sm font-bold text-[#F5F5FA] mb-1">Bir Sohbet Seçin</h3>
                <p className="text-xs max-w-sm">
                  Sol taraftaki listeden bir oyuncuya tıklayarak konuşmayı başlatabilir veya profilinden mesaj gönderebilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <MessagesClient />
    </Suspense>
  )
}
