-- DuoRank Database Schema & Migrations
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    riot_id TEXT,
    riot_tag TEXT,
    rank TEXT,
    primary_agent TEXT,
    secondary_agent TEXT,
    preferred_roles TEXT[],
    country TEXT DEFAULT 'TR',
    server_region TEXT DEFAULT 'tr',
    play_style TEXT DEFAULT 'serious',
    microphone BOOLEAN DEFAULT true,
    usual_hours TEXT[] DEFAULT ARRAY['evening']::TEXT[],
    avg_rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    privacy_last_seen BOOLEAN DEFAULT true,
    privacy_profile_public BOOLEAN DEFAULT true,
    favorite_skins JSONB DEFAULT '[]'::JSONB,
    availability_schedule JSONB DEFAULT '{"weekdays": ["evening"], "weekend": ["afternoon", "evening"], "timezone": "Europe/Istanbul"}'::JSONB,
    privacy_show_clips BOOLEAN DEFAULT true,
    privacy_show_skins BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GAMES
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Seed Games
INSERT INTO public.games (id, name, slug, icon_url, is_active) VALUES
('valorant', 'Valorant', 'valorant', '🎯', true),
('csgo', 'CS2', 'cs2', '🔫', true),
('overwatch', 'Overwatch 2', 'overwatch-2', '🛡️', true),
('apexlegends', 'Apex Legends', 'apex-legends', '💫', true),
('rainbowsix', 'Rainbow Six Siege', 'rainbow-six-siege', '🏰', true),
('pubg', 'PUBG', 'pubg', '🪖', true),
('fortnite', 'Fortnite', 'fortnite', '🏗️', true)
ON CONFLICT (id) DO NOTHING;

-- 3. GAME PROFILES
CREATE TABLE IF NOT EXISTS public.game_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    in_game_name TEXT,
    in_game_id TEXT,
    rank TEXT,
    preferred_roles TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, game_id)
);

-- 4. GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    game_mode TEXT,
    title TEXT NOT NULL,
    description TEXT,
    min_rank TEXT,
    max_rank TEXT,
    slots_total INTEGER NOT NULL DEFAULT 5,
    slots_filled INTEGER NOT NULL DEFAULT 1,
    roles_wanted TEXT[],
    agents_wanted TEXT[],
    mic_required BOOLEAN DEFAULT false,
    server_region TEXT DEFAULT 'tr',
    play_style TEXT DEFAULT 'serious',
    join_type TEXT DEFAULT 'open' CHECK (join_type IN ('open', 'application')),
    discord_username TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GROUP SECRETS (Isolated for party/lobby code security)
CREATE TABLE IF NOT EXISTS public.group_secrets (
    group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
    lobby_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 7. GROUP APPLICATIONS
CREATE TABLE IF NOT EXISTS public.group_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    applicant_rank TEXT,
    applicant_primary_agent TEXT,
    applicant_role TEXT,
    applicant_microphone BOOLEAN,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, applicant_id)
);

-- 8. GROUP INVITES
CREATE TABLE IF NOT EXISTS public.group_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, invitee_id)
);

-- 9. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    tags TEXT[],
    is_valid BOOLEAN DEFAULT true,
    flagged_for_review BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id),
    UNIQUE(reviewer_id, reviewee_id, group_id)
);

-- 10. REVIEW REPORTS
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 11. USER REPORTS
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 12. USER BLOCKS
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MODERATION ACTIONS
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_review_id UUID REFERENCES public.reviews(id) ON DELETE SET NULL,
    target_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PROFILE CLIPS
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

-- 16. USER FAVORITES
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    favorite_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, favorite_user_id),
    CONSTRAINT no_self_favorite CHECK (user_id != favorite_user_id)
);

-- RATING CALCULATION FUNCTION & TRIGGER
CREATE OR REPLACE FUNCTION public.recalculate_user_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_user UUID;
    avg_score NUMERIC(3,2);
    total_reviews INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_user := OLD.reviewee_id;
    ELSE
        target_user := NEW.reviewee_id;
    END IF;

    SELECT COALESCE(AVG(rating), 0), COUNT(*)
    INTO avg_score, total_reviews
    FROM public.reviews
    WHERE reviewee_id = target_user AND is_valid = true;

    UPDATE public.profiles
    SET avg_rating = ROUND(avg_score, 2),
        review_count = total_reviews
    WHERE id = target_user;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_recalculate_user_rating ON public.reviews;
CREATE TRIGGER trigger_recalculate_user_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_rating();

