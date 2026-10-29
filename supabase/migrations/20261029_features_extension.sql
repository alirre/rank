-- DuoRank Features Extension Migration
-- 2026-10-29
-- Non-destructive addition of skins, clips, availability, and favorites

-- 1. EXTEND PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS favorite_skins JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{"weekdays": ["evening"], "weekend": ["afternoon", "evening"], "timezone": "Europe/Istanbul"}'::JSONB,
ADD COLUMN IF NOT EXISTS privacy_show_clips BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS privacy_show_skins BOOLEAN DEFAULT true;

-- 2. PROFILE CLIPS (EN İYİ VURUŞLAR / HIGHLIGHTS)
CREATE TABLE IF NOT EXISTS public.profile_clips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    agent TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    is_featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profile_clips
ALTER TABLE public.profile_clips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view profile clips" ON public.profile_clips;
CREATE POLICY "Public view profile clips" ON public.profile_clips
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = profile_clips.user_id 
        AND (profiles.privacy_show_clips = true OR profiles.id = auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can insert own clips" ON public.profile_clips;
CREATE POLICY "Users can insert own clips" ON public.profile_clips
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can update own clips" ON public.profile_clips;
CREATE POLICY "Users can update own clips" ON public.profile_clips
FOR UPDATE USING (
    auth.uid() = user_id
) WITH CHECK (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can delete own clips" ON public.profile_clips;
CREATE POLICY "Users can delete own clips" ON public.profile_clips
FOR DELETE USING (
    auth.uid() = user_id
);

-- 3. USER FAVORITES (FAVORİ OYUNCULAR)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    favorite_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, favorite_user_id),
    CONSTRAINT no_self_favorite CHECK (user_id != favorite_user_id)
);

-- RLS for user_favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.user_favorites;
CREATE POLICY "Users can view own favorites" ON public.user_favorites
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON public.user_favorites;
CREATE POLICY "Users can add favorites" ON public.user_favorites
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON public.user_favorites;
CREATE POLICY "Users can remove favorites" ON public.user_favorites
FOR DELETE USING (auth.uid() = user_id);

-- 4. REALTIME PUBLICATION ENHANCEMENT
-- Make sure groups table sends full replication data for Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'groups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
