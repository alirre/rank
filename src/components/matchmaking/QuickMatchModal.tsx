'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Zap, X, Mic, MicOff, Globe, Sparkles, CheckCircle2,
  Users, Gamepad2, ShieldCheck, Flame
} from 'lucide-react'
import { ALL_VALORANT_TIERS, VALORANT_ROLES, SERVERS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface QuickMatchModalProps {
  isOpen: boolean
  onClose: () => void
  userRank?: string
  userMic?: boolean
}

// Victorious Matchmaking Chime using native Web Audio API (Zero external assets needed)
function playMatchFoundAudio() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    const notes = [440, 554.37, 659.25, 880] // A4, C#5, E5, A5 fanfare
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)

      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.42)
    })
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export default function QuickMatchModal({
  isOpen,
  onClose,
  userRank = 'Platin 1',
  userMic = true,
}: QuickMatchModalProps) {
  const router = useRouter()
  const [searching, setSearching] = useState(false)
  const [selectedRank, setSelectedRank] = useState(userRank)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [micRequired, setMicRequired] = useState(userMic)
  const [serverRegion, setServerRegion] = useState('tr')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [matchedGroup, setMatchedGroup] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Timer while searching
  useEffect(() => {
    if (searching) {
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)

      // Poll queue status every 2.5s
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch('/api/matchmaking')
          if (res.ok) {
            const data = await res.json()
            if (data.status === 'matched' && data.groupId) {
              handleMatchSuccess(data.groupId)
            }
          }
        } catch {}
      }, 2500)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [searching])

  const handleMatchSuccess = (groupId: string) => {
    setSearching(false)
    setMatchedGroup(groupId)
    playMatchFoundAudio()
    toast.success('🎯 Takım Arkadaşı Bulundu! Lobiye aktarılıyorsunuz...', { duration: 3000 })

    setTimeout(() => {
      onClose()
      router.push(`/grup/${groupId}`)
    }, 1800)
  }

  const handleStartSearch = async () => {
    setSearching(true)
    try {
      const res = await fetch('/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rankTier: selectedRank,
          preferredRole: selectedRole,
          micRequired,
          serverRegion,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Arama başlatılamadı.')

      if (data.matched && data.groupId) {
        handleMatchSuccess(data.groupId)
      }
    } catch (err: any) {
      setSearching(false)
      toast.error(err.message || 'Eşleşme kuyruğuna girilemedi.')
    }
  }

  const handleCancelSearch = async () => {
    setSearching(false)
    try {
      await fetch('/api/matchmaking', { method: 'DELETE' })
    } catch {}
  }

  if (!isOpen) return null

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#141722] border border-[rgba(255,255,255,0.1)] rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(168,85,247,0.25)] overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            if (searching) handleCancelSearch()
            onClose()
          }}
          className="absolute top-5 right-5 text-[#A1A6B5] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {matchedGroup ? (
          /* MATCH FOUND STATE */
          <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#36D399]/20 border-2 border-[#36D399] flex items-center justify-center text-[#36D399] shadow-[0_0_40px_rgba(54,211,153,0.4)]">
              <CheckCircle2 size={42} className="animate-bounce" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-[#36D399] font-mono font-bold block mb-1">
                Eşleşme Tamamlandı!
              </span>
              <h2 className="text-2xl font-black text-[#F5F5FA] font-heading">
                Takım Arkadaşın Bulundu!
              </h2>
              <p className="text-xs text-[#A1A6B5] mt-1">
                Otomatik oluşturulan Duo Lobisine yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        ) : searching ? (
          /* RADAR SEARCHING STATE */
          <div className="text-center py-6 space-y-6">
            {/* Animated Radar Visual */}
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
              {/* Concentric Pulsing Rings */}
              <div className="absolute inset-0 rounded-full border border-[#A855F7]/20 animate-ping opacity-40 duration-1000" />
              <div className="absolute inset-4 rounded-full border border-[#A855F7]/30" />
              <div className="absolute inset-10 rounded-full border border-[#A855F7]/40" />

              {/* Sweeping Radar Scanner */}
              <div
                className="absolute inset-0 rounded-full animate-spin"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 70%, rgba(168, 85, 247, 0.4) 100%)',
                  animationDuration: '2.5s',
                }}
              />

              {/* Center Glowing Orb */}
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white shadow-[0_0_30px_#A855F7]">
                <Zap size={28} className="animate-pulse" />
              </div>
            </div>

            {/* Timer & Status */}
            <div>
              <span className="text-3xl font-mono font-black text-[#F5F5FA] tracking-wider block mb-1">
                {formatTime(elapsedSeconds)}
              </span>
              <p className="text-xs text-[#A1A6B5] font-medium">
                {selectedRank} kademesinde uyumlu oyuncular taranıyor...
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancelSearch}
              className="btn-secondary text-xs py-2 px-6 rounded-xl hover:border-[#F87171] hover:text-[#F87171] transition-all cursor-pointer"
            >
              Aramayı İptal Et
            </button>
          </div>
        ) : (
          /* PREFERENCES SELECTION FORM */
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center text-white shadow-lg">
                <Zap size={22} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F5F5FA] font-heading">
                  Hemen Duo Bul (Hızlı Eşleşme)
                </h2>
                <p className="text-xs text-[#A1A6B5]">
                  İlan açmadan 15-30 saniye içinde sana en uygun takım arkadaşıyla eşleş
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Rank Selection */}
              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                  Hedef Rank Kademesi
                </label>
                <select
                  value={selectedRank}
                  onChange={(e) => setSelectedRank(e.target.value)}
                  className="input-game text-xs"
                >
                  {ALL_VALORANT_TIERS.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>

              {/* Preferred Role Selection */}
              <div>
                <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                  Senin Rolün (İsteğe Bağlı)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VALORANT_ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(selectedRole === r.name ? null : r.name)}
                      className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                        selectedRole === r.name
                          ? 'bg-[#A855F7]/15 border-[#A855F7] text-white'
                          : 'bg-[#0E1018] border-[rgba(255,255,255,0.06)] text-[#A1A6B5] hover:border-[rgba(255,255,255,0.15)]'
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span>{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mic & Server Preferences */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                    Mikrofon
                  </label>
                  <button
                    type="button"
                    onClick={() => setMicRequired(!micRequired)}
                    className={`w-full p-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      micRequired
                        ? 'bg-[#36D399]/15 border-[#36D399] text-[#36D399]'
                        : 'bg-[#0E1018] border-[rgba(255,255,255,0.06)] text-[#686E80]'
                    }`}
                  >
                    {micRequired ? <Mic size={14} /> : <MicOff size={14} />}
                    <span>{micRequired ? 'Mikrofon Şart' : 'Fark Etmez'}</span>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                    Sunucu
                  </label>
                  <select
                    value={serverRegion}
                    onChange={(e) => setServerRegion(e.target.value)}
                    className="input-game text-xs py-2.5"
                  >
                    {SERVERS.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartSearch}
                className="btn-primary w-full py-3 text-sm font-bold justify-center rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <Zap size={16} />
                <span>Eşleşme Aramayı Başlat</span>
              </button>
              <p className="text-[10px] text-center text-[#686E80] mt-2">
                ⚡ Ortalama eşleşme süresi: 18 saniye
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
