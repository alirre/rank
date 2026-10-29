# DuoRank - FPS Takım Arkadaşı Bulma Platformu

DuoRank; Valorant başta olmak üzere rekabetçi FPS oyunlarında oyuncuların kendilerine uygun takım arkadaşları bulabileceği, grup ve lobi oluşturabileceği, oyun sonrasında birbirlerini güvenilirlik ve davranış odaklı yıldız sistemiyle değerlendirebileceği modern, full-stack bir web platformudur.

---

## 🚀 Öne Çıkan Özellikler

1. **Oyuncu Keşfet & Eşleşme:**
   - Rank, rol (Düellocu, Kontrol Uzmanı, Gözcü, Öncü), sunucu bölgesi, mikrofon ve oyun tarzına göre dinamik filtreleme.
   - Gerçek değerlendirme puanları ve inceleme sayılarıyla güvenilir takım arkadaşı seçimi.

2. **Grup & Lobi Yönetimi:**
   - Açık veya onaylı (başvurulu) grup oluşturma.
   - İstenen roller, mikrofon zorunluluğu, rank aralığı ve toplam kontenjan belirleme.
   - Grup sahibi için başvuru onay/red mekanizması ve üyeleri yönetebilme.

3. **Lobi Kodu ve Gizlilik:**
   - Lobi kodunu herkese açık veya yalnızca kabul edilen grup üyelerine gösterme desteği.
   - Tek tıkla panoya kopyalama ve geri bildirim bildirimi.

4. **Yıldızlı Güvenilirlik ve Değerlendirme Sistemi:**
   - 1-5 yıldız puanlama, yazılı yorum ve davranış etiketleri (İletişimi iyi, Saygılı, Tilt olmuyor, Toksik, Troll vb.).
   - Aynı oyun oturumunda yalnızca gerçek takım arkadaşlarını puanlayabilme; kendi kendine puan verme veya mükerrer puanlamayı engelleyen veritabanı kuralları.
   - Otomatik ortalama ve inceleme sayısı tetikleyicisi (PostgreSQL Trigger).

5. **Kullanıcı Güvenliği & Moderasyon:**
   - Oyuncuları veya yorumları ihlal durumunda raporlama sistemi.
   - Yönetici (Admin) kontrol paneli ile şikayetleri inceleme ve platform istatistiklerini takip etme.

---

## 🛠️ Teknoloji Yığını

- **Frontend:** Next.js (App Router), TypeScript, React, Tailwind CSS
- **İkonlar & Bildirimler:** Lucide React, React Hot Toast
- **Backend & Veritabanı:** Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **Tasarım:** Koyu tema, antrasit kartlar, kırmızı (`#e63946`) ve mor (`#7c3aed`) vurgu renkleri

---

## 📁 Veritabanı Kurulumu (Supabase)

1. [Supabase](https://supabase.com) üzerinde yeni bir proje oluşturun.
2. Supabase SQL Editörünü açın.
3. Proje dizinindeki `supabase/schema.sql` dosyasının içeriğini kopyalayıp SQL Editöründe çalıştırın.
   - Tablolar (`profiles`, `games`, `game_profiles`, `groups`, `group_members`, `group_applications`, `reviews`, `user_reports`, `notifications` vb.)
   - Otomatik profil oluşturma ve yıldız puanı hesaplama trigger'ları
   - Row Level Security (RLS) politikaları eksiksiz kurulacaktır.

---

## ⚙️ Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Ortam Değişkenlerini Ayarlayın:**
   `.env.example` dosyasını `.env.local` olarak kopyalayın ve Supabase bilgilerinizi girin:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda `http://localhost:3000` adresine gidin.

4. **Production Build:**
   ```bash
   npm run build
   ```

---

## 📄 Sayfa Haritası

- `/` - Ana Sayfa (Hero, Canlı İstatistikler, Nasıl Çalışır, Aktif Gruplar, Güvenilir Oyuncular)
- `/oyuncular` - Oyuncu Arama & Filtreleme
- `/gruplar` - Grup & Lobi Keşfetme
- `/grup/olustur` - Yeni Grup İlanı Oluşturma
- `/grup/[id]` - Grup Detayı, Üye Yönetimi, Lobi Kodu ve Başvurular
- `/profil/[id]` - Oyuncu Profil Sayfası ve Alınan Değerlendirmeler
- `/profil/duzenle` - Profil Bilgilerini ve Oyun Kimliğini Düzenleme
- `/degerlendir/[id]` - Oyun Sonu Takım Arkadaşlarını Puanlama Formu
- `/bildirimler` - Başvuru, Davet ve Değerlendirme Bildirimleri
- `/basvurular` - Yapılan Grup Başvuruları ve Durumları
- `/ayarlar` - Hesap ve Şifre Güvenliği Ayarları
- `/rapor` - Oyuncu / Yorum İhlali Bildirme
- `/admin` - Yönetici & Moderasyon Paneli
- `/giris` - Kullanıcı Girişi
- `/kayit` - Yeni Hesap Kaydı
- `/sifremi-unuttum` - Şifre Sıfırlama
- `/kullanim-kosullari` - Platform Kullanım Şartları
- `/gizlilik-politikasi` - Gizlilik İlkeleri
