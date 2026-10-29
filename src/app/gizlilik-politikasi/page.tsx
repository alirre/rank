import MainLayout from '@/components/layout/MainLayout'

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">
          Gizlilik Politikası
        </h1>

        <div className="card bg-[#111118] border-[#2a2a3a] p-8 space-y-6 text-sm text-[#8b8b9e] leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-2">1. Toplanan Veriler</h2>
            <p>
              DuoRank; hesap oluşturma sürecinde e-posta adresinizi ve kullanıcı adınızı, isteğe bağlı olarak profilinizde paylaştığınız oyun içi kimliğinizi (Riot ID), tercih ettiğiniz rollerinizi ve oyun tarzınızı saklar.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">2. Verilerin Kullanımı</h2>
            <p>
              Toplanan veriler yalnızca size uygun takım arkadaşı önerileri sunmak, güvenilirlik puanlarını hesaplamak ve platformun güvenliğini sağlamak için kullanılır. Verileriniz üçüncü taraf reklamverenlere satılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-2">3. Lobi Bilgisi ve Gizlilik Tercihleri</h2>
            <p>
              Grup oluştururken girdiğiniz lobi veya parti kodları, belirlediğiniz gizlilik seçeneğine göre (örneğin sadece kabul edilen üyelere) gösterilir. Profilinizdeki son görülme bilgisi de gizlilik ayarlarınızdan kapatılabilir.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
