-- ==============================================================================
-- DuoRank Competitive Upgrade Migration (2026-11-15)
-- Features: Riot Games API Verification, Lobby Realtime Chat, 1v1 Direct Messages,
-- and Quick Matchmaking Queue.
-- ==============================================================================

-- 1. PROFILES EXTENSION (Riot Verification & Discord Voice)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS riot_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS riot_puuid TEXT,
ADD COLUMN IF NOT EXISTS riot_current_tier INTEGER,
ADD COLUMN IF NOT EXISTS riot_current_rr INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS riot_peak_rank TEXT,
ADD COLUMN IF NOT EXISTS riot_stats JSONB DEFAULT '{"kd": 1.0, "win_rate": 50, "top_agents": []}'::JSONB,
ADD COLUMN IF NOT EXISTS riot_last_updated TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS discord_voice_url TEXT;

-- 2. LOBBY MESSAGES (Grup İçi Canlı Sohbet)
CREATE TABLE IF NOT EXISTS public.lobby_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'discord_link')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lobby_messages_group ON public.lobby_messages(group_id, created_at ASC);

ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lobby members can read messages" ON public.lobby_messages;
CREATE POLICY "Lobby members can read messages" ON public.lobby_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = lobby_messages.group_id 
        AND group_members.user_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.groups 
        WHERE groups.id = lobby_messages.group_id 
        AND groups.owner_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Lobby members can insert messages" ON public.lobby_messages;
CREATE POLICY "Lobby members can insert messages" ON public.lobby_messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_members.group_id = lobby_messages.group_id 
            AND group_members.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.groups 
            WHERE groups.id = lobby_messages.group_id 
            AND groups.owner_id = auth.uid()
        )
    )
);

-- 3. DIRECT CONVERSATIONS & MESSAGES (Birebir DM)
CREATE TABLE IF NOT EXISTS public.direct_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_conversation_pair UNIQUE (user1_id, user2_id),
    CONSTRAINT no_self_conversation CHECK (user1_id != user2_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.direct_conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.direct_conversations(user2_id);

ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON public.direct_conversations;
CREATE POLICY "Users can view their conversations" ON public.direct_conversations
FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON public.direct_conversations;
CREATE POLICY "Users can create conversations" ON public.direct_conversations
FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update their conversations" ON public.direct_conversations;
CREATE POLICY "Users can update their conversations" ON public.direct_conversations
FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Direct Messages Table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.direct_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_conversation ON public.direct_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver_unread ON public.direct_messages(receiver_id, is_read);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view direct messages" ON public.direct_messages;
CREATE POLICY "Participants can view direct messages" ON public.direct_messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Sender can insert direct message" ON public.direct_messages;
CREATE POLICY "Sender can insert direct message" ON public.direct_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receiver can update read status" ON public.direct_messages;
CREATE POLICY "Receiver can update read status" ON public.direct_messages
FOR UPDATE USING (auth.uid() = receiver_id);

-- 4. MATCHMAKING QUEUE (Hemen Duo Bul)
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL DEFAULT 'valorant',
    rank_tier TEXT NOT NULL,
    preferred_role TEXT,
    mic_required BOOLEAN DEFAULT true,
    server_region TEXT DEFAULT 'tr',
    play_style TEXT DEFAULT 'serious',
    status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
    matched_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    matched_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matchmaking_active ON public.matchmaking_queue(status, game_id, created_at ASC);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view matchmaking queue" ON public.matchmaking_queue;
CREATE POLICY "Public can view matchmaking queue" ON public.matchmaking_queue
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own matchmaking entry" ON public.matchmaking_queue;
CREATE POLICY "Users can insert own matchmaking entry" ON public.matchmaking_queue
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own matchmaking entry" ON public.matchmaking_queue;
CREATE POLICY "Users can update own matchmaking entry" ON public.matchmaking_queue
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own matchmaking entry" ON public.matchmaking_queue;
CREATE POLICY "Users can delete own matchmaking entry" ON public.matchmaking_queue
FOR DELETE USING (auth.uid() = user_id);

-- 5. REALTIME REPLICATION ENABLEMENT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'lobby_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'direct_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'matchmaking_queue'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
