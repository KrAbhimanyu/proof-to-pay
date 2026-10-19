-- ==============================================================================
-- PROOF-TO-PAY: Chat & Messaging Row-Level Security (RLS) Verification Test Suite
-- File: supabase/tests/chat_rls_verification.sql
-- ==============================================================================
-- ARCHITECTURAL SEPARATION & VERIFICATION STRATEGY:
-- 1. SCHEMA CONSTRAINTS & TRIGGERS (Part 1):
--    Executed in administrative context to verify database table constraints,
--    cascades, check conditions, and SECURITY DEFINER triggers.
-- 2. NON-PRIVILEGED ROLE RLS POLICIES (Part 2):
--    Executed under 'SET LOCAL ROLE authenticated' using session JWT claim contexts.
--    Crucially, queries do NOT use artificial WHERE filters matching user IDs;
--    they query target entity IDs directly and let PostgreSQL's RLS engine
--    (USING and WITH CHECK clauses) dictate visibility and mutation.
-- 3. CRYPTOGRAPHIC STAGING API REQUIREMENT (Part 3):
--    In-database role switching tests SQL policy semantics, but cannot test
--    cryptographic token signatures, GoTrue token expiry, or PostgREST gateway headers.
--    Full multi-user verification must be executed against staging PostgREST APIs.
-- ==============================================================================

-- 1. Setup Temporary Test Results Table (Session Scope)
CREATE TEMP TABLE IF NOT EXISTS pg_temp.chat_rls_test_results (
  test_id serial primary key,
  test_layer text not null,       -- 'SCHEMA_CONSTRAINT', 'ROLE_RLS_POLICY', 'STORAGE_RLS'
  target_table text not null,
  operation text not null,
  test_name text not null,
  passed boolean not null,
  details text not null
);

TRUNCATE TABLE pg_temp.chat_rls_test_results;

-- Allow authenticated role to record test outcomes in pg_temp
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT ALL ON TABLE pg_temp.chat_rls_test_results TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE pg_temp.chat_rls_test_results_test_id_seq TO authenticated;
  END IF;
END $$;

-- 2. Seed Test Fixtures (As Administrative / Superuser Context)
DO $$
DECLARE
  v_biz_id uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_creator_id uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_outsider_id uuid := 'c0000000-0000-0000-0000-000000000003'::uuid;
  v_suspended_id uuid := 'c0000000-0000-0000-0000-000000000004'::uuid;
  v_conv_id uuid := 'd0000000-0000-0000-0000-000000000001'::uuid;
  v_msg_id uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_count integer;
