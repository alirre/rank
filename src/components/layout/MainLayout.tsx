import Header from './Header'
import Footer from './Footer'
import FloatingChatWidget from '@/components/chat/FloatingChatWidget'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingChatWidget />
    </div>
  )
}
