'use client'

import { useState } from 'react'
import type { ProfileClip } from '@/types/database'
import { parseVideoEmbedUrl } from '@/lib/profile-utils'
import { Film, Play, Trash2, Star, Plus, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ClipGalleryProps {
  clips: ProfileClip[]
  isOwner?: boolean
  onAddClipClick?: () => void
  onClipDeleted?: () => void
}

export default function ClipGallery({
  clips = [],
  isOwner = false,
  onAddClipClick,
  onClipDeleted,
}: ClipGalleryProps) {
  const [activeClip, setActiveClip] = useState<ProfileClip | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (clipId: string) => {
    if (!confirm('Bu klibi profilinizden silmek istediğinize emin misiniz?')) return
    setDeletingId(clipId)

    try {
      const res = await fetch(`/api/clips?id=${clipId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Klip silinemedi')
      }
      toast.success('Klip başarıyla silindi.')
      if (onClipDeleted) onClipDeleted()
      if (activeClip?.id === clipId) setActiveClip(null)
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card-game p-6 space-y-4 bg-[#141722]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <h2 className="text-base font-bold text-[#F5F5FA] font-heading flex items-center gap-2">
            <Film size={17} className="text-[#A855F7]" />
            <span>En İyi Vuruşlarım ({clips.length})</span>
          </h2>
          <p className="text-xs text-[#A1A6B5] mt-0.5">
            Öne çıkan vuruşlar, ace'ler ve kritik raunt anları.
          </p>
        </div>

        {isOwner && onAddClipClick && (
          <button
            type="button"
            onClick={onAddClipClick}
            className="btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Klip Ekle</span>
          </button>
        )}
      </div>

      {/* Grid */}
      {clips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => {
            return (
              <div
                key={clip.id}
                className="rounded-xl bg-[#0E1018] border border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col justify-between group hover:border-[#A855F7]/30 transition-all"
              >
                {/* Thumbnail / Play Preview */}
                <div
                  onClick={() => setActiveClip(clip)}
                  className="relative aspect-video bg-[#090A0F] cursor-pointer flex items-center justify-center overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

                  {/* Play Button Icon */}
                  <div className="w-12 h-12 rounded-full bg-[#A855F7]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#A855F7] transition-all z-20">
                    <Play size={20} className="ml-1 fill-white" />
                  </div>

                  {/* Badges on preview */}
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                    {clip.agent && (
                      <span className="badge-role bg-black/60 text-white backdrop-blur-sm border-white/10 text-[10px]">
                        {clip.agent}
                      </span>
                    )}
                    {clip.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/40 flex items-center gap-1 backdrop-blur-sm">
                        <Star size={10} className="fill-[#FBBF24]" />
                        Öne Çıkan
                      </span>
                    )}
                  </div>
                </div>

                {/* Content info */}
                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xs font-bold text-[#F5F5FA] line-clamp-1 mb-1 group-hover:text-[#A855F7] transition-colors">
                      {clip.title}
                    </h3>
                    {clip.description && (
                      <p className="text-[11px] text-[#A1A6B5] line-clamp-2 leading-relaxed">
                        {clip.description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-[rgba(255,255,255,0.04)] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveClip(clip)}
                      className="text-[#A855F7] hover:underline font-semibold"
                    >
                      İzle
                    </button>

                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(clip.id)}
                        disabled={deletingId === clip.id}
                        className="text-[#F87171] hover:text-red-400 p-1"
                        title="Klibi Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <Link
                        href={`/rapor?clip=${clip.id}`}
                        className="text-[#686E80] hover:text-[#F87171]"
                        title="İçeriği Bildir"
                      >
                        <AlertTriangle size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-10 text-center text-[#686E80] border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl">
          <Film size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-xs text-[#A1A6B5]">Henüz eklenmiş bir vuruş klibi yok.</p>
          {isOwner && onAddClipClick && (
            <button
              type="button"
              onClick={onAddClipClick}
              className="btn-secondary text-xs py-1.5 px-3.5 mt-3"
            >
              İlk Klibini Ekle
            </button>
          )}
        </div>
      )}

      {/* Video Modal Player */}
      {activeClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in-fast">
          <div className="bg-[#141722] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5FA] font-heading">
                  {activeClip.title}
                </h3>
                {activeClip.agent && (
                  <span className="text-[11px] text-[#A855F7]">
                    Ajan: {activeClip.agent}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveClip(null)}
                className="w-8 h-8 rounded-lg bg-[#0E1018] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[#A1A6B5] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Embedded Player */}
            <div className="relative aspect-video bg-black">
              {(() => {
                const parsed = parseVideoEmbedUrl(activeClip.video_url)
                if (parsed.type === 'iframe') {
                  return (
                    <iframe
                      src={parsed.src}
                      title={activeClip.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                }
                if (parsed.type === 'video') {
                  return (
                    <video
                      src={parsed.src}
                      controls
                      autoPlay
                      className="w-full h-full"
                    />
                  )
                }
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#A1A6B5] p-6 text-center">
                    <p className="mb-3">Video doğrudan oynatılamadı.</p>
                    <a
                      href={activeClip.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs py-2 px-4"
                    >
                      Kaynağında İzle ↗
                    </a>
                  </div>
                )
              })()}
            </div>

            {activeClip.description && (
              <div className="p-4 bg-[#0E1018] text-xs text-[#A1A6B5]">
                {activeClip.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
