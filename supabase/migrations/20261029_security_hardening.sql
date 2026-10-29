-- DuoRank Security & Schema Hardening Migration
-- 2026-10-29

-- 1. PROFILE COLUMNS
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS riot_id TEXT,
ADD COLUMN IF NOT EXISTS riot_tag TEXT,
ADD COLUMN IF NOT EXISTS rank TEXT,
ADD COLUMN IF NOT EXISTS primary_agent TEXT,
ADD COLUMN IF NOT EXISTS secondary_agent TEXT,
ADD COLUMN IF NOT EXISTS preferred_roles TEXT[];

-- 2. GROUPS COLUMNS
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS agents_wanted TEXT[];

-- 3. GROUP APPLICATIONS COLUMNS
ALTER TABLE public.group_applications
ADD COLUMN IF NOT EXISTS applicant_rank TEXT,
ADD COLUMN IF NOT EXISTS applicant_primary_agent TEXT,
ADD COLUMN IF NOT EXISTS applicant_role TEXT,
ADD COLUMN IF NOT EXISTS applicant_microphone BOOLEAN;

-- 4. DEDICATED GROUP SECRETS TABLE (FOR LOBBY CODE SECURITY)
CREATE TABLE IF NOT EXISTS public.group_secrets (
    group_id UUID PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
    lobby_code TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy existing lobby codes if any
INSERT INTO public.group_secrets (group_id, lobby_code)
SELECT id, lobby_code FROM public.groups
WHERE lobby_code IS NOT NULL
ON CONFLICT (group_id) DO UPDATE SET lobby_code = EXCLUDED.lobby_code;

-- Revoke direct lobby_code select from public.groups to prevent leaks
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'groups' AND column_name = 'lobby_code'
    ) THEN
        REVOKE SELECT (lobby_code) ON public.groups FROM anon, authenticated;
    END IF;
END $$;

