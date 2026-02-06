import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, User, Bot, EyeOff, CheckCheck, Check, Clock, AlertTriangle, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationMessage } from '@/hooks/useConversations';

interface InboxMessageThreadProps {
  messages: ConversationMessage[];
  loading: boolean;
  currentUserId?: string;
}

const deliveryIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3 text-muted-foreground" />,
  sent: <Check className="h-3 w-3 text-muted-foreground" />,
  delivered: <CheckCheck className="h-3 w-3 text-muted-foreground" />,
  read: <CheckCheck className="h-3 w-3 text-blue-500" />,
  failed: <AlertTriangle className="h-3 w-3 text-destructive" />,
  internal: <EyeOff className="h-3 w-3 text-amber-500" />,
};

export function InboxMessageThread({ messages, loading, currentUserId }: InboxMessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 w-full max-w-md px-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma mensagem</p>
          <p className="text-sm mt-1">A conversação aparecerá aqui</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: ConversationMessage[] }[] = [];
  let currentDate = '';
  messages.forEach(msg => {
    const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
      {groupedMessages.map(group => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {format(new Date(group.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {group.messages.map((msg, idx) => {
            const isAgent = msg.sender_type === 'agent';
            const isCustomer = msg.sender_type === 'customer';
            const isBot = msg.sender_type === 'bot';
            const isSystem = msg.sender_type === 'system';
            const isCurrentUser = msg.sender_id === currentUserId;
            const isConsecutive = idx > 0 &&
              group.messages[idx - 1].sender_type === msg.sender_type &&
              group.messages[idx - 1].sender_id === msg.sender_id;

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="bg-muted/50 border border-dashed rounded-full px-4 py-1.5 text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <Bot className="h-3 w-3" />
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5 group',
                  isAgent && isCurrentUser ? 'flex-row-reverse' : 'flex-row',
                  isConsecutive ? 'mt-1' : 'mt-3'
                )}
              >
                {/* Avatar */}
                {!isConsecutive ? (
                  <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                    {isBot ? (
                      <AvatarFallback className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px]">
                        <Bot className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    ) : isAgent ? (
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                        {msg.sender_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'AG'}
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-secondary text-[10px]">
                        {msg.sender_name?.[0] || <User className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <div className="w-7 flex-shrink-0" />
                )}

                {/* Message content */}
                <div className={cn(
                  'max-w-[75%] min-w-[120px]',
                  isAgent && isCurrentUser && 'flex flex-col items-end'
                )}>
                  {/* Sender name (only on first message in sequence) */}
                  {!isConsecutive && (
                    <div className={cn(
                      'flex items-center gap-1.5 mb-1',
                      isAgent && isCurrentUser && 'flex-row-reverse'
                    )}>
                      <span className="text-xs font-medium">
                        {isBot ? 'Bot' : msg.sender_name || (isAgent ? 'Agente' : 'Cliente')}
                      </span>
                      {isAgent && !isBot && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
                          Agente
                        </Badge>
                      )}
                      {msg.is_internal && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 gap-0.5 border-amber-300 text-amber-600">
                          <EyeOff className="h-2 w-2" />
                          Interno
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    'rounded-2xl px-3.5 py-2 text-sm',
                    isSystem && 'bg-muted/50 border border-dashed italic text-muted-foreground',
                    isAgent && !msg.is_internal && 'bg-primary text-primary-foreground rounded-tr-md',
                    isCustomer && 'bg-muted rounded-tl-md',
                    isBot && 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-tl-md',
                    msg.is_internal && 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-tr-md',
                    isConsecutive && isAgent && isCurrentUser && 'rounded-tr-2xl',
                    isConsecutive && !isAgent && 'rounded-tl-2xl',
                  )}>
                    {msg.content_html ? (
                      <div
                        className="prose prose-sm max-w-none [&>p]:my-0"
                        dangerouslySetInnerHTML={{ __html: msg.content_html }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}

                    {/* Attachments */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(msg.attachments as any[]).map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-background/50 rounded px-2 py-1 hover:underline"
                          >
                            <Paperclip className="h-3 w-3" />
                            {att.name || `Anexo ${i + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={cn(
                    'flex items-center gap-1.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
                    isAgent && isCurrentUser && 'flex-row-reverse'
                  )}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-[10px] text-muted-foreground cursor-default">
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(msg.created_at), "dd/MM/yyyy 'às' HH:mm:ss")}
                      </TooltipContent>
                    </Tooltip>
                    {isAgent && deliveryIcons[msg.delivery_status]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
