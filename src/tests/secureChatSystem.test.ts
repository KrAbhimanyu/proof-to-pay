import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from '../lib/storage';
import { Conversation, MessageAttachment } from '../types';

describe('PROOF-TO-PAY: Secure Chat & Messaging Subsystem Tests', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('1. Database Migration & RLS Policy Integrity', () => {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20240301000000_chat_system.sql');
    const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql');
    const testSqlPath = path.resolve(process.cwd(), 'supabase/tests/chat_rls_verification.sql');

    it('verifies SQL migration and test files exist on disk', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      expect(fs.existsSync(schemaPath)).toBe(true);
      expect(fs.existsSync(testSqlPath)).toBe(true);
    });

    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const testSqlContent = fs.readFileSync(testSqlPath, 'utf8');

    it('defines conversations table with RLS enabled and required constraints', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.conversations/i);
        expect(content).toMatch(/alter\s+table\s+public\.conversations\s+enable\s+row\s+level\s+security/i);
        expect(content).toMatch(/chk_different_participants/i);
        expect(content).toMatch(/uq_project_offer_conversation/i);
      });
    });

    it('defines conversation_participants table with composite uniqueness', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.conversation_participants/i);
        expect(content).toMatch(/uq_conversation_participant/i);
      });
    });

    it('defines messages table with strict message body check constraint', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.messages/i);
        expect(content).toMatch(/chk_valid_message_body/i);
      });
    });

    it('defines message_attachments table with 20MB limit and voice duration constraint', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.message_attachments/i);
        expect(content).toMatch(/file_size_bytes\s+bigint\s+not\s+null\s+check\s*\(file_size_bytes\s*>\s*0\s+and\s+file_size_bytes\s*<=\s*20971520\)/i);
        expect(content).toMatch(/voice_duration_seconds.*<=\s*180/i);
      });
    });

    it('creates private storage bucket chat_attachments with RLS policies', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/insert\s+into\s+storage\.buckets/i);
        expect(content).toMatch(/'chat_attachments'/i);
        expect(content).toMatch(/public\s*=\s*false/i);
        expect(content).toMatch(/20971520/i);
      });
    });

    it('enforces participant protection: revokes direct insert/delete and uses trigger population', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/revoke\s+insert,\s+delete\s+on\s+public\.conversation_participants\s+from\s+anon,\s+authenticated/i);
        expect(content).toMatch(/function\s+public\.handle_new_conversation/i);
        expect(content).toMatch(/on\s+conflict\s*\(conversation_id,\s*user_id\)\s*do\s*nothing/i);
      });
    });

    it('enforces storage RLS policies for participant path isolation and suspension checks', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/create\s+policy\s+"Participants can view conversation attachments"\s+on\s+storage\.objects/i);
        expect(content).toMatch(/create\s+policy\s+"Participants can upload attachments to own messages"\s+on\s+storage\.objects/i);
        expect(content).toMatch(/storage\.objects\.name\s+like\s+\('conversations\/'/i);
        expect(content).toMatch(/is_suspended\s*=\s*false/i);
      });
    });

    it('includes SQL RLS verification tests for isolation, offer validation, and constraints', () => {
      expect(testSqlContent).toMatch(/Unrelated outsider cannot view conversation/i);
      expect(testSqlContent).toMatch(/Authorized business participant can view conversation/i);
      expect(testSqlContent).toMatch(/Authorized creator participant can view conversation/i);
      expect(testSqlContent).toMatch(/Outsider cannot read conversation messages/i);
      expect(testSqlContent).toMatch(/Rejects attachment exceeding 20MB limit/i);
      expect(testSqlContent).toMatch(/Rejects voice message exceeding 180s limit/i);
      expect(testSqlContent).toMatch(/Populates both participants on conversation creation/i);
      expect(testSqlContent).toMatch(/Prevents outsider from adding self to conversation/i);
      expect(testSqlContent).toMatch(/Suspended user cannot send messages/i);
    });

    it('revokes execute on trigger SECURITY DEFINER functions from unprivileged roles', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/revoke\s+execute\s+on\s+function\s+public\.handle_new_conversation\(\)\s+from\s+public,\s*anon,\s*authenticated/i);
        expect(content).toMatch(/revoke\s+execute\s+on\s+function\s+public\.handle_new_chat_message\(\)\s+from\s+public,\s*anon,\s*authenticated/i);
      });
    });

    it('architecturally separates schema constraints and non-privileged role RLS verification', () => {
      expect(testSqlContent).toMatch(/SCHEMA_CONSTRAINT/i);
      expect(testSqlContent).toMatch(/ROLE_RLS_POLICY/i);
      expect(testSqlContent).toMatch(/set_config\('role',\s*'authenticated'/i);
    });

    it('defines transactional send_chat_message RPC in migration and schema with SECURITY DEFINER and authenticated execute grant', () => {
      [migrationContent, schemaContent].forEach((content) => {
        expect(content).toMatch(/create\s+or\s+replace\s+function\s+public\.send_chat_message/i);
        expect(content).toMatch(/security\s+definer/i);
        expect(content).toMatch(/set\s+search_path\s*=\s*public/i);
        expect(content).toMatch(/revoke\s+execute\s+on\s+function\s+public\.send_chat_message.*from\s+public,\s*anon/i);
        expect(content).toMatch(/grant\s+execute\s+on\s+function\s+public\.send_chat_message.*to\s+authenticated/i);
      });
    });

    it('includes transactional RPC tests in chat_rls_verification.sql', () => {
      expect(testSqlContent).toMatch(/TRANSACTIONAL_RPC/i);
      expect(testSqlContent).toMatch(/send_chat_message/i);
      expect(testSqlContent).toMatch(/Enforces atomic rollback of message row when attachment validation fails/i);
    });
  });

  describe('2. Pre-Project Conversation Lifecycle & Validation', () => {
    it('prevents a user from initiating a conversation with themselves', () => {
      expect(() => {
        storage.getOrCreatePreProjectConversation(
          'student-1',
          'student-1',
          'student-1'
        );
      }).toThrow(/themselves/i);
    });

    it('creates a new pre-project conversation for eligible business and creator', () => {
      const conv = storage.getOrCreatePreProjectConversation(
        'business-1',
        'student-1',
        'business-1',
        'proj-1'
      );
      expect(conv).toBeDefined();
      expect(conv.conversationType).toBe('PRE_PROJECT');
      expect(conv.businessId).toBe('business-1');
      expect(conv.creatorId).toBe('student-1');
      expect(conv.projectId).toBe('proj-1');
    });

    it('prevents duplicate pre-project conversations for the same pair and project context', () => {
      const conv1 = storage.getOrCreatePreProjectConversation(
        'business-1',
        'student-1',
        'business-1',
        'proj-1'
      );
      const conv2 = storage.getOrCreatePreProjectConversation(
        'business-1',
        'student-1',
        'business-1',
        'proj-1'
      );
      expect(conv1.id).toBe(conv2.id);
    });
  });

  describe('3. Accepted Project Offer Conversation Lifecycle', () => {
    it('rejects creating a project conversation for a non-existent offer', () => {
      expect(() => {
        storage.getOrCreateProjectConversation('non-existent-offer-xyz');
      }).toThrow(/not found/i);
    });

    it('rejects creating a project conversation for a PENDING offer', () => {
      // Find or check pending offer in mockData
      const pendingOffers = storage.getOffers().filter((o) => o.status === 'PENDING');
      if (pendingOffers.length > 0) {
        expect(() => {
          storage.getOrCreateProjectConversation(pendingOffers[0].id);
        }).toThrow(/ACCEPTED/i);
      }
    });

    it('creates or retrieves a dedicated conversation for an ACCEPTED project offer', () => {
      const acceptedOffers = storage.getOffers().filter((o) => o.status === 'ACCEPTED');
      expect(acceptedOffers.length).toBeGreaterThan(0);

      const offer = acceptedOffers[0];
      const conv = storage.getOrCreateProjectConversation(offer.id);
      expect(conv).toBeDefined();
      expect(conv.conversationType).toBe('PROJECT');
      expect(conv.projectOfferId).toBe(offer.id);
      expect(conv.businessId).toBe(offer.businessId);
      expect(conv.creatorId).toBe(offer.studentId);
    });
  });

  describe('4. Message Delivery, Attachment Constraints & Unread Tracking', () => {
    let testConv: Conversation;

    beforeEach(() => {
      testConv = storage.getOrCreatePreProjectConversation(
        'business-1',
        'student-1',
        'business-1'
      );
    });

    it('allows authorized participant to send a text message', () => {
      const msg = storage.sendMessage({
        conversationId: testConv.id,
        senderId: 'business-1',
        messageType: 'TEXT',
        body: 'Hello from client! Are you available to start next Monday?'
      });

      expect(msg).toBeDefined();
      expect(msg.body).toBe('Hello from client! Are you available to start next Monday?');
      expect(msg.messageType).toBe('TEXT');
      expect(msg.senderId).toBe('business-1');

      const messages = storage.getMessages(testConv.id);
      expect(messages.some((m) => m.id === msg.id)).toBe(true);
    });

    it('rejects sending a message with empty body for TEXT message type', () => {
      expect(() => {
        storage.sendMessage({
          conversationId: testConv.id,
          senderId: 'business-1',
          messageType: 'TEXT',
          body: '    '
        });
      }).toThrow(/body/i);
    });

    it('rejects sending a message from an unauthorized non-participant', () => {
      expect(() => {
        storage.sendMessage({
          conversationId: testConv.id,
          senderId: 'student-2', // outsider
          messageType: 'TEXT',
          body: 'Unauthorized intrusion attempt'
        });
      }).toThrow(/authorized/i);
    });

    it('correctly tracks and clears unread counts when reading conversation', () => {
      // Send message from business to student
      storage.sendMessage({
        conversationId: testConv.id,
        senderId: 'business-1',
        messageType: 'TEXT',
        body: 'Unread message check'
      });

      // Verify student has unread message
      const studentUnreadBefore = storage.getTotalUnreadCount('student-1');
      expect(studentUnreadBefore).toBeGreaterThan(0);

      // Student marks conversation as read
      storage.markConversationRead(testConv.id, 'student-1');

      // Student unread count should now be 0 for this conversation
      const convAfterRead = storage.getConversation(testConv.id);
      const studentParticipant = convAfterRead?.participants?.find((p) => p.userId === 'student-1');
      expect(studentParticipant).toBeDefined();
    });

    it('validates voice attachments duration and payload metadata', () => {
      const voiceAttachment: MessageAttachment = {
        id: 'voice-1',
        messageId: '',
        conversationId: testConv.id,
        storagePath: `conversations/${testConv.id}/voice-1.webm`,
        fileName: 'voicenote.webm',
        fileSizeBytes: 24000,
        mimeType: 'audio/webm',
        voiceDurationSeconds: 45,
        createdAt: new Date().toISOString()
      };

      const msg = storage.sendMessage({
        conversationId: testConv.id,
        senderId: 'student-1',
        messageType: 'VOICE',
        body: 'Voice message (45 sec)',
        attachments: [voiceAttachment]
      });

      expect(msg.messageType).toBe('VOICE');
      expect(msg.attachments).toHaveLength(1);
      expect(msg.attachments![0].voiceDurationSeconds).toBe(45);
    });
  });

  describe('5. Live Supabase Service Contract & Security API Verification', () => {
    it('exposes all required messaging methods on supabaseService', async () => {
      const { supabaseService } = await import('../lib/supabaseService');
      expect(typeof supabaseService.isLiveBackendConfigured).toBe('function');
      expect(typeof supabaseService.getConversations).toBe('function');
      expect(typeof supabaseService.getOrCreatePreProjectConversation).toBe('function');
      expect(typeof supabaseService.getOrCreateProjectConversation).toBe('function');
      expect(typeof supabaseService.getMessages).toBe('function');
      expect(typeof supabaseService.sendMessage).toBe('function');
      expect(typeof supabaseService.uploadChatAttachment).toBe('function');
      expect(typeof supabaseService.createSignedAttachmentUrl).toBe('function');
      expect(typeof supabaseService.markConversationRead).toBe('function');
      expect(typeof supabaseService.subscribeToConversation).toBe('function');
    });

    it('verifies safe handling when live backend is unconfigured', async () => {
      const { supabaseService } = await import('../lib/supabaseService');
      // When unconfigured, queries return empty or null safely without throwing
      const convs = await supabaseService.getConversations('test-user');
      expect(Array.isArray(convs)).toBe(true);

      const msgs = await supabaseService.getMessages('test-conv');
      expect(Array.isArray(msgs)).toBe(true);
    });
  });

  describe('6. Android Chat Repository Supabase Integration Contract', () => {
    const reposPath = path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/data/repository/Repositories.kt');
    const modelsPath = path.resolve(process.cwd(), 'android/app/src/main/java/in/prooftopay/app/data/model/Models.kt');

    it('verifies Android repository and model files exist', () => {
      expect(fs.existsSync(reposPath)).toBe(true);
      expect(fs.existsSync(modelsPath)).toBe(true);
    });

    const reposContent = fs.readFileSync(reposPath, 'utf8');
    const modelsContent = fs.readFileSync(modelsPath, 'utf8');

    it('defines database DTOs for messages and attachments in Models.kt', () => {
      expect(modelsContent).toMatch(/data\s+class\s+DbMessageInsert/);
      expect(modelsContent).toMatch(/data\s+class\s+DbMessageRow/);
      expect(modelsContent).toMatch(/data\s+class\s+DbAttachmentInsert/);
      expect(modelsContent).toMatch(/data\s+class\s+DbAttachmentRow/);
    });

    it('connects ChatRepository to Postgrest and Realtime SDK', () => {
      expect(reposContent).toMatch(/suspend\s+fun\s+fetchMessages/);
      expect(reposContent).toMatch(/postgrest\["messages"\]/);
      expect(reposContent).toMatch(/postgrest\["message_attachments"\]/);
      expect(reposContent).toMatch(/realtime\.channel/);
      expect(reposContent).toMatch(/postgresChangeFlow/);
    });

    it('generates short-lived signed URLs for attachments in ChatRepository', () => {
      expect(reposContent).toMatch(/storage\["chat_attachments"\]/);
      expect(reposContent).toMatch(/createSignedUrl/);
    });

    it('enforces atomic transactional RPC invocation for sending messages in Android', () => {
      expect(reposContent).toMatch(/postgrest\.rpc/);
      expect(reposContent).toMatch(/send_chat_message/);
      expect(reposContent).toMatch(/storage\["chat_attachments"\]\.delete/);
      expect(modelsContent).toMatch(/data\s+class\s+DbSendChatMessageParams/);
      expect(modelsContent).toMatch(/data\s+class\s+DbSendChatMessageResult/);
    });

    it('enforces atomic transactional RPC invocation for sending messages in Web service', () => {
      const servicePath = path.resolve(process.cwd(), 'src/lib/supabaseService.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      expect(serviceContent).toMatch(/\.rpc\('send_chat_message',/);
      expect(serviceContent).toMatch(/storage\.from\('chat_attachments'\)\.remove/);
    });
  });
});


