import { useState, useEffect, useCallback, useMemo } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Inbox } from '@/components/icons';
import {
  useConversations,
  useConversationMessages,
  useAgentStatus,
  type Conversation,
  type ConversationStatus,
  type ConversationChannel,
  type AgentStatus,
} from '@/hooks/useConversations';
import { useConversationActions } from '@/hooks/useConversationActions';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useAuth } from '@/hooks/useAuth';
import { InboxConversationList } from '@/components/inbox/InboxConversationList';
import { InboxConversationHeader } from '@/components/inbox/InboxConversationHeader';
import { InboxMessageThread } from '@/components/inbox/InboxMessageThread';
import { InboxReplyBox } from '@/components/inbox/InboxReplyBox';
import { InboxContextPanel } from '@/components/inbox/InboxContextPanel';

// ──────────────────────────────────────────────
// Status filter → query status mapping
// ──────────────────────────────────────────────
function resolveStatusFilter(tab: string): ConversationStatus | ConversationStatus[] | undefined {
  switch (tab) {
    case 'active':
      return ['open', 'waiting_agent', 'bot_handling'] as ConversationStatus[];
    case 'waiting':
      return 'waiting_customer';
    case 'closed':
      return 'closed';
    default:
      return undefined; // 'all'
  }
}

// ──────────────────────────────────────────────
// Main Orchestrator
// ──────────────────────────────────────────────
export default function OmnichannelInbox() {
  const { profile } = useAuth();

  // ── Selection & filters ──
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [channelFilter, setChannelFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [showContextPanel, setShowContextPanel] = useState(true);

  // ── Derive query options from filters ──
  const queryOptions = useMemo(() => {
    const opts: {
      status?: ConversationStatus | ConversationStatus[];
      channel?: ConversationChannel;
      ownerId?: string;
    } = {};

    const resolvedStatus = resolveStatusFilter(statusFilter);
    if (resolvedStatus) opts.status = resolvedStatus;
    if (channelFilter !== 'all') opts.channel = channelFilter as ConversationChannel;
    if (ownerFilter === 'mine' && profile?.id) opts.ownerId = profile.id;

    return opts;
  }, [statusFilter, channelFilter, ownerFilter, profile?.id]);

  // ── Data hooks ──
  const { status: agentStatus, updateStatus: updateAgentStatus } = useAgentStatus();
  const {
    conversations: rawConversations,
    loading: conversationsLoading,
    refetch: refetchConversations,
  } = useConversations(queryOptions);

  // Apply client-side owner filter for "unassigned"
  const conversations = useMemo(() => {
    if (ownerFilter === 'unassigned') {
      return rawConversations.filter(c => !c.owner_id);
    }
    return rawConversations;
  }, [rawConversations, ownerFilter]);

  const {
    messages,
    loading: messagesLoading,
    refetch: refetchMessages,
  } = useConversationMessages(selectedConversation?.id || null);

  // ── Actions ──
  const actions = useConversationActions(() => {
    refetchConversations();
  });

  const { sendMessage, sending } = useSendMessage();

  // ── Keep selected conversation in sync with refreshed data ──
  useEffect(() => {
    if (!selectedConversation) return;
    const updated = conversations.find(c => c.id === selectedConversation.id);
    if (updated) {
      setSelectedConversation(updated);
    }
  }, [conversations, selectedConversation?.id]);

  // ── Mark conversation as read when selected ──
  useEffect(() => {
    if (selectedConversation && selectedConversation.unread_count > 0) {
      actions.markRead(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const currentIdx = selectedConversation
        ? conversations.findIndex(c => c.id === selectedConversation.id)
        : -1;

      switch (e.key) {
        case 'ArrowDown':
        case 'j': {
          e.preventDefault();
          const nextIdx = Math.min(currentIdx + 1, conversations.length - 1);
          if (conversations[nextIdx]) setSelectedConversation(conversations[nextIdx]);
          break;
        }
        case 'ArrowUp':
        case 'k': {
          e.preventDefault();
          const prevIdx = Math.max(currentIdx - 1, 0);
          if (conversations[prevIdx]) setSelectedConversation(conversations[prevIdx]);
          break;
        }
        case 'e': {
          if (selectedConversation && selectedConversation.status !== 'closed') {
            e.preventDefault();
            actions.closeConversation(selectedConversation.id);
          }
          break;
        }
        case 'a': {
          if (selectedConversation && !selectedConversation.owner_id) {
            e.preventDefault();
            actions.assignToMe(selectedConversation.id);
          }
          break;
        }
        case 'i': {
          e.preventDefault();
          setShowContextPanel(prev => !prev);
          break;
        }
        case 'Escape': {
          setSelectedConversation(null);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConversation, conversations, actions]);

  // ── Handlers ──
  const handleSelectConversation = useCallback((conv: Conversation) => {
    setSelectedConversation(conv);
  }, []);

  const handleAssignToMe = useCallback(() => {
    if (!selectedConversation) return;
    actions.assignToMe(selectedConversation.id);
  }, [selectedConversation, actions]);

  const handleClose = useCallback(() => {
    if (!selectedConversation) return;
    actions.closeConversation(selectedConversation.id);
  }, [selectedConversation, actions]);

  const handleUpdateStatus = useCallback((status: ConversationStatus) => {
    if (!selectedConversation) return;
    actions.updateStatus(selectedConversation.id, status);
  }, [selectedConversation, actions]);

  const handleUpdatePriority = useCallback((priority: string) => {
    if (!selectedConversation) return;
    actions.updatePriority(selectedConversation.id, priority as 'low' | 'medium' | 'high' | 'critical');
  }, [selectedConversation, actions]);

  const handleSnooze = useCallback((until: Date) => {
    if (!selectedConversation) return;
    actions.snoozeConversation(selectedConversation.id, until);
  }, [selectedConversation, actions]);

  const handleMarkSpam = useCallback(() => {
    if (!selectedConversation) return;
    actions.markAsSpam(selectedConversation.id);
  }, [selectedConversation, actions]);

  const handleTransfer = useCallback((agentId: string) => {
    if (!selectedConversation) return;
    actions.transferConversation(selectedConversation.id, agentId);
  }, [selectedConversation, actions]);

  const handleSendMessage = useCallback(async (content: string, isInternal: boolean): Promise<boolean> => {
    if (!selectedConversation) return false;
    const success = await sendMessage({
      conversationId: selectedConversation.id,
      content,
      isInternal,
    });
    if (success) {
      refetchMessages();
    }
    return success;
  }, [selectedConversation, sendMessage, refetchMessages]);

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  return (
    <>
      <TooltipProvider delayDuration={200}>
        <div className="flex h-[calc(100vh-72px)] overflow-hidden m-3 rounded-2xl shadow-elevation-2 bg-card">
          {/* ───── Left: Conversation List ───── */}
          <InboxConversationList
            conversations={conversations}
            loading={conversationsLoading}
            selectedId={selectedConversation?.id || null}
            agentStatus={agentStatus}
            onSelect={handleSelectConversation}
            onRefresh={refetchConversations}
            onUpdateAgentStatus={(s) => updateAgentStatus(s as AgentStatus)}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            channelFilter={channelFilter}
            onChannelFilterChange={setChannelFilter}
            ownerFilter={ownerFilter}
            onOwnerFilterChange={setOwnerFilter}
          />

          {/* ───── Center: Thread + Reply ───── */}
          <div className="flex-1 flex flex-col bg-background min-w-0">
            {selectedConversation ? (
              <>
                <InboxConversationHeader
                  conversation={selectedConversation}
                  onAssignToMe={handleAssignToMe}
                  onClose={handleClose}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdatePriority={handleUpdatePriority}
                  onSnooze={handleSnooze}
                  onMarkSpam={handleMarkSpam}
                  onTransfer={handleTransfer}
                />

                <InboxMessageThread
                  messages={messages}
                  loading={messagesLoading}
                  currentUserId={profile?.id}
                />

                {selectedConversation.status !== 'closed' && (
                  <InboxReplyBox
                    conversationId={selectedConversation.id}
                    contactId={selectedConversation.contact_id}
                    onSend={handleSendMessage}
                    sending={sending}
                    disabled={selectedConversation.status === 'spam'}
                  />
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground animate-fade-in">
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Inbox className="h-10 w-10 text-primary/40" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Selecione uma conversação</h3>
                    <p className="text-sm mt-1 text-muted-foreground">Escolha uma conversação da lista para começar o atendimento</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    <kbd className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-mono border border-border/50 shadow-sm">↑↓ navegar</kbd>
                    <kbd className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-mono border border-border/50 shadow-sm">E resolver</kbd>
                    <kbd className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-mono border border-border/50 shadow-sm">A assumir</kbd>
                    <kbd className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-mono border border-border/50 shadow-sm">I contexto</kbd>
                    <kbd className="bg-muted rounded-lg px-2.5 py-1 text-[11px] font-mono border border-border/50 shadow-sm">Esc voltar</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ───── Right: Context Panel ───── */}
          {selectedConversation && showContextPanel && (
            <InboxContextPanel conversation={selectedConversation} />
          )}
        </div>
      </TooltipProvider>
    </>
  );
}
