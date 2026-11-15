'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Send, MessageSquare, Volume2, ShieldCheck, CheckCircle2,
  ExternalLink, Sparkles, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { LobbyMessage } from '@/types/database'

interface LobbyChatProps {
  groupId: string
  currentUserId?: string
  isMember: boolean
  isOwner: boolean
  groupTitle: string
}

export default function LobbyChat({
  groupId,
  currentUserId,
  isMember,
  isOwner,
  groupTitle,
}: LobbyChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<LobbyMessage[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [discordLink, setDiscordLink] = useState('')
  const [showDiscordModal, setShowDiscordModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  // Initial load
  useEffect(() => {
    let isMounted = true

    async function loadMessages() {
      try {
        const res = await fetch(`/api/groups/${groupId}/messages`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.messages) {
            setMessages(data.messages)
          }
        }
      } catch (e) {
        console.error('Failed to load lobby messages:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMessages()

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`lobby-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lobby_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as LobbyMessage
          // If we don't have sender profile, fetch it
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
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    scrollToBottom(false)
  }, [messages.length])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputMsg.trim()
    if (!trimmed || sending) return

    if (!currentUserId || !isMember) {
      toast.error('Lobi sohbetine yalnızca grup üyeleri yazabilir.')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, messageType: 'user' }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mesaj gönderilemedi.')

      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }
      setInputMsg('')
      scrollToBottom()
    } catch (err: any) {
      toast.error(err.message || 'Mesaj gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  const handleShareDiscordLink = async () => {
    const trimmed = discordLink.trim()
    if (!trimmed) return

    try {
      await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🎧 Discord Ses Odası Linki: ${trimmed}`,
          messageType: 'discord_link',
        }),
      })
      setShowDiscordModal(false)
      setDiscordLink('')
      toast.success('Discord ses odası bağlantısı paylaşıldı!')
    } catch (e) {
      toast.error('Paylaşılamadı.')
    }
  }

  return (
    <div className="card-game flex flex-col h-[460px] bg-[#141722] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-5 py-3.5 bg-[#0E1018] border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7]">
            <MessageSquare size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F5FA] font-mono">
                Lobi Canlı Sohbeti
              </span>
              <span className="w-2 h-2 rounded-full bg-[#36D399] animate-pulse" />
            </div>
            <p className="text-[10px] text-[#A1A6B5]">
              Yalnızca lobiye kabul edilen takım arkadaşları görebilir
            </p>
          </div>
        </div>

        {/* Action: Discord Voice Channel Quick Share */}
        {isMember && (
          <button
            type="button"
            onClick={() => setShowDiscordModal(true)}
            className="text-[11px] font-medium bg-[#5865F2]/15 text-[#5865F2] hover:bg-[#5865F2]/25 px-2.5 py-1 rounded-lg border border-[#5865F2]/30 flex items-center gap-1.5 transition-colors"
          >
            <Volume2 size={13} />
            <span>Discord Ses Odası</span>
          </button>
        )}
      </div>

      {/* Discord Share Modal Dialog */}
      {showDiscordModal && (
        <div className="bg-[#1C2030] p-4 border-b border-[rgba(255,255,255,0.08)] flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F5F5FA] flex items-center gap-1.5">
              <Volume2 size={14} className="text-[#5865F2]" />
              Discord Ses Odası Davet Linki Paylaş
            </span>
            <button
              onClick={() => setShowDiscordModal(false)}
              className="text-xs text-[#A1A6B5] hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={discordLink}
              onChange={(e) => setDiscordLink(e.target.value)}
              placeholder="https://discord.gg/..."
              className="input-game text-xs flex-1 py-1.5"
            />
            <button
              type="button"
              onClick={handleShareDiscordLink}
              className="btn-primary text-xs py-1.5 px-3 shrink-0"
            >
              Paylaş
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0A0C13]/60">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[#686E80] gap-2">
            <span className="animate-spin">⏳</span>
            <span>Sohbet yükleniyor...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-[#686E80] p-6">
            <Sparkles size={28} className="text-[#A855F7] opacity-60 mb-2" />
            <span className="text-xs font-semibold text-[#A1A6B5]">Lobiye Hoş Geldiniz!</span>
            <p className="text-[11px] max-w-xs mt-1">
              Parti kodunu aldıktan sonra takım arkadaşlarınla taktik konuşmak için ilk mesajı yaz.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            const isDiscordLink = msg.message_type === 'discord_link' || msg.message.includes('discord.gg')

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white text-[11px] font-bold shrink-0 overflow-hidden mt-0.5">
                  {msg.sender?.avatar_url ? (
                    <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (msg.sender?.username?.[0] || '?').toUpperCase()
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name & Verified Badge */}
                  <div className={`flex items-center gap-1.5 mb-1 text-[11px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-[#F5F5FA]">
                      {isMe ? 'Sen' : msg.sender?.username || 'Oyuncu'}
                    </span>
                    {msg.sender?.riot_verified && (
                      <span title="Riot Verified" className="text-[#36D399]">
                        <CheckCircle2 size={11} />
                      </span>
                    )}
                    <span className="text-[9px] text-[#686E80] font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed break-words ${
                      isDiscordLink
                        ? 'bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#F5F5FA]'
                        : isMe
                        ? 'bg-[#A855F7] text-white rounded-tr-none'
                        : 'bg-[#1C2030] text-[#E2E8F0] border border-[rgba(255,255,255,0.06)] rounded-tl-none'
                    }`}
                  >
                    {isDiscordLink ? (
                      <div className="flex items-center gap-2">
                        <Volume2 size={16} className="text-[#5865F2] shrink-0" />
                        <div>
                          <p className="font-semibold text-[#5865F2]">{msg.message}</p>
                          <a
                            href={msg.message.replace(/.*(https:\/\/discord\.gg\/\S+).*/, '$1')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-white underline mt-1 hover:text-[#5865F2]"
                          >
                            <span>Odaya Katıl</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      msg.message
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <div className="p-3 bg-[#0E1018] border-t border-[rgba(255,255,255,0.06)]">
        {isMember ? (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Taktik veya mesaj yaz... (Enter ile gönder)"
              className="input-game text-xs flex-1 py-2"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={sending || !inputMsg.trim()}
              className="btn-primary text-xs py-2 px-3.5 shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={13} />
              <span className="hidden sm:inline">Gönder</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-1.5 text-xs text-[#A1A6B5] flex items-center justify-center gap-1.5">
            <AlertCircle size={14} className="text-[#FBBF24]" />
            <span>Sohbete katılmak için önce lobiye katılmalı veya başvurunuz onaylanmalıdır.</span>
          </div>
        )}
      </div>
    </div>
  )
}
