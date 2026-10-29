import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#e63946]/10 text-[#e63946] flex items-center justify-center mx-auto mb-2">
            <AlertCircle size={36} />
          </div>
          <span className="text-5xl font-black text-white block">404</span>
          <h1 className="text-xl font-bold text-white tracking-tight">Sayfa Bulunamadı</h1>
          <p className="text-sm text-[#8b8b9e] leading-relaxed">
            Aradığınız grup, oyuncu profili veya sayfa mevcut değil ya da silinmiş olabilir.
          </p>
          <div className="pt-4">
            <Link href="/" className="btn btn-primary text-xs py-2.5 px-6 inline-flex">
              <ArrowLeft size={14} />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
