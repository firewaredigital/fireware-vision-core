import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UserPlus,
  CheckCircle,
  MoreVertical,
  Clock,
  Tag,
  AlertTriangle,
  Pause,
  Mail,
  Phone,
  MessageSquare,
  Smartphone,
  Globe,
  User,
  Hash,
  ExternalLink,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Conversation, ConversationStatus } from '@/hooks/useConversations';
import { SLACountdown } from '@/components/service/SLACountdown';
import { useNavigate } from 'react-router-dom';

const channelDisplay: Record<string, { icon: React.ReactNode; label: string; bgClass: string; textClass: string }> = {
  email: { icon: <Mail className="h-2.5 w-2.5" />, label: 'Email', bgClass: 'bg-blue-100 dark:bg-blue-950', textClass: 'text-blue-700 dark:text-blue-300' },
  chat: { icon: <MessageSquare className="h-2.5 w-2.5" />, label: 'Chat', bgClass: 'bg-purple-100 dark:bg-purple-950', textClass: 'text-purple-700 dark:text-purple-300' },
  phone: { icon: <Phone className="h-2.5 w-2.5" />, label: 'Telefone', bgClass: 'bg-gray-100 dark:bg-gray-800', textClass: 'text-gray-700 dark:text-gray-300' },
  whatsapp: { icon: <Smartphone className="h-2.5 w-2.5" />, label: 'WhatsApp', bgClass: 'bg-green-100 dark:bg-green-950', textClass: 'text-green-700 dark:text-green-300' },
  sms: { icon: <MessageSquare className="h-2.5 w-2.5" />, label: 'SMS', bgClass: 'bg-sky-100 dark:bg-sky-950', textClass: 'text-sky-700 dark:text-sky-300' },
  social: { icon: <Globe className="h-2.5 w-2.5" />, label: 'Social', bgClass: 'bg-pink-100 dark:bg-pink-950', textClass: 'text-pink-700 dark:text-pink-300' },
  portal: { icon: <User className="h-2.5 w-2.5" />, label: 'Portal', bgClass: 'bg-indigo-100 dark:bg-indigo-950', textClass: 'text-indigo-700 dark:text-indigo-300' },
  internal: { icon: <Hash className="h-2.5 w-2.5" />, label: 'Interno', bgClass: 'bg-gray-100 dark:bg-gray-800', textClass: 'text-gray-600 dark:text-gray-400' },
};

const priorityDisplay: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Baixa', variant: 'secondary' },
  medium: { label: 'Média', variant: 'outline' },
  high: { label: 'Alta', variant: 'default' },
  critical: { label: 'Crítica', variant: 'destructive' },
};

interface InboxConversationHeaderProps {
  conversation: Conversation;
  onAssignToMe: () => void;
  onClose: () => void;
  onUpdateStatus: (status: ConversationStatus) => void;
  onUpdatePriority: (priority: string) => void;
  onSnooze: (until: Date) => void;
  onMarkSpam: () => void;
  onTransfer: (agentId: string) => void;
}

export function InboxConversationHeader({
  conversation,
  onAssignToMe,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onSnooze,
  onMarkSpam,
}: InboxConversationHeaderProps) {
  const navigate = useNavigate();
  const channel = channelDisplay[conversation.channel] || channelDisplay.chat;
  const priority = priorityDisplay[conversation.priority] || priorityDisplay.medium;

  const getContactName = () => {
    if (conversation.contact?.first_name || conversation.contact?.last_name) {
      return `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim();
    }
    return conversation.contact?.email || 'Cliente';
  };

  const getContactInitials = () => {
    const name = getContactName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="px-4 py-2 flex items-center justify-between bg-card/80 backdrop-blur-xl shadow-[0_1px_4px_-1px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar className={cn(
          'h-8 w-8 ring-[1.5px]',
          conversation.priority === 'critical' ? 'ring-destructive' :
          conversation.priority === 'high' ? 'ring-orange-500' : 'ring-border'
        )}>
          <AvatarFallback className="text-[10px] font-semibold">{getContactInitials()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm truncate">{getContactName()}</h3>
            <div className={cn(
              'flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[9px] font-semibold',
              channel.bgClass, channel.textClass
            )}>
              {channel.icon}
              {channel.label}
            </div>
            <Badge variant={priority.variant} className="text-[9px] px-1.5 py-0 rounded-full">
              {priority.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">
              {conversation.conversation_number}
            </span>
            {conversation.contact?.email && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {conversation.contact.email}
                </span>
              </>
            )}
            {conversation.account && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {conversation.account.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SLA indicator */}
      {conversation.sla_response_due_at && conversation.status !== 'closed' && (
        <div className="mx-2 flex-shrink-0">
          <SLACountdown
            dueAt={conversation.sla_response_due_at}
            breached={conversation.sla_response_breached}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!conversation.owner_id && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" className="h-7 text-[11px] gap-1 rounded-full px-3 shadow-sm" onClick={onAssignToMe}>
                <UserPlus className="h-3 w-3" />
                Assumir
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atribuir esta conversação a mim</TooltipContent>
          </Tooltip>
        )}

        {conversation.status !== 'closed' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] gap-1 rounded-full px-3 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                onClick={onClose}
              >
                <CheckCircle className="h-3 w-3" />
                Resolver
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fechar conversação</TooltipContent>
          </Tooltip>
        )}

        {conversation.contact_id && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => navigate(`/customer-360?contact=${conversation.contact_id}`)}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver Customer 360</TooltipContent>
          </Tooltip>
        )}

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-muted/50 hover:bg-muted">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <Tag className="h-3 w-3 mr-2" />
                Alterar Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('open')}>Aberta</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('waiting_customer')}>Aguardando Cliente</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('waiting_agent')}>Aguardando Agente</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('on_hold')}>Em Espera</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-2" />
                Alterar Prioridade
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdatePriority('low')}>Baixa</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdatePriority('medium')}>Média</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdatePriority('high')}>Alta</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdatePriority('critical')}>Crítica</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <Clock className="h-3 w-3 mr-2" />
                Adiar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem className="text-xs" onClick={() => { const d = new Date(); d.setHours(d.getHours() + 1); onSnooze(d); }}>1 hora</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => { const d = new Date(); d.setHours(d.getHours() + 4); onSnooze(d); }}>4 horas</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); onSnooze(d); }}>Amanhã às 9h</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); onSnooze(d); }}>Próxima semana</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('on_hold')}>
              <Pause className="h-3 w-3 mr-2" />
              Colocar em Espera
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-destructive" onClick={onMarkSpam}>
              <AlertTriangle className="h-3 w-3 mr-2" />
              Marcar como Spam
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