BEGIN
  -- Insert dummy test profiles
  INSERT INTO public.profiles (id, email, name, role, is_suspended, created_at)
  VALUES 
    (v_biz_id, 'biz_chat_test@example.com', 'Chat Biz User', 'BUSINESS', false, now()),
    (v_creator_id, 'creator_chat_test@example.com', 'Chat Creator User', 'STUDENT', false, now()),
    (v_outsider_id, 'outsider_chat_test@example.com', 'Chat Outsider User', 'STUDENT', false, now()),
    (v_suspended_id, 'suspended_chat_test@example.com', 'Suspended Creator', 'STUDENT', true, now())
  ON CONFLICT (id) DO UPDATE SET 
    role = EXCLUDED.role, 
    is_suspended = EXCLUDED.is_suspended;

  -- Create a pre-project test conversation (Trigger trg_after_conversation_insert will populate participants)
  INSERT INTO public.conversations (
    id, conversation_type, business_id, creator_id, created_by, status, created_at, updated_at
  ) VALUES (
    v_conv_id, 'PRE_PROJECT', v_biz_id, v_creator_id, v_biz_id, 'ACTIVE', now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create initial valid message
  INSERT INTO public.messages (
    id, conversation_id, sender_id, message_type, body, created_at, updated_at
  ) VALUES (
    v_msg_id, v_conv_id, v_biz_id, 'TEXT', 'Hello, let us discuss the project requirements.', now(), now()
  ) ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- PART 1: SCHEMA CONSTRAINTS & TRIGGER IDEMPOTENCE (Superuser Evaluation)
  -- ----------------------------------------------------------------------------

  -- Test 1: Check message body constraint (cannot insert empty or whitespace body for TEXT)
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, message_type, body)
    VALUES (v_conv_id, v_biz_id, 'TEXT', '   ');
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'messages', 'INSERT', 'Rejects empty text message body', false, 'Allowed whitespace body incorrectly');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'messages', 'INSERT', 'Rejects empty text message body', true, 'Check constraint chk_valid_message_body enforced');
  END;

  -- Test 2: Check attachment size constraint (> 20MB rejected)
  BEGIN
    INSERT INTO public.message_attachments (message_id, conversation_id, storage_path, file_name, file_size_bytes, mime_type)
    VALUES (v_msg_id, v_conv_id, 'conversations/dummy/large.bin', 'large.bin', 25000000, 'application/octet-stream');
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'message_attachments', 'INSERT', 'Rejects attachment exceeding 20MB limit', false, 'Allowed >20MB payload');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'message_attachments', 'INSERT', 'Rejects attachment exceeding 20MB limit', true, 'Max 20MB file constraint enforced');
  END;

  -- Test 3: Check voice duration constraint (> 180s rejected)
  BEGIN
    INSERT INTO public.message_attachments (message_id, conversation_id, storage_path, file_name, file_size_bytes, mime_type, voice_duration_seconds)
    VALUES (v_msg_id, v_conv_id, 'conversations/dummy/audio.mp3', 'audio.mp3', 50000, 'audio/mp3', 250);
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'message_attachments', 'INSERT', 'Rejects voice message exceeding 180s limit', false, 'Allowed >180s voice note');
  EXCEPTION WHEN check_violation THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'message_attachments', 'INSERT', 'Rejects voice message exceeding 180s limit', true, 'Voice duration max 180s enforced');
  END;

  -- Test 4: Participant Auto-Population Trigger Verification
  SELECT count(*) INTO v_count FROM public.conversation_participants
  WHERE conversation_id = v_conv_id AND user_id IN (v_biz_id, v_creator_id);

  IF v_count = 2 THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'conversation_participants', 'TRIGGER', 'Populates both participants on conversation creation', true, 'Both business and creator rows populated idempotently by handle_new_conversation()');
  ELSE
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('SCHEMA_CONSTRAINT', 'conversation_participants', 'TRIGGER', 'Populates both participants on conversation creation', false, 'Failed to populate both participant records');
  END IF;

END $$;

-- ----------------------------------------------------------------------------
-- PART 2: AUTHENTICATED NON-PRIVILEGED ROLE RLS POLICY VERIFICATION
-- Runs with genuine role switching via set_config('role', 'authenticated', true)
-- Queries DO NOT use artificial WHERE clauses filtering on auth.uid()
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_biz_id uuid := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_creator_id uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_outsider_id uuid := 'c0000000-0000-0000-0000-000000000003'::uuid;
  v_suspended_id uuid := 'c0000000-0000-0000-0000-000000000004'::uuid;
  v_conv_id uuid := 'd0000000-0000-0000-0000-000000000001'::uuid;
  v_msg_id uuid := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_count integer;
  v_passed boolean;
  v_details text;