-- GROUP AUTO-INCREMENT SLOTS ON MEMBER JOIN/LEAVE
CREATE OR REPLACE FUNCTION public.sync_group_slots()
RETURNS TRIGGER AS $$
DECLARE
    grp_id UUID;
    cnt INTEGER;
    max_slots INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        grp_id := OLD.group_id;
    ELSE
        grp_id := NEW.group_id;
    END IF;

    SELECT COUNT(*) INTO cnt FROM public.group_members WHERE group_id = grp_id;
    SELECT slots_total INTO max_slots FROM public.groups WHERE id = grp_id;

    UPDATE public.groups
    SET slots_filled = cnt,
        status = CASE 
            WHEN cnt >= max_slots AND status = 'active' THEN 'full'
            WHEN cnt < max_slots AND status = 'full' THEN 'active'
            ELSE status
        END
    WHERE id = grp_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_group_slots ON public.group_members;
CREATE TRIGGER trigger_sync_group_slots
AFTER INSERT OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.sync_group_slots();

-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    
    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        user_name,
        user_name,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Public profiles can be viewed by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Games: Public read
CREATE POLICY "Games viewable by everyone" ON public.games FOR SELECT USING (true);

-- Game Profiles: Public read, user can manage own
CREATE POLICY "Game profiles viewable by everyone" ON public.game_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own game profiles" ON public.game_profiles FOR ALL USING (auth.uid() = user_id);

-- Groups: Active groups viewable by everyone
CREATE POLICY "Groups viewable by everyone" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their groups" ON public.groups FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their groups" ON public.groups FOR DELETE USING (auth.uid() = owner_id);

-- Group Secrets: Strictly limited to group owner and accepted members of active/full groups
CREATE POLICY "Group secrets viewable only by owner and accepted members" 
ON public.group_secrets FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_secrets.group_id 
        AND groups.status NOT IN ('cancelled', 'closed')
        AND (
            groups.owner_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_members.group_id = group_secrets.group_id 
                AND group_members.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Group secrets manageable only by group owner" 
ON public.group_secrets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_secrets.group_id 
        AND groups.owner_id = auth.uid()
    )
);

-- Group Members: Strict join policy (closed backdoor self-join)
CREATE POLICY "Group members viewable by everyone" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Group owner or user can leave or kick" ON public.group_members FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_members.group_id AND groups.owner_id = auth.uid())
);
CREATE POLICY "Strict member join policy" ON public.group_members FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_members.group_id 
        AND groups.owner_id = auth.uid()
    )
    OR
    (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.groups 
            WHERE groups.id = group_members.group_id 
            AND groups.join_type = 'open'
            AND groups.status = 'active'
            AND groups.slots_filled < groups.slots_total
        )
    )
);

-- Group Applications
CREATE POLICY "Applicants and group owner can view applications" ON public.group_applications FOR SELECT USING (
    auth.uid() = applicant_id OR 
    EXISTS (SELECT 1 FROM public.groups WHERE groups.id = group_applications.group_id AND groups.owner_id = auth.uid())
);
CREATE POLICY "Users can create application" ON public.group_applications FOR INSERT WITH CHECK (
    auth.uid() = applicant_id
    AND NOT EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_applications.group_id 
        AND groups.owner_id = auth.uid()
    )
);
CREATE POLICY "Applicant can withdraw application" ON public.group_applications FOR UPDATE USING (
    auth.uid() = applicant_id
) WITH CHECK (
    auth.uid() = applicant_id AND status = 'withdrawn'
);
CREATE POLICY "Owner can decide application" ON public.group_applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_applications.group_id 
        AND groups.owner_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_applications.group_id 
        AND groups.owner_id = auth.uid()
    )
    AND status IN ('accepted', 'rejected')
);

-- Reviews: Strict validated review creation
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Strict validated review creation" ON public.reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND reviewer_id != reviewee_id
    AND rating >= 1 AND rating <= 5
    AND EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = reviews.group_id 
        AND groups.status = 'completed'
    )
    AND EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = reviews.group_id 
        AND group_members.user_id = auth.uid()
    )
    AND EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = reviews.group_id 
        AND group_members.user_id = reviews.reviewee_id
    )
);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- User Blocks
CREATE POLICY "Users can view their blocked list" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- User Reports & Review Reports (Admin protected reads)
CREATE POLICY "Users can create reports" ON public.user_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admin view user reports" ON public.user_reports FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin update user reports" ON public.user_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Users can report reviews" ON public.review_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admin view review reports" ON public.review_reports FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin update review reports" ON public.review_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Moderation Actions
CREATE POLICY "Admin manage moderation actions" ON public.moderation_actions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
