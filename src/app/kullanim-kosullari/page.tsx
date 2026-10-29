import MainLayout from '@/components/layout/MainLayout'

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">
          Kullanım Koşulları
        </h1>

        <div className="card bg-[#111118] border-[#2a2a3a] p-8 space-y-6 text-sm text-[#8b8b9e] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Genel Bakış ve Kabul</h2>
            <p>
              DuoRank platformunu kullanarak, bu Kullanım Koşulları'nı ve Gizlilik Politikası'nı kabul etmiş sayılırsınız. Platform, rekabetçi FPS oyuncularının birbirlerini bulmalarını ve değerlendirmelerini sağlamak amacıyla kurulmuştur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Davranış Kuralları ve Toksisite Sıfır Toleransı</h2>
            <p>
              Platformda nefret söylemi, ırkçılık, taciz, küfür veya oyuncuları hedef gösterici davranışlar kesinlikle yasaktır. Takım arkadaşlarına kasıtlı trollük yapan, oyunu terk eden veya asılsız değerlendirme gönderen hesaplar askıya alınabilir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Değerlendirme Sistemi Dürüstlüğü</h2>
            <p>
              Yıldız değerlendirmeleri ve etiketler yalnızca birlikte oynanmış gerçek oyun oturumlarını yansıtmalıdır. Kendi hesabına puan kasmak veya sahte hesaplarla başka oyuncuların puanını kasten düşürmek kalıcı yasaklama sebebidir.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">4. Bağımsızlık Beyanı</h2>
            <p>
              DuoRank; Riot Games, Valve, Blizzard Entertainment veya diğer oyun geliştiricileriyle resmi bir ortaklığa ya da sponsorluğa sahip değildir. Oyun içi adlar ve ticari markalar ilgili hak sahiplerine aittir.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
