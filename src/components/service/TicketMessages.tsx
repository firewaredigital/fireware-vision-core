import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, User, Bot, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  content_html?: string;
  sender_type: 'agent' | 'customer' | 'system';
  sender_name?: string;
  sender_email?: string;
  is_internal: boolean;
  is_resolution?: boolean;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  } | null;
}

interface TicketMessagesProps {
  messages: Message[];
  currentUserId?: string;
  isInternal?: boolean;
}

export function TicketMessages({ 
  messages, 
  currentUserId,
  isInternal = false 
}: TicketMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium">
          {isInternal ? 'Nenhuma nota interna' : 'Nenhuma mensagem'}
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          {isInternal 
            ? 'Notas internas não são visíveis para o cliente'
            : 'A conversação aparecerá aqui'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isAgent = message.sender_type === 'agent';
        const isCustomer = message.sender_type === 'customer';
        const isSystem = message.sender_type === 'system';
        const isCurrentUser = message.sender?.id === currentUserId;

        return (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              isAgent && isCurrentUser && 'flex-row-reverse'
            )}
          >
            {/* Avatar */}
            <Avatar className="h-8 w-8 flex-shrink-0">
              {isSystem ? (
                <AvatarFallback className="bg-muted">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              ) : isAgent && message.sender ? (
                <>
                  <AvatarImage src={message.sender.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                  </AvatarFallback>
                </>
              ) : (
                <AvatarFallback className="bg-secondary text-xs">
                  {message.sender_name?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Message Content */}
            <div 
              className={cn(
                'flex-1 max-w-[85%]',
                isAgent && isCurrentUser && 'flex flex-col items-end'
              )}
            >
              {/* Header */}
              <div className={cn(
                'flex items-center gap-2 mb-1',
                isAgent && isCurrentUser && 'flex-row-reverse'
              )}>
                <span className="text-sm font-medium">
                  {isSystem 
                    ? 'Sistema' 
                    : message.sender 
                      ? `${message.sender.first_name} ${message.sender.last_name}`
                      : message.sender_name || 'Cliente'
                  }
                </span>
                {isAgent && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Agente
                  </Badge>
                )}
                {message.is_internal && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                    <EyeOff className="h-2.5 w-2.5" />
                    Interno
                  </Badge>
                )}
                {message.is_resolution && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-500">
                    Resolução
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* Message Bubble */}
              <div 
                className={cn(
                  'rounded-lg p-3 text-sm',
                  isSystem && 'bg-muted/50 border border-dashed text-muted-foreground italic',
                  isAgent && !isSystem && 'bg-primary/10 border border-primary/20',
                  isCustomer && 'bg-muted',
                  message.is_internal && 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                )}
              >
                {message.content_html ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.content_html }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* Footer with timestamp */}
              <div className={cn(
                'mt-1 flex items-center gap-2 text-xs text-muted-foreground',
                isAgent && isCurrentUser && 'flex-row-reverse'
              )}>
                <span>
                  {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