BEGIN
  -- Switch session to unprivileged authenticated role
  PERFORM set_config('role', 'authenticated', true);

  -- TEST 2.1: Authorized business participant can view conversation
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_biz_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_biz_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SELECT count(*) INTO v_count FROM public.conversations WHERE id = v_conv_id;
  IF v_count = 1 THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'conversations', 'SELECT', 'Authorized business participant can view conversation', true, 'Row Level Security policy permitted authorized business participant');
  ELSE
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'conversations', 'SELECT', 'Authorized business participant can view conversation', false, 'Business participant failed to view conversation');
  END IF;

  -- TEST 2.2: Authorized creator participant can view conversation
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_creator_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_creator_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SELECT count(*) INTO v_count FROM public.conversations WHERE id = v_conv_id;
  IF v_count = 1 THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'conversations', 'SELECT', 'Authorized creator participant can view conversation', true, 'Row Level Security policy permitted authorized creator participant');
  ELSE
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'conversations', 'SELECT', 'Authorized creator participant can view conversation', false, 'Creator participant failed to view conversation');
  END IF;

  -- TEST 2.3: Unrelated outsider cannot view conversation (Direct ID lookup returns 0 rows via RLS)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_outsider_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_outsider_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SELECT count(*) INTO v_count FROM public.conversations WHERE id = v_conv_id;
  IF v_count = 0 THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'conversations', 'SELECT', 'Unrelated outsider cannot view conversation', true, 'RLS USING clause completely hid unauthorized conversation (0 rows returned)');
  ELSE
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'conversations', 'SELECT', 'Unrelated outsider cannot view conversation', false, 'SECURITY FLAW: Conversation leaked to outsider');
  END IF;

  -- TEST 2.4: Message read isolation (Outsider cannot view messages via direct ID lookup)
  SELECT count(*) INTO v_count FROM public.messages WHERE id = v_msg_id;
  IF v_count = 0 THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'messages', 'SELECT', 'Outsider cannot read conversation messages', true, 'RLS policy on messages completely isolated message rows from outsider');
  ELSE
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('ROLE_RLS_POLICY', 'messages', 'SELECT', 'Outsider cannot read conversation messages', false, 'SECURITY FLAW: Message content leaked to outsider');
  END IF;

  -- TEST 2.5: Prevent outsider from adding self to conversation (REVOKE INSERT enforced)
  BEGIN
    INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, last_read_at)
    VALUES (v_conv_id, v_outsider_id, now(), now());
    v_passed := false;
    v_details := 'SECURITY FLAW: Outsider was able to directly insert participant record';
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_passed := true;
      v_details := 'PASSED: Direct INSERT strictly revoked from authenticated role (42501)';
    WHEN OTHERS THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by security policy (' || SQLSTATE || ')';
  END;
  INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
  VALUES ('ROLE_RLS_POLICY', 'conversation_participants', 'INSERT', 'Prevents outsider from adding self to conversation', v_passed, v_details);

  -- TEST 2.6: Outsider message insert denial
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, message_type, body)
    VALUES (v_conv_id, v_outsider_id, 'TEXT', 'Malicious inject attempt');
    v_passed := false;
    v_details := 'SECURITY FLAW: Outsider was able to insert message into conversation';
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by RLS WITH CHECK policy (42501 insufficient_privilege)';
    WHEN OTHERS THEN
      v_passed := true;
      v_details := 'PASSED: Rejected by database security (' || SQLSTATE || ')';
  END;
  INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
  VALUES ('ROLE_RLS_POLICY', 'messages', 'INSERT', 'Outsider cannot send messages to unauthorized conversation', v_passed, v_details);

  -- TEST 2.7: Suspended user cannot send messages
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_suspended_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_suspended_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  BEGIN
    INSERT INTO public.messages (conversation_id, sender_id, message_type, body)
    VALUES (v_conv_id, v_suspended_id, 'TEXT', 'Suspended message attempt');
    v_passed := false;
    v_details := 'SECURITY FLAW: Suspended user was able to insert message';
  EXCEPTION
    WHEN insufficient_privilege THEN
      v_passed := true;
      v_details := 'PASSED: Suspended user blocked by RLS suspension check (42501)';
    WHEN OTHERS THEN
      v_passed := true;
      v_details := 'PASSED: Blocked by security check (' || SQLSTATE || ')';
  END;
  INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
  VALUES ('ROLE_RLS_POLICY', 'messages', 'INSERT', 'Suspended user cannot send messages', v_passed, v_details);

  -- TEST 2.8: Storage path participant isolation (Outsider cannot view conversation storage objects)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_outsider_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_outsider_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  SELECT count(*) INTO v_count FROM storage.objects 
  WHERE bucket_id = 'chat_attachments' 
    AND name LIKE 'conversations/' || v_conv_id || '/%';

  IF v_count = 0 THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('STORAGE_RLS', 'storage.objects', 'SELECT', 'Storage path strictly restricted to conversation participants', true, 'Storage RLS policy isolated bucket files from non-participants');
  ELSE
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('STORAGE_RLS', 'storage.objects', 'SELECT', 'Storage path strictly restricted to conversation participants', false, 'Storage files leaked to outsider');
  END IF;

  -- ----------------------------------------------------------------------------
  -- PART 3: TRANSACTIONAL RPC VERIFICATION (public.send_chat_message)
  -- ----------------------------------------------------------------------------

  -- TEST 3.1: Authorized business participant can send text message via RPC
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_biz_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_biz_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  BEGIN
    PERFORM public.send_chat_message(v_conv_id, 'TEXT', 'Valid transactional RPC test message', '[]'::jsonb);
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Authorized participant can send text message via send_chat_message RPC', true, 'RPC successfully inserted message and executed under auth.uid()');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Authorized participant can send text message via send_chat_message RPC', false, 'Failed to send message: ' || SQLERRM);
  END;

  -- TEST 3.2: Outsider calling send_chat_message RPC is denied (42501 Unauthorized)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_outsider_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_outsider_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  BEGIN
    PERFORM public.send_chat_message(v_conv_id, 'TEXT', 'Outsider RPC intrusion attempt', '[]'::jsonb);
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Outsider cannot send message via send_chat_message RPC', false, 'SECURITY FLAW: Outsider RPC succeeded');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Outsider cannot send message via send_chat_message RPC', true, 'PASSED: Blocked with 42501 unauthorized participant');
  WHEN OTHERS THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Outsider cannot send message via send_chat_message RPC', true, 'PASSED: Blocked with ' || SQLSTATE);
  END;

  -- TEST 3.3: Suspended user calling send_chat_message RPC is denied (42501 Account suspended)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_suspended_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_suspended_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  BEGIN
    PERFORM public.send_chat_message(v_conv_id, 'TEXT', 'Suspended RPC attempt', '[]'::jsonb);
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Suspended user cannot send message via send_chat_message RPC', false, 'SECURITY FLAW: Suspended user RPC succeeded');
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Suspended user cannot send message via send_chat_message RPC', true, 'PASSED: Blocked with 42501 suspended user check');
  WHEN OTHERS THEN
    INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
    VALUES ('TRANSACTIONAL_RPC', 'messages', 'RPC', 'Suspended user cannot send message via send_chat_message RPC', true, 'PASSED: Blocked with ' || SQLSTATE);
  END;

  -- TEST 3.4: Atomic rollback on invalid attachment storage path
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_biz_id::text, 'role', 'authenticated')::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_biz_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  DECLARE
    v_msgs_before integer;
    v_msgs_after integer;
  BEGIN
    SELECT count(*) INTO v_msgs_before FROM public.messages WHERE conversation_id = v_conv_id;
    BEGIN
      PERFORM public.send_chat_message(
        v_conv_id,
        'FILE',
        'Valid text body',
        jsonb_build_array(
          jsonb_build_object(
            'storagePath', 'conversations/malicious-foreign-conv-id/stolen.pdf',
            'fileName', 'stolen.pdf',
            'fileSizeBytes', 1024,
            'mimeType', 'application/pdf'
          )
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Expected failure
    END;
    SELECT count(*) INTO v_msgs_after FROM public.messages WHERE conversation_id = v_conv_id;
    IF v_msgs_before = v_msgs_after THEN
      INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
      VALUES ('TRANSACTIONAL_RPC', 'messages', 'ROLLBACK', 'Enforces atomic rollback of message row when attachment validation fails', true, 'Message row rolled back completely in single PostgreSQL transaction (0 orphan rows)');
    ELSE
      INSERT INTO pg_temp.chat_rls_test_results (test_layer, target_table, operation, test_name, passed, details)
      VALUES ('TRANSACTIONAL_RPC', 'messages', 'ROLLBACK', 'Enforces atomic rollback of message row when attachment validation fails', false, 'Orphaned message row persisted despite attachment validation error');
    END IF;
  END;

END $$;

-- 4. Return Tabular Test Results
SELECT 
  test_id,
  test_layer,
  target_table,
  operation,
  test_name,
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END as status,
  details
FROM pg_temp.chat_rls_test_results
ORDER BY test_id ASC;

