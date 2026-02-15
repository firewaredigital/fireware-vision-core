import { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, User, Bot, EyeOff, CheckCheck, Check, Clock, AlertTriangle, Paperclip, Lock } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { ConversationMessage } from '@/hooks/useConversations';

interface InboxMessageThreadProps {
  messages: ConversationMessage[];
  loading: boolean;
  currentUserId?: string;
}

const deliveryLabels: Record<string, { icon: React.ReactNode; label: string }> = {
  pending: { icon: <Clock className="h-3 w-3 text-muted-foreground/60" />, label: 'Enviando' },
  sent: { icon: <Check className="h-3 w-3 text-muted-foreground/60" />, label: 'Enviado' },
  delivered: { icon: <CheckCheck className="h-3 w-3 text-green-500" />, label: 'Entregue' },
  read: { icon: <CheckCheck className="h-3 w-3 text-blue-500" />, label: 'Lido' },
  failed: { icon: <AlertTriangle className="h-3 w-3 text-destructive" />, label: 'Falhou' },
  internal: { icon: <EyeOff className="h-3 w-3 text-amber-500" />, label: 'Interno' },
};

export function InboxMessageThread({ messages, loading, currentUserId }: InboxMessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/20 to-background">
        <div className="space-y-4 w-full max-w-md px-6">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn('animate-pulse flex gap-3', i % 2 === 0 && 'flex-row-reverse')}>
              <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded-full w-24" />
                <div className="h-16 bg-muted rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gradient-to-b from-muted/20 to-background">
        <div className="text-center animate-fade-in">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <MessageSquare className="h-8 w-8 opacity-30" />
          </div>
          <p className="font-semibold text-foreground">Nenhuma mensagem</p>
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
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-muted/20 to-background"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground) / 0.2) transparent' }}
    >
      {groupedMessages.map(group => (
        <div key={group.date}>
          {/* Date separator - pill */}
          <div className="flex items-center justify-center my-5">
            <div className="bg-muted/80 rounded-full px-4 py-1.5 shadow-sm">
              <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground/80">
                {format(new Date(group.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
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
                <div key={msg.id} className="flex justify-center my-3 animate-fade-in">
                  <div className="bg-muted/50 rounded-full px-5 py-2 text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <Bot className="h-3 w-3" />
                    {msg.content}
                  </div>
                </div>
              );
            }

            const delivery = deliveryLabels[msg.delivery_status] || deliveryLabels.sent;

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5 group animate-fade-in',
                  isAgent && isCurrentUser ? 'flex-row-reverse' : 'flex-row',
                  isConsecutive ? 'mt-1' : 'mt-4'
                )}
              >
                {/* Avatar */}
                {!isConsecutive ? (
                  <Avatar className={cn(
                    'h-8 w-8 flex-shrink-0 mt-1 ring-2',
                    isBot ? 'ring-purple-300 dark:ring-purple-700' :
                    isAgent ? 'ring-primary/30' : 'ring-muted'
                  )}>
                    {isBot ? (
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950 dark:to-purple-900 text-purple-700 dark:text-purple-300 text-[10px]">
                        <Bot className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    ) : isAgent ? (
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-[10px] font-semibold">
                        {msg.sender_name?.split(' ').map(n => n[0]).join('').substring(0, 2) || 'AG'}
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-muted to-muted/80 text-[10px]">
                        {msg.sender_name?.[0] || <User className="h-3.5 w-3.5" />}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}

                {/* Message content */}
                <div className={cn(
                  'max-w-[70%] min-w-[120px]',
                  isAgent && isCurrentUser && 'flex flex-col items-end'
                )}>
                  {/* Sender name */}
                  {!isConsecutive && (
                    <div className={cn(
                      'flex items-center gap-1.5 mb-1',
                      isAgent && isCurrentUser && 'flex-row-reverse'
                    )}>
                      <span className="text-xs font-semibold">
                        {isBot ? 'Bot' : msg.sender_name || (isAgent ? 'Agente' : 'Cliente')}
                      </span>
                      {isAgent && !isBot && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-3.5">
                          Agente
                        </Badge>
                      )}
                      {msg.is_internal && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-3.5 gap-0.5 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
                          <Lock className="h-2 w-2" />
                          Interno
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    'px-4 py-3 text-sm shadow-sm',
                    // Agent bubble
                    isAgent && !msg.is_internal && 'bg-primary text-primary-foreground rounded-2xl rounded-br-md',
                    // Customer bubble
                    isCustomer && 'bg-card border border-border/50 rounded-2xl rounded-bl-md',
                    // Bot bubble
                    isBot && 'bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 rounded-2xl rounded-bl-md',
                    // Internal note
                    msg.is_internal && 'bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl rounded-br-md',
                    // Consecutive rounding
                    isConsecutive && isAgent && isCurrentUser && 'rounded-tr-2xl',
                    isConsecutive && !isAgent && 'rounded-tl-2xl',
                  )}>
                    {msg.content_html ? (
                      <div
                        className="prose prose-sm max-w-none [&>p]:my-0"
                        dangerouslySetInnerHTML={{ __html: msg.content_html }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    )}

                    {/* Attachments */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {(msg.attachments as any[]).map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs rounded-xl bg-card/80 backdrop-blur-sm border shadow-sm px-3 py-2 hover:shadow-md hover:scale-[1.02] transition-all"
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
                    'flex items-center gap-1.5 mt-1 opacity-60',
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
                    {isAgent && (
                      <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                        {delivery.icon}
                        {delivery.label}
                      </span>
                    )}
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
