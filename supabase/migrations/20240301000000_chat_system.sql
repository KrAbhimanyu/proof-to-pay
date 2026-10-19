-- ==============================================================================
-- PROOF-TO-PAY: Secure Chat & Messaging Subsystem Migration
-- File: supabase/migrations/20240301000000_chat_system.sql
-- Description: Adds tables, indexes, constraints, and Row Level Security (RLS)
--              for Pre-Project and Project-Linked secure conversations, messages,
--              attachments, and voice notes.
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_type text NOT NULL CHECK (conversation_type IN ('PRE_PROJECT', 'PROJECT')),
  business_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  project_offer_id uuid REFERENCES public.project_offers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'BLOCKED')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_different_participants CHECK (business_id <> creator_id),
  CONSTRAINT uq_project_offer_conversation UNIQUE (project_offer_id)
);

-- Partial unique indexes to prevent duplicate pre-project chats
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_pre_project_chat_per_project 
ON public.conversations (business_id, creator_id, project_id) 
WHERE (conversation_type = 'PRE_PROJECT' AND project_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_pre_project_chat_direct 
ON public.conversations (business_id, creator_id) 
WHERE (conversation_type = 'PRE_PROJECT' AND project_id IS NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_business_id ON public.conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON public.conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- 2. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_muted boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv_id ON public.conversation_participants(conversation_id);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM')),
  body text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_valid_message_body CHECK (
    (message_type IN ('TEXT', 'SYSTEM') AND body IS NOT NULL AND length(trim(body)) > 0) OR
    (message_type IN ('IMAGE', 'FILE', 'VOICE'))
  )
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- 4. MESSAGE ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 20971520), -- 20 MB max
  mime_type text NOT NULL,
  voice_duration_seconds integer CHECK (voice_duration_seconds IS NULL OR (voice_duration_seconds > 0 AND voice_duration_seconds <= 180)),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT chk_safe_attachment_filename CHECK (
    file_name ~* '\.(png|jpe?g|webp|gif|pdf|txt|zip|doc|docx|webm|mp4|mp3|ogg|wav|m4a)$'
  )
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_conversation_id ON public.message_attachments(conversation_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all chat tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- 5.1 Conversations RLS
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = business_id OR 
    auth.uid() = creator_id OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Eligible users can create conversations" ON public.conversations;
CREATE POLICY "Eligible users can create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = business_id OR auth.uid() = creator_id) AND
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    ) AND
    (
      -- Pre-project conversations require valid un-suspended counterpart
      (conversation_type = 'PRE_PROJECT' AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (CASE WHEN auth.uid() = business_id THEN creator_id ELSE business_id END)
        AND is_suspended = false
      ))
      OR
      -- Project conversations require an ACCEPTED project offer
      (conversation_type = 'PROJECT' AND project_offer_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.project_offers 
        WHERE id = project_offer_id 
          AND status = 'ACCEPTED' 
          AND business_id = public.conversations.business_id 
          AND student_id = public.conversations.creator_id
      ))
    )
  );

-- 5.2 Conversation Participants RLS
-- Explicitly revoke direct INSERT and DELETE to prevent participants from adding themselves or others.
-- Participants are securely populated only via the handle_new_conversation() trigger.
REVOKE INSERT, DELETE ON public.conversation_participants FROM anon, authenticated;
GRANT SELECT ON public.conversation_participants TO authenticated;
GRANT UPDATE (last_read_at, is_muted) ON public.conversation_participants TO authenticated;

DROP POLICY IF EXISTS "Participants can view conversation participant list" ON public.conversation_participants;
CREATE POLICY "Participants can view conversation participant list" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can update own read receipt" ON public.conversation_participants;
CREATE POLICY "Participants can update own read receipt" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5.3 Messages RLS
DROP POLICY IF EXISTS "Participants can read messages in their conversations" ON public.messages;
CREATE POLICY "Participants can read messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can send messages to active conversations" ON public.messages;
CREATE POLICY "Participants can send messages to active conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id 
        AND c.status = 'ACTIVE'
        AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    )
  );

-- 5.4 Message Attachments RLS
DROP POLICY IF EXISTS "Participants can view message attachments" ON public.message_attachments;
CREATE POLICY "Participants can view message attachments" ON public.message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.business_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Participants can insert attachments into their messages" ON public.message_attachments;
CREATE POLICY "Participants can insert attachments into their messages" ON public.message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id 
        AND m.sender_id = auth.uid() 
        AND c.id = conversation_id
        AND c.status = 'ACTIVE'
    )
  );

