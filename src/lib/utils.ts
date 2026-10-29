import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: tr,
  })
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  return format(new Date(date), fmt, { locale: tr })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: tr })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getRankColor(rank: string): string {
  const r = rank.toLowerCase()
  if (r.includes('iron')) return '#6b7280'
  if (r.includes('bronze')) return '#92400e'
  if (r.includes('silver')) return '#9ca3af'
  if (r.includes('gold')) return '#f59e0b'
  if (r.includes('platin')) return '#06b6d4'
  if (r.includes('diamond') || r.includes('elmas')) return '#818cf8'
  if (r.includes('ascendant') || r.includes('yükselen')) return '#34d399'
  if (r.includes('immortal') || r.includes('ölümsüz')) return '#f43f5e'
  if (r.includes('radiant') || r.includes('parlak')) return '#fbbf24'
  return '#8b8b9e'
}

export function getStarColor(rating: number): string {
  if (rating >= 4.5) return '#fbbf24'
  if (rating >= 3.5) return '#f59e0b'
  if (rating >= 2.5) return '#fb923c'
  if (rating >= 1.5) return '#f97316'
  return '#ef4444'
}

export function truncate(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}
