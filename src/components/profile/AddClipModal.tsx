'use client'

import { useState } from 'react'
import { VALORANT_AGENTS } from '@/lib/constants'
import { X, Film, AlertCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddClipModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddClipModal({
  isOpen,
  onClose,
  onSuccess,
}: AddClipModalProps) {
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [agent, setAgent] = useState('Jett')
  const [description, setDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg('Lütfen klibiniz için bir başlık yazın.')
      return
    }

    if (!videoUrl.trim()) {
      setErrorMsg('Lütfen bir video linki girin.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          videoUrl,
          agent,
          description,
          isFeatured,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Klip kaydedilemedi.')
      }

      toast.success('Klip başarıyla eklendi!')
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Klip kaydedilirken bir hata oluştu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in-fast">
      <div className="bg-[#141722] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] flex items-center justify-center">
              <Film size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F5FA] font-heading">
                Yeni Vuruş Klibi Ekle
              </h2>
              <p className="text-xs text-[#A1A6B5] mt-0.5">
                YouTube, Streamable veya Medal.tv bağlantısı paylaşabilirsin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#A1A6B5] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-[#F87171]/10 border border-[#F87171]/30 rounded-xl flex items-center gap-2 text-xs text-[#F87171]">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
              Klip Başlığı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Bind A Site 1v4 Clutch Ace"
              className="input-game text-xs"
              maxLength={80}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
              Video Bağlantısı (URL) *
            </label>
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... veya https://streamable.com/..."
              className="input-game text-xs font-mono"
            />
            <span className="text-[10px] text-[#686E80] mt-1 block">
              Desteklenenler: YouTube, YouTube Shorts, Medal.tv, Streamable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
                Oynadığın Ajan
              </label>
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="input-game text-xs"
              >
                {VALORANT_AGENTS.map((a) => (
                  <option key={a.id} value={a.name}>{a.name} ({a.role})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs text-[#F5F5FA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#A855F7] rounded cursor-pointer"
                />
                <span>Profilimde öne çıkar</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#A1A6B5] block mb-1.5">
              Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pozisyon, rank maçı veya raunt hakkında kısa not..."
              className="input-game text-xs min-h-[70px] resize-none"
              maxLength={200}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs py-2 px-5"
            >
              {submitting ? 'Ekleniyor...' : 'Klibi Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