-- 6. AUTOMATIC TRIGGER FOR LAST MESSAGE TIMESTAMP & CONVERSATION PARTICIPANTS
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update conversation last_message_at
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  -- Ensure sender's last_read_at is updated
  UPDATE public.conversation_participants
  SET last_read_at = NEW.created_at
  WHERE conversation_id = NEW.conversation_id AND user_id = NEW.sender_id;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_chat_message() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_chat_message() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_after_message_insert ON public.messages;
CREATE TRIGGER trg_after_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_chat_message();

-- 7. AUTOMATIC TRIGGER FOR POPULATING CONVERSATION PARTICIPANTS
CREATE OR REPLACE FUNCTION public.handle_new_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert business participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, last_read_at)
  VALUES (NEW.id, NEW.business_id, NEW.created_at, NEW.created_at)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Insert creator participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, last_read_at)
  VALUES (NEW.id, NEW.creator_id, NEW.created_at, NEW.created_at)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_conversation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_conversation() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_after_conversation_insert ON public.conversations;
CREATE TRIGGER trg_after_conversation_insert
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_conversation();

-- 8. SECURE ATTACHMENT STORAGE (Private Bucket: chat_attachments)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat_attachments',
  'chat_attachments',
  false,
  20971520, -- 20 MB max
  ARRAY[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'application/zip',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Participants can view conversation attachments" ON storage.objects;
CREATE POLICY "Participants can view conversation attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat_attachments' AND (
      EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE (c.business_id = auth.uid() OR c.creator_id = auth.uid())
          AND storage.objects.name LIKE ('conversations/' || c.id || '/%')
      ) OR
      public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Participants can upload attachments to own messages" ON storage.objects;
CREATE POLICY "Participants can upload attachments to own messages" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat_attachments' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.business_id = auth.uid() OR c.creator_id = auth.uid())
        AND c.status = 'ACTIVE'
        AND storage.objects.name LIKE ('conversations/' || c.id || '/%')
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    )
  );

DROP POLICY IF EXISTS "Participants can delete own uploaded attachments" ON storage.objects;
CREATE POLICY "Participants can delete own uploaded attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat_attachments' AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.business_id = auth.uid() OR c.creator_id = auth.uid())
        AND storage.objects.name LIKE ('conversations/' || c.id || '/%')
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_suspended = false
    )
  );

-- 9. TRANSACTIONAL RPC: send_chat_message
-- Atomically inserts message and attachment metadata within a single PostgreSQL transaction.
-- Rolls back completely if any attachment validation, constraint, or permission fails.
CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_conversation_id uuid,
  p_message_type text,
  p_body text DEFAULT NULL,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_conv_status text;
  v_is_suspended boolean;
  v_message_id uuid;
  v_created_at timestamp with time zone := timezone('utc'::text, now());
  v_att jsonb;
  v_storage_path text;
  v_file_name text;
  v_file_size_bytes bigint;
  v_mime_type text;
  v_voice_duration_seconds integer;
  v_inserted_attachments jsonb := '[]'::jsonb;
  v_att_id uuid;
