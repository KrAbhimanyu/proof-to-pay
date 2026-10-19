import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Paperclip,
  Mic,
  Image as ImageIcon,
  FileText,
  Play,
  Pause,
  Download,
  Search,
  MessageSquare,
  Lock,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  Check,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import {
  User,
  Conversation,
  Message,
  MessageType,
  MessageAttachment
} from '../../types';
import { storage } from '../../lib/storage';
import { supabaseService } from '../../lib/supabaseService';
import { VoiceRecorder } from './VoiceRecorder';
import { ThemeToggle } from '../common/ThemeToggle';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialConversationId?: string;
  targetUser?: {
    id: string;
    name: string;
    role: 'STUDENT' | 'BUSINESS' | 'ADMIN' | 'RECRUITER';
  };
  targetProjectId?: string;
  targetOfferId?: string;
  onNavigateToProject?: (projectId: string) => void;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB max

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav'
];

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialConversationId,
  targetUser,
  targetProjectId,
  targetOfferId,
  onNavigateToProject
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'PRE_PROJECT' | 'PROJECT' | 'UNREAD'>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Load and refresh conversations
  const refreshConversations = async (): Promise<Conversation[]> => {
    if (supabaseService.isLiveBackendConfigured()) {
      try {
        const remoteList = await supabaseService.getConversations(currentUser.id);
        if (remoteList && remoteList.length > 0) {
          setConversations(remoteList);
          return remoteList;
        }
      } catch (err: any) {
        console.warn('Falling back to local storage for conversations:', err);
      }
    }
    const list = storage.getConversations(currentUser.id);
    setConversations(list);
    return list;
  };

  const loadMessages = async (conversationId: string) => {
    if (supabaseService.isLiveBackendConfigured()) {
      try {
        const remoteMsgs = await supabaseService.getMessages(conversationId);
        if (remoteMsgs && remoteMsgs.length > 0) {
          const withUrls = await Promise.all(
            remoteMsgs.map(async (msg) => {
              if (msg.attachments && msg.attachments.length > 0) {
                const attsWithUrls = await Promise.all(
                  msg.attachments.map(async (att) => {
                    if (!att.downloadUrl && att.storagePath) {
                      const signed = await supabaseService.createSignedAttachmentUrl(att.storagePath, 3600);
                      return { ...att, downloadUrl: signed || undefined };
                    }
                    return att;
                  })
                );
                return { ...msg, attachments: attsWithUrls };
              }
              return msg;
            })
          );
          setMessages(withUrls);
          return;
        }
      } catch (err: any) {
        console.warn('Failed to fetch messages from live backend, checking local storage:', err);
      }
    }
    const msgs = storage.getMessages(conversationId);
    setMessages(msgs);
  };

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initChat = async () => {
      const list = await refreshConversations();
      if (!isMounted) return;

      if (initialConversationId) {
        setActiveConversationId(initialConversationId);
      } else if (targetOfferId) {
        try {
          if (supabaseService.isLiveBackendConfigured()) {
            const remoteConv = await supabaseService.getOrCreateProjectConversation(targetOfferId);
            if (remoteConv) {
              setActiveConversationId(remoteConv.id);
              await refreshConversations();
              return;
            }
          }
          const conv = storage.getOrCreateProjectConversation(targetOfferId);
          setActiveConversationId(conv.id);
          await refreshConversations();
        } catch (err: any) {
          setErrorMessage(err.message || 'Could not load project conversation.');
        }
      } else if (targetUser) {
        try {
          const businessId = currentUser.role === 'BUSINESS' ? currentUser.id : targetUser.id;
          const creatorId = currentUser.role === 'STUDENT' ? currentUser.id : targetUser.id;
          if (supabaseService.isLiveBackendConfigured()) {
            const remoteConv = await supabaseService.getOrCreatePreProjectConversation(
              businessId,
              creatorId,
              currentUser.id,
              targetProjectId
            );
            if (remoteConv) {
              setActiveConversationId(remoteConv.id);
              await refreshConversations();
              return;
            }
          }
          const conv = storage.getOrCreatePreProjectConversation(
            businessId,
            creatorId,
            currentUser.id,
            targetProjectId
          );
          setActiveConversationId(conv.id);
          await refreshConversations();
        } catch (err: any) {
          setErrorMessage(err.message || 'Could not initiate pre-project conversation.');
        }
      } else if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      }
    };

    initChat();

    // Fallback polling for updates
    const interval = setInterval(() => {
      refreshConversations();
      if (activeConversationId) {
        loadMessages(activeConversationId);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, initialConversationId, targetOfferId, targetUser, targetProjectId]);

  // Realtime subscription setup & cleanup
  useEffect(() => {
    if (!activeConversationId || !isOpen) return;

    loadMessages(activeConversationId);

    if (supabaseService.isLiveBackendConfigured()) {
      supabaseService.markConversationRead(activeConversationId, currentUser.id);
    } else {
      storage.markConversationRead(activeConversationId, currentUser.id);
    }
    refreshConversations();

    let unsubscribe: (() => void) | undefined;
    if (supabaseService.isLiveBackendConfigured()) {
      unsubscribe = supabaseService.subscribeToConversation(
        activeConversationId,
        async (newMsg) => {
          let msgToAdd = newMsg;
          if (newMsg.attachments && newMsg.attachments.length > 0) {
            const attsWithUrls = await Promise.all(
              newMsg.attachments.map(async (att) => {
                if (!att.downloadUrl && att.storagePath) {
                  const signed = await supabaseService.createSignedAttachmentUrl(att.storagePath, 3600);
                  return { ...att, downloadUrl: signed || undefined };
                }
                return att;
              })
            );
            msgToAdd = { ...newMsg, attachments: attsWithUrls };
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === msgToAdd.id)) return prev;
            return [...prev, msgToAdd];
          });
          refreshConversations();
        }
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeConversationId, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConversationId || isSending) return;

    if (currentUser.isSuspended) {
      setErrorMessage('Your account is currently suspended. Messaging is disabled.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    const text = messageInput.trim();

    try {
      if (supabaseService.isLiveBackendConfigured()) {
        const sent = await supabaseService.sendMessage({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          messageType: 'TEXT',
          body: text
        });
        if (!sent) {
          throw new Error('Failed to deliver message to live backend.');
        }
      } else {
        storage.sendMessage({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          messageType: 'TEXT',
          body: text
        });
      }
      setMessageInput('');
      await loadMessages(activeConversationId);
      await refreshConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId || uploadingAttachment) return;

    if (currentUser.isSuspended) {
      setErrorMessage('Your account is currently suspended. File uploads are disabled.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds the maximum allowed size of 20 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(`Unsupported file format (${file.type || 'unknown'}). Please upload standard documents, images, or audio.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingAttachment(true);
    setErrorMessage(null);

    try {
      const isImage = file.type.startsWith('image/');
      const messageType: MessageType = isImage ? 'IMAGE' : 'FILE';

      if (supabaseService.isLiveBackendConfigured()) {
        const uploadedAttachment = await supabaseService.uploadChatAttachment(
          activeConversationId,
          file,
          file.name,
          file.type
        );

        if (!uploadedAttachment) {
          throw new Error('Upload to secure storage failed. Verify network connection and storage permissions.');
        }

        const sent = await supabaseService.sendMessage({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          messageType,
          body: isImage ? undefined : file.name,
          attachments: [uploadedAttachment]
        });

        if (!sent) {
          throw new Error('Message persistence failed. The upload was not recorded.');
        }
      } else {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = () => {
            const simulatedStoragePath = `conversations/${activeConversationId}/${Date.now()}_${encodeURIComponent(file.name)}`;
            const localPreviewUrl = reader.result as string;

            const attachment: MessageAttachment = {
              id: `att-${Date.now()}`,
              messageId: '',
              conversationId: activeConversationId,
              storagePath: simulatedStoragePath,
              fileName: file.name,
              fileSizeBytes: file.size,
              mimeType: file.type,
              downloadUrl: localPreviewUrl,
              createdAt: new Date().toISOString()
            };

            storage.sendMessage({
              conversationId: activeConversationId,
              senderId: currentUser.id,
              messageType,
              body: isImage ? undefined : file.name,
              attachments: [attachment]
            });
            resolve();
          };
          reader.onerror = () => reject(new Error('Failed to read file from disk.'));
          reader.readAsDataURL(file);
        });
      }

      await loadMessages(activeConversationId);
      await refreshConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload attachment.');
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendVoice = async (audioBlob: Blob, durationSeconds: number) => {
    if (!activeConversationId) return;

    if (currentUser.isSuspended) {
      setErrorMessage('Your account is currently suspended. Voice messaging is disabled.');
      return;
    }

    setErrorMessage(null);

    try {
      if (supabaseService.isLiveBackendConfigured()) {
        const fileName = `voicenote_${Date.now()}.webm`;
        const uploadedAttachment = await supabaseService.uploadChatAttachment(
          activeConversationId,
          audioBlob,
          fileName,
          audioBlob.type || 'audio/webm',
          durationSeconds
        );

        if (!uploadedAttachment) {
          throw new Error('Failed to upload voice note to private storage.');
        }

        const sent = await supabaseService.sendMessage({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          messageType: 'VOICE',
          body: `🎤 Voice note (${durationSeconds}s)`,
          attachments: [uploadedAttachment]
        });

        if (!sent) {
          throw new Error('Failed to deliver voice note message.');
        }
      } else {
        const simulatedStoragePath = `conversations/${activeConversationId}/${Date.now()}_voicenote.webm`;
        const audioUrl = URL.createObjectURL(audioBlob);

        const attachment: MessageAttachment = {
          id: `att-voice-${Date.now()}`,
          messageId: '',
          conversationId: activeConversationId,
          storagePath: simulatedStoragePath,
          fileName: `Voice Note (${durationSeconds}s).webm`,
          fileSizeBytes: audioBlob.size,
          mimeType: audioBlob.type || 'audio/webm',
          voiceDurationSeconds: durationSeconds,
          downloadUrl: audioUrl,
          createdAt: new Date().toISOString()
        };

        storage.sendMessage({
          conversationId: activeConversationId,
          senderId: currentUser.id,
          messageType: 'VOICE',
          body: `🎤 Voice note (${durationSeconds}s)`,
          attachments: [attachment]
        });
      }

      setIsRecordingVoice(false);
      await loadMessages(activeConversationId);
      await refreshConversations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send voice note.');
    }
  };

  const togglePlayAudio = (attachmentId: string, url?: string) => {
    if (!url) return;

    if (playingAudioId === attachmentId) {
      audioElementsRef.current[attachmentId]?.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      if (!audioElementsRef.current[attachmentId]) {
        const audio = new Audio(url);
        audio.onended = () => setPlayingAudioId(null);
        audioElementsRef.current[attachmentId] = audio;
      }
      audioElementsRef.current[attachmentId].play();
      setPlayingAudioId(attachmentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const partnerName = (currentUser.id === c.businessId ? c.creatorName : c.businessName) || '';
    const projectTitle = c.projectTitle || '';
    const matchesSearch =
      partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'PRE_PROJECT') return c.conversationType === 'PRE_PROJECT';
    if (filterType === 'PROJECT') return c.conversationType === 'PROJECT';
    if (filterType === 'UNREAD') return (c.unreadCount || 0) > 0;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div className="relative flex flex-col md:flex-row w-full max-w-5xl h-[92vh] max-h-[800px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Left Panel: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Secure Messages</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" /> End-to-end access restricted
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle variant="icon" />
              <button
                onClick={onClose}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'PROJECT', 'PRE_PROJECT', 'UNREAD'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition text-[11px] ${
                    filterType === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {tab === 'ALL' && 'All'}
                  {tab === 'PROJECT' && 'Project Offers'}
                  {tab === 'PRE_PROJECT' && 'Pre-Project'}
                  {tab === 'UNREAD' && 'Unread'}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No conversations found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Start a pre-project inquiry or accept a project offer to begin chatting.
                </p>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const partnerName = currentUser.id === c.businessId ? c.creatorName : c.businessName;
                const partnerAvatar = currentUser.id === c.businessId ? c.creatorAvatarUrl : c.businessAvatarUrl;
                const isSelected = c.id === activeConversationId;
                const isUnread = (c.unreadCount || 0) > 0;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversationId(c.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          partnerAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            partnerName || 'User'
                          )}&background=6366f1&color=fff`
                        }
                        alt={partnerName || 'User'}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      {c.conversationType === 'PROJECT' ? (
                        <span
                          className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-white ring-2 ring-white dark:ring-slate-900"
                          title="Accepted Project Chat"
                        >
                          <Briefcase className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span
                          className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 rounded-full text-white ring-2 ring-white dark:ring-slate-900"
                          title="Pre-Project Inquiry"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                          {partnerName}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>

                      {c.projectTitle && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate mb-1">
                          📌 {c.projectTitle}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate ${isUnread ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          {c.lastMessageSnippet || 'No messages yet'}
                        </p>
                        {isUnread && (
                          <span className="shrink-0 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Active Conversation View */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-3.5 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={
                      (currentUser.id === activeConv.businessId ? activeConv.creatorAvatarUrl : activeConv.businessAvatarUrl) ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        (currentUser.id === activeConv.businessId ? activeConv.creatorName : activeConv.businessName) || 'User'
                      )}&background=6366f1&color=fff`
                    }
                    alt="Participant avatar"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {currentUser.id === activeConv.businessId ? activeConv.creatorName : activeConv.businessName}
                      </h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        activeConv.conversationType === 'PROJECT'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                      }`}>
                        {activeConv.conversationType === 'PROJECT' ? 'PROJECT CHAT' : 'PRE-PROJECT'}
                      </span>
                    </div>

                    {activeConv.projectTitle ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate max-w-[200px] sm:max-w-md font-medium text-slate-700 dark:text-slate-300">
                          {activeConv.projectTitle}
                        </span>
                        {activeConv.projectId && onNavigateToProject && (
                          <button
                            onClick={() => {
                              onClose();
                              onNavigateToProject(activeConv.projectId!);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 ml-1 text-[11px]"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">Direct creator inquiry</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ThemeToggle variant="icon" />
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Close chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mx-4 mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  <button onClick={() => setErrorMessage(null)} className="font-bold underline ml-2">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Suspension Banner */}
              {currentUser.isSuspended && (
                <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Your account is currently suspended. Sending messages and uploading attachments is disabled.</span>
                </div>
              )}

              {/* Uploading In-Flight Indicator */}
              {uploadingAttachment && (
                <div className="mx-4 mt-2 p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Encrypting and uploading attachment to private storage...</span>
                </div>
              )}

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-900/30">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Start the conversation</p>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Discuss deliverables, scope milestones, file requirements, or voice notes securely.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === currentUser.id;
                    const isSystem = m.messageType === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center my-3">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                            🔔 {m.body}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[70%]">
                          {!isMine && (
                            <img
                              src={
                                m.senderAvatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  m.senderName || 'User'
                                )}&background=6366f1&color=fff`
                              }
                              alt={m.senderName || 'Sender'}
                              className="w-6 h-6 rounded-full object-cover shrink-0 mb-1"
                            />
                          )}

                          <div
                            className={`p-3 rounded-2xl text-xs shadow-xs transition ${
                              isMine
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs'
                            }`}
                          >
                            {/* Message Header for other participants */}
                            {!isMine && (
                              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                {m.senderName}
                              </p>
                            )}

                            {/* TEXT Message */}
                            {m.messageType === 'TEXT' && (
                              <p className="whitespace-pre-wrap leading-relaxed break-words">{m.body}</p>
                            )}

                            {/* IMAGE Message */}
                            {m.messageType === 'IMAGE' && m.attachments?.map((att) => (
                              <div key={att.id} className="space-y-1">
                                <img
                                  src={att.downloadUrl}
                                  alt={att.fileName}
                                  className="max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-95 transition border border-slate-200/40"
                                  onClick={() => window.open(att.downloadUrl, '_blank')}
                                />
                                <div className="flex items-center justify-between text-[10px] opacity-80 pt-0.5">
                                  <span className="truncate max-w-[150px]">{att.fileName}</span>
                                  <span>{formatFileSize(att.fileSizeBytes)}</span>
                                </div>
                              </div>
                            ))}

                              {/* FILE Message */}
                            {m.messageType === 'FILE' && m.attachments?.map((att) => (
                              <div
                                key={att.id}
                                className={`flex items-center gap-2.5 p-2 rounded-xl ${
                                  isMine ? 'bg-indigo-700/60' : 'bg-slate-100 dark:bg-slate-700/60'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  isMine ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-600/70 text-indigo-600 dark:text-indigo-400'
                                }`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate max-w-[180px]">{att.fileName}</p>
                                  <p className="text-[10px] opacity-75">{formatFileSize(att.fileSizeBytes)}</p>
                                </div>
                                {att.downloadUrl && (
                                  <a
                                    href={att.downloadUrl}
                                    download={att.fileName}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`p-1.5 rounded-lg transition ${
                                      isMine
                                        ? 'hover:bg-white/20 text-white'
                                        : 'hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                    }`}
                                    title="Download Attachment"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            ))}

                            {/* VOICE Message */}
                            {m.messageType === 'VOICE' && m.attachments?.map((att) => {
                              const isAudioPlaying = playingAudioId === att.id;
                              return (
                                <div
                                  key={att.id}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl min-w-[200px] ${
                                    isMine ? 'bg-indigo-700/70' : 'bg-slate-100 dark:bg-slate-700/60'
                                  }`}
                                >
                                  <button
                                    onClick={() => togglePlayAudio(att.id, att.downloadUrl)}
                                    className={`p-2 rounded-full transition shadow-xs ${
                                      isMine
                                        ? 'bg-white text-indigo-600 hover:bg-slate-100'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                  >
                                    {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>

                                  <div className="flex-1">
                                    <div className="flex items-center gap-1 h-3 mb-1">
                                      {[40, 80, 25, 95, 60, 100, 70, 30, 85, 45, 90, 50].map((h, i) => (
                                        <span
                                          key={i}
                                          className={`w-1 rounded-full ${
                                            isMine ? 'bg-white/80' : 'bg-indigo-500'
                                          } ${isAudioPlaying ? 'animate-pulse' : ''}`}
                                          style={{ height: `${h}%` }}
                                        />
                                      ))}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] opacity-80">
                                      <span>Voice Message</span>
                                      <span>{att.voiceDurationSeconds}s</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Timestamp & Status */}
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-75">
                              <span>{formatTime(m.createdAt)}</span>
                              {isMine && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {isRecordingVoice ? (
                  <VoiceRecorder
                    onSendVoice={handleSendVoice}
                    onCancel={() => setIsRecordingVoice(false)}
                    maxDurationSeconds={180}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,application/pdf,application/zip,text/plain,.doc,.docx"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAttachment || isSending || currentUser.isSuspended}
                        className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                        title="Attach Document or Image (Max 20MB)"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        disabled={uploadingAttachment || isSending || currentUser.isSuspended}
                        className="p-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition disabled:opacity-40"
                        title="Record Voice Note"
                      >
                        <Mic className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        placeholder={
                          currentUser.isSuspended
                            ? 'Account suspended - messaging disabled'
                            : uploadingAttachment
                            ? 'Uploading attachment...'
                            : isSending
                            ? 'Sending message...'
                            : 'Type a secure message...'
                        }
                        value={messageInput}
                        disabled={currentUser.isSuspended || uploadingAttachment || isSending}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      />

                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending || uploadingAttachment || currentUser.isSuspended}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-sm"
                        title="Send Message"
                      >
                        <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>End-to-end encrypted storage & RLS isolation</span>
                      <span>Max 20MB attachments · 3m voice notes</span>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">Select a conversation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Choose an existing message thread on the left, or open chat from any project or creator profile.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
