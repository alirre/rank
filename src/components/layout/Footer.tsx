import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#090A0F] mt-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Logo & Manifesto */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Logo size={34} />
            </Link>
            <p className="text-xs text-[#A1A6B5] leading-relaxed max-w-sm">
              Rekabetçi FPS oyuncuları için özel olarak tasarlanmış takım arkadaşı ve lobi eşleşme platformu. Rank'ini tek başına kasma.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#686E80]">
              <span>Made for competitive gamers.</span>
            </div>
          </div>

          {/* Menü Linkleri */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] mb-4 font-mono">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A1A6B5]">
              <li>
                <Link href="/oyuncular" className="hover:text-white transition-colors">
                  Oyuncu Keşfet
                </Link>
              </li>
              <li>
                <Link href="/gruplar" className="hover:text-white transition-colors">
                  Grup Keşfet
                </Link>
              </li>
              <li>
                <Link href="/grup/olustur" className="hover:text-white transition-colors">
                  Grup Oluştur
                </Link>
              </li>
              <li>
                <Link href="/#nasil-calisir" className="hover:text-white transition-colors">
                  Nasıl Çalışır?
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal & Şartlar */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5FA] mb-4 font-mono">
              Yasal & Güvenlik
            </h4>
            <ul className="space-y-2.5 text-xs text-[#A1A6B5]">
              <li>
                <Link href="/kullanim-kosullari" className="hover:text-white transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link href="/gizlilik-politikasi" className="hover:text-white transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/rapor" className="hover:text-white transition-colors">
                  İhlal & Raporlama
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#686E80]">
          <p>© {new Date().getFullYear()} DuoRank. Tüm hakları saklıdır.</p>
          <p className="text-[11px]">
            DuoRank bağımsız bir platformdur; Riot Games veya ilgili oyun firmalarıyla ticari bağı yoktur.
          </p>
        </div>
      </div>
    </footer>
  )
}