-- 5. RLS ON GROUP SECRETS
ALTER TABLE public.group_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group secrets viewable only by owner and accepted members" ON public.group_secrets;
CREATE POLICY "Group secrets viewable only by owner and accepted members" 
ON public.group_secrets FOR SELECT USING (
    -- Group must not be cancelled or closed
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_secrets.group_id 
        AND groups.status NOT IN ('cancelled', 'closed')
        AND (
            -- Owner
            groups.owner_id = auth.uid()
            OR
            -- Accepted Member
            EXISTS (
                SELECT 1 FROM public.group_members 
                WHERE group_members.group_id = group_secrets.group_id 
                AND group_members.user_id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Group secrets manageable only by group owner" ON public.group_secrets;
CREATE POLICY "Group secrets manageable only by group owner" 
ON public.group_secrets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_secrets.group_id 
        AND groups.owner_id = auth.uid()
    )
);

-- 6. HARDEN GROUP MEMBERS RLS (Close backdoor self-join)
DROP POLICY IF EXISTS "System or owner can add members" ON public.group_members;
CREATE POLICY "Strict member join policy" ON public.group_members FOR INSERT WITH CHECK (
    -- 1. Group owner can add members
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = group_members.group_id 
        AND groups.owner_id = auth.uid()
    )
    OR
    -- 2. Open join group where slots are available and user is adding themselves
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

-- 7. HARDEN GROUP APPLICATIONS RLS (Prevent self-accepting)
DROP POLICY IF EXISTS "Owner or applicant can update application" ON public.group_applications;

-- Applicants can only withdraw their application
CREATE POLICY "Applicant can withdraw application" ON public.group_applications FOR UPDATE USING (
    auth.uid() = applicant_id
) WITH CHECK (
    auth.uid() = applicant_id
    AND status = 'withdrawn'
);

-- Group owners can accept or reject
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

-- 8. HARDEN REVIEWS RLS (Prevent fraudulent reviews)
DROP POLICY IF EXISTS "Users can create review" ON public.reviews;
CREATE POLICY "Strict validated review creation" ON public.reviews FOR INSERT WITH CHECK (
    -- Reviewer must be current authenticated user
    auth.uid() = reviewer_id
    -- Cannot review oneself
    AND reviewer_id != reviewee_id
    -- Rating must be between 1 and 5
    AND rating >= 1 AND rating <= 5
    -- Group must be completed
    AND EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = reviews.group_id 
        AND groups.status = 'completed'
    )
    -- Both reviewer and reviewee must have been in the group
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

-- 9. SECURE ADMIN AND REPORT POLICIES
DROP POLICY IF EXISTS "Admin view reports" ON public.user_reports;
CREATE POLICY "Admin view user reports" ON public.user_reports FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admin update user reports" ON public.user_reports;
CREATE POLICY "Admin update user reports" ON public.user_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admin view review reports" ON public.review_reports;
CREATE POLICY "Admin view review reports" ON public.review_reports FOR SELECT USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admin update review reports" ON public.review_reports;
CREATE POLICY "Admin update review reports" ON public.review_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 10. ATOMIC FUNCTION FOR DIRECT OPEN GROUP JOIN
CREATE OR REPLACE FUNCTION public.join_open_group(target_group_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_group RECORD;
    v_member_count INTEGER;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Giriş yapmalısınız.');
    END IF;

    -- Lock the group row to prevent concurrency race conditions
    SELECT * INTO v_group
    FROM public.groups
    WHERE id = target_group_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Grup bulunamadı.');
    END IF;

    IF v_group.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu grup şu anda katılıma açık değil.');
    END IF;

    IF v_group.join_type != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bu gruba katılmak için başvuru yapmalısınız.');
    END IF;

    IF v_group.owner_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Zaten bu grubun liderisiniz.');
    END IF;

    -- Check if already member
    IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = target_group_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Zaten bu grubun üyesisiniz.');
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_member_count
    FROM public.group_members
    WHERE group_id = target_group_id;

    IF v_member_count >= v_group.slots_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Grup kontenjanı dolu.');
    END IF;

    -- Insert Member
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (target_group_id, v_user_id, 'member');

    -- Update slots
    UPDATE public.groups
    SET slots_filled = v_member_count + 1,
        status = CASE WHEN (v_member_count + 1) >= slots_total THEN 'full' ELSE 'active' END
    WHERE id = target_group_id;

    -- Send notification to owner
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
        v_group.owner_id,
        'member_joined',
        'Yeni Oyuncu Katıldı',
        'Bir oyuncu açık grubunuza katıldı.',
        jsonb_build_object('group_id', target_group_id)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Gruba başarıyla katıldınız.');
END;
$$;

-- 11. ATOMIC SECURE FUNCTION TO RETRIEVE LOBBY CODE
CREATE OR REPLACE FUNCTION public.get_group_lobby_code(target_group_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_owner_id UUID;
    v_status TEXT;
    v_is_member BOOLEAN;
    v_join_type TEXT;
BEGIN
    SELECT owner_id, status, join_type INTO v_owner_id, v_status, v_join_type
    FROM public.groups
    WHERE id = target_group_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Grup bulunamadı.';
    END IF;

    IF v_status IN ('cancelled', 'closed') THEN
        RAISE EXCEPTION 'Bu grup kapalı olduğu için parti koduna erişilemez.';
    END IF;

    -- If owner
    IF auth.uid() = v_owner_id THEN
        SELECT lobby_code INTO v_code FROM public.group_secrets WHERE group_id = target_group_id;
        RETURN v_code;
    END IF;

    -- Check membership
    SELECT EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = target_group_id AND user_id = auth.uid()
    ) INTO v_is_member;

    IF v_is_member THEN
        SELECT lobby_code INTO v_code FROM public.group_secrets WHERE group_id = target_group_id;
        RETURN v_code;
    END IF;

    RAISE EXCEPTION 'Lobi koduna yalnızca kabul edilmiş takım üyeleri erişebilir.';
END;
$$;
