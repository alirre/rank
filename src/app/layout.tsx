import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'DuoRank - FPS Takım Arkadaşı Bul',
    template: '%s | DuoRank',
  },
  description: 'Valorant ve diğer rekabetçi FPS oyunlarında sana uygun takım arkadaşları bul. Rank, rol ve oyun tarzına göre eşleş.',
  keywords: ['valorant', 'fps', 'takım arkadaşı', 'duo', 'rank', 'oyun', 'esports'],
  authors: [{ name: 'DuoRank' }],
  openGraph: {
    title: 'DuoRank - FPS Takım Arkadaşı Bul',
    description: 'Valorant ve diğer rekabetçi FPS oyunlarında sana uygun takım arkadaşları bul.',
    type: 'website',
    locale: 'tr_TR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DuoRank - FPS Takım Arkadaşı Bul',
    description: 'Valorant ve diğer rekabetçi FPS oyunlarında sana uygun takım arkadaşları bul.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#f8f8fc',
              border: '1px solid #2a2a3a',
              borderRadius: '10px',
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#1a1a24' },
              duration: 3000,
            },
            error: {
              iconTheme: { primary: '#e63946', secondary: '#1a1a24' },
              duration: 4000,
            },
          }}
        />
      </body>
    </html>
  )
}
