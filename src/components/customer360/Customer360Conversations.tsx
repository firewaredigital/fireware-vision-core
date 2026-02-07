import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Mail, Phone, AlertCircle, Globe } from '@/components/icons';

interface Customer360ConversationsProps {
  entityType: string;
  entityId: string;
}

const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4 text-green-500" />,
  social: <Globe className="h-4 w-4" />,
};

const statusLabels: Record<string, string> = {
  open: 'Aberta', waiting_customer: 'Aguardando Cliente', waiting_agent: 'Aguardando Agente',
  bot_handling: 'Bot', on_hold: 'Em Espera', closed: 'Fechada',
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-500', waiting_customer: 'bg-yellow-500', waiting_agent: 'bg-orange-500',
  closed: 'bg-green-500', on_hold: 'bg-gray-500',
};

export function Customer360Conversations({ entityType, entityId }: Customer360ConversationsProps) {
  const navigate = useNavigate();

  const { data: conversations = [] } = useQuery({
    queryKey: ['c360-conversations', entityId],
    queryFn: async () => {
      const column = entityType === 'account' ? 'account_id' : 'contact_id';
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq(column, entityId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
  });

  const openConversations = conversations.filter((c: any) => c.status !== 'closed');
  const closedConversations = conversations.filter((c: any) => c.status === 'closed');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversas ({conversations.length})
        </CardTitle>
        <Button size="sm" onClick={() => navigate('/service/inbox')}>
          Abrir Inbox
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {openConversations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Abertas ({openConversations.length})
              </h4>
              <div className="space-y-2">
                {openConversations.map((conv: any) => (
                  <ConversationItem key={conv.id} conversation={conv} />
                ))}
              </div>
            </div>
          )}
          {closedConversations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                Fechadas ({closedConversations.length})
              </h4>
              <div className="space-y-2">
                {closedConversations.map((conv: any) => (
                  <ConversationItem key={conv.id} conversation={conv} />
                ))}
              </div>
            </div>
          )}
          {conversations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma conversa encontrada</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ConversationItem({ conversation }: { conversation: any }) {
  return (
    <div className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {channelIcons[conversation.channel] || <MessageSquare className="h-4 w-4" />}
          <span className="font-medium text-sm">{conversation.conversation_number}</span>
          {conversation.sla_response_breached && (
            <AlertCircle className="h-3 w-3 text-destructive" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${statusColors[conversation.status] || 'bg-gray-400'}`} />
          <span className="text-xs text-muted-foreground">
            {statusLabels[conversation.status] || conversation.status}
          </span>
        </div>
      </div>
      {conversation.subject && (
        <p className="text-sm mt-1 truncate">{conversation.subject}</p>
      )}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>{conversation.message_count} mensagens</span>
        {conversation.last_message_at && (
          <span>
            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  );
}