BEGIN
  -- 1. Authentication check
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to send messages' USING ERRCODE = '42501';
  END IF;

  -- 2. Account suspension check
  SELECT is_suspended INTO v_is_suspended 
  FROM public.profiles 
  WHERE id = v_sender_id;

  IF v_is_suspended IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = '42501';
  ELSIF v_is_suspended = true THEN
    RAISE EXCEPTION 'Account is suspended. Messaging is disabled' USING ERRCODE = '42501';
  END IF;

  -- 3. Active conversation membership check
  SELECT status INTO v_conv_status 
  FROM public.conversations 
  WHERE id = p_conversation_id 
    AND (business_id = v_sender_id OR creator_id = v_sender_id);

  IF v_conv_status IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not an active participant in conversation %', p_conversation_id USING ERRCODE = '42501';
  ELSIF v_conv_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Conversation % is not active (status: %)', p_conversation_id, v_conv_status USING ERRCODE = '23514';
  END IF;

  -- 4. Message type and body validation (chk_valid_message_body)
  IF p_message_type NOT IN ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM') THEN
    RAISE EXCEPTION 'Invalid message type: %', p_message_type USING ERRCODE = '23514';
  END IF;

  IF p_message_type IN ('TEXT', 'SYSTEM') THEN
    IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
      RAISE EXCEPTION 'Message body cannot be empty for % messages', p_message_type USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Attachment presence validation for media types
  IF p_message_type IN ('IMAGE', 'FILE', 'VOICE') THEN
    IF p_attachments IS NULL OR jsonb_array_length(p_attachments) = 0 THEN
      RAISE EXCEPTION 'At least one attachment metadata is required for % message', p_message_type USING ERRCODE = '23514';
    END IF;
  END IF;

  -- 5. Insert Message Row
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    message_type,
    body,
    is_deleted,
    created_at,
    updated_at
  ) VALUES (
    p_conversation_id,
    v_sender_id,
    p_message_type,
    p_body,
    false,
    v_created_at,
    v_created_at
  )
  RETURNING id INTO v_message_id;

  -- 6. Insert and validate Attachment Metadata atomically
  IF p_attachments IS NOT NULL AND jsonb_array_length(p_attachments) > 0 THEN
    FOR v_att IN SELECT * FROM jsonb_array_elements(p_attachments) LOOP
      v_storage_path := coalesce(v_att->>'storagePath', v_att->>'storage_path');
      v_file_name := coalesce(v_att->>'fileName', v_att->>'file_name');
      v_file_size_bytes := (coalesce(v_att->>'fileSizeBytes', v_att->>'file_size_bytes'))::bigint;
      v_mime_type := coalesce(v_att->>'mimeType', v_att->>'mime_type');
      v_voice_duration_seconds := (coalesce(v_att->>'voiceDurationSeconds', v_att->>'voice_duration_seconds'))::integer;

      -- Validate storage path: MUST reside strictly in conversations/<p_conversation_id>/...
      IF v_storage_path IS NULL OR v_storage_path NOT LIKE ('conversations/' || p_conversation_id::text || '/%') THEN
        RAISE EXCEPTION 'Security violation: Storage path % does not match authorized conversation folder', v_storage_path USING ERRCODE = '42501';
      END IF;

      -- Validate file name safe characters and extension
      IF v_file_name IS NULL OR v_file_name !~* '\.(png|jpe?g|webp|gif|pdf|txt|zip|doc|docx|webm|mp4|mp3|ogg|wav|m4a)$' THEN
        RAISE EXCEPTION 'Invalid or unsafe attachment filename: %', v_file_name USING ERRCODE = '23514';
      END IF;

      -- Validate allowed MIME types
      IF v_mime_type IS NULL OR v_mime_type NOT IN (
        'image/png', 'image/jpeg', 'image/webp', 'image/gif',
        'application/pdf', 'text/plain', 'application/zip',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'
      ) THEN
        RAISE EXCEPTION 'Disallowed or invalid attachment MIME type: %', v_mime_type USING ERRCODE = '23514';
      END IF;

      -- Validate file size (max 20 MB)
      IF v_file_size_bytes IS NULL OR v_file_size_bytes <= 0 OR v_file_size_bytes > 20971520 THEN
        RAISE EXCEPTION 'Attachment file size % bytes violates limit (1 to 20MB)', v_file_size_bytes USING ERRCODE = '23514';
      END IF;

      -- Validate voice duration (max 180s)
      IF p_message_type = 'VOICE' THEN
        IF v_voice_duration_seconds IS NULL OR v_voice_duration_seconds <= 0 OR v_voice_duration_seconds > 180 THEN
          RAISE EXCEPTION 'Voice duration % seconds violates limit (1 to 180s)', v_voice_duration_seconds USING ERRCODE = '23514';
        END IF;
      ELSIF v_voice_duration_seconds IS NOT NULL THEN
        IF v_voice_duration_seconds <= 0 OR v_voice_duration_seconds > 180 THEN
          RAISE EXCEPTION 'Voice duration % seconds violates limit (1 to 180s)', v_voice_duration_seconds USING ERRCODE = '23514';
        END IF;
      END IF;

      -- Insert into message_attachments table
      INSERT INTO public.message_attachments (
        message_id,
        conversation_id,
        storage_path,
        file_name,
        file_size_bytes,
        mime_type,
        voice_duration_seconds,
        created_at
      ) VALUES (
        v_message_id,
        p_conversation_id,
        v_storage_path,
        v_file_name,
        v_file_size_bytes,
        v_mime_type,
        v_voice_duration_seconds,
        v_created_at
      )
      RETURNING id INTO v_att_id;

      v_inserted_attachments := v_inserted_attachments || json_build_object(
        'id', v_att_id,
        'message_id', v_message_id,
        'conversation_id', p_conversation_id,
        'storage_path', v_storage_path,
        'file_name', v_file_name,
        'file_size_bytes', v_file_size_bytes,
        'mime_type', v_mime_type,
        'voice_duration_seconds', v_voice_duration_seconds,
        'created_at', v_created_at
      )::jsonb;
    END LOOP;
  END IF;

  RETURN json_build_object(
    'id', v_message_id,
    'conversation_id', p_conversation_id,
    'sender_id', v_sender_id,
    'message_type', p_message_type,
    'body', p_body,
    'created_at', v_created_at,
    'updated_at', v_created_at,
    'attachments', v_inserted_attachments
  )::jsonb;
END;
$$;

-- Grant execution to authenticated role only; revoke from anon and public
REVOKE EXECUTE ON FUNCTION public.send_chat_message(uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_chat_message(uuid, text, text, jsonb) TO authenticated;



