import { useState } from 'react';
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
  ArrowUpRight,
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

const channelDisplay: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  email: { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', color: 'text-blue-600' },
  chat: { icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Chat', color: 'text-green-600' },
  phone: { icon: <Phone className="h-3.5 w-3.5" />, label: 'Telefone', color: 'text-gray-600' },
  whatsapp: { icon: <Smartphone className="h-3.5 w-3.5" />, label: 'WhatsApp', color: 'text-green-500' },
  sms: { icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'SMS', color: 'text-blue-500' },
  social: { icon: <Globe className="h-3.5 w-3.5" />, label: 'Social', color: 'text-purple-600' },
  portal: { icon: <User className="h-3.5 w-3.5" />, label: 'Portal', color: 'text-indigo-600' },
  internal: { icon: <Hash className="h-3.5 w-3.5" />, label: 'Interno', color: 'text-gray-500' },
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
  onTransfer,
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
    <div className="px-4 py-2.5 border-b flex items-center justify-between bg-card/50">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs">{getContactInitials()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{getContactName()}</h3>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-1', channel.color)}>
              {channel.icon}
              {channel.label}
            </Badge>
            <Badge variant={priority.variant} className="text-[10px] px-1.5 py-0">
              {priority.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {conversation.conversation_number}
            </span>
            {conversation.contact?.email && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground truncate">
                  {conversation.contact.email}
                </span>
              </>
            )}
            {conversation.account && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground truncate">
                  {conversation.account.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SLA indicator */}
      {conversation.sla_response_due_at && conversation.status !== 'closed' && (
        <div className="mx-3 flex-shrink-0">
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
              <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={onAssignToMe}>
                <UserPlus className="h-3.5 w-3.5" />
                Assumir
              </Button>
            </TooltipTrigger>
            <TooltipContent>Atribuir esta conversação a mim</TooltipContent>
          </Tooltip>
        )}

        {conversation.status !== 'closed' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={onClose}>
                <CheckCircle className="h-3.5 w-3.5" />
                Resolver
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fechar conversação</TooltipContent>
          </Tooltip>
        )}

        {/* Contact 360 link */}
        {conversation.contact_id && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => navigate(`/customer-360?contact=${conversation.contact_id}`)}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver Customer 360</TooltipContent>
          </Tooltip>
        )}

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {/* Status */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <Tag className="h-3.5 w-3.5 mr-2" />
                Alterar Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('open')}>Aberta</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('waiting_customer')}>Aguardando Cliente</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('waiting_agent')}>Aguardando Agente</DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('on_hold')}>Em Espera</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Priority */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mr-2" />
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

            {/* Snooze */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <Clock className="h-3.5 w-3.5 mr-2" />
                Adiar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem className="text-xs" onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 1);
                  onSnooze(d);
                }}>
                  1 hora
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 4);
                  onSnooze(d);
                }}>
                  4 horas
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  onSnooze(d);
                }}>
                  Amanhã às 9h
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs" onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  d.setHours(9, 0, 0, 0);
                  onSnooze(d);
                }}>
                  Próxima semana
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-xs" onClick={() => onUpdateStatus('on_hold')}>
              <Pause className="h-3.5 w-3.5 mr-2" />
              Colocar em Espera
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs text-destructive" onClick={onMarkSpam}>
              <AlertTriangle className="h-3.5 w-3.5 mr-2" />
              Marcar como Spam
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
