-- DuoRank Security Fixes Migration
-- Önkoşul: 20261029_features_extension.sql ÖNCE uygulanmış olmalı
-- (favorite_skins, privacy_show_clips, privacy_show_skins sütunları gerekli)

BEGIN;

-- 1. PROFİL YETKİ YÜKSELTME AÇIĞI
--    Kullanıcılar artık yalnızca kendi profilinde değiştirmelerine izin verilen
--    sütunları güncelleyebilir. is_admin, is_suspended, suspension_reason,
--    avg_rating, review_count, username, created_at vb. kilitlenir.
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  display_name, bio, riot_id, riot_tag, rank,
  primary_agent, secondary_agent, preferred_roles,
  server_region, play_style, microphone,
  privacy_last_seen, usual_hours, last_seen_at,
  avatar_url, country,
  favorite_skins, privacy_show_clips, privacy_show_skins
) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. GRUBA KENDİNİ 'owner' ROLÜYLE EKLEME AÇIĞI
--    Açık gruba katılırken role = 'member' zorunlu. Grup sahibinin kendi
--    grubuna 'owner' satırı eklemesi (ilk oluşturma) ilk dalda serbest kalır.
DROP POLICY IF EXISTS "Strict member join policy" ON public.group_members;
CREATE POLICY "Strict member join policy" ON public.group_members
  FOR INSERT WITH CHECK (
    -- 1. Grup sahibi üye/owner satırı ekleyebilir
    EXISTS (
      SELECT 1 FROM public.groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
    OR
    -- 2. Açık, aktif ve boş kontenjanlı grupta kullanıcı yalnızca 'member' olarak kendini ekleyebilir
    (
      auth.uid() = user_id
      AND group_members.role = 'member'
      AND EXISTS (
        SELECT 1 FROM public.groups
        WHERE groups.id = group_members.group_id
        AND groups.join_type = 'open'
        AND groups.status = 'active'
        AND groups.slots_filled < groups.slots_total
      )
    )
  );

-- 3. SECURITY DEFINER FONKSİYONLARDA search_path SABİTLEME
--    Saldırganın şema yolunu manipüle ederek fonksiyon içinde farklı nesne
--    çağırtmasını engeller.
ALTER FUNCTION public.join_open_group(UUID) SET search_path = public;
ALTER FUNCTION public.get_group_lobby_code(UUID) SET search_path = public;

-- Anonim kullanıcılar bu fonksiyonları çağıramasın (fonksiyonlar zaten
-- auth.uid() kontrolü yapıyor, bu ek bir savunma katmanı)
REVOKE EXECUTE ON FUNCTION public.join_open_group(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_group_lobby_code(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_open_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_lobby_code(UUID) TO authenticated;

COMMIT;

-- ============================================================
-- DOĞRULAMA (migration'dan sonra çalıştır)
-- ============================================================
-- Beklenen: yalnızca GRANT listesindeki sütunlar dönmeli
-- SELECT column_name FROM information_schema.column_privileges
-- WHERE table_schema = 'public' AND table_name = 'profiles'
--   AND grantee = 'authenticated' AND privilege_type = 'UPDATE';
--
-- Beklenen: boş dönmeli
-- SELECT privilege_type FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name = 'profiles'
--   AND grantee = 'authenticated' AND privilege_type = 'UPDATE';
