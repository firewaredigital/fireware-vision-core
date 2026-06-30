import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  Building2,
  Calendar,
  Tag,
  RefreshCcw,
  MessageSquare,
  FileText,
  Download,
  ThumbsUp,
  ThumbsDown,
} from '@/components/icons';
import { PortalLayout } from './PortalLayout';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

const statusConfig: Record<TicketStatus, { label: string; icon: unknown; color: string }> = {
  new: { label: 'Novo', icon: AlertCircle, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  open: { label: 'Em Andamento', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Aguardando Resposta', icon: Clock, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  on_hold: { label: 'Em Espera', icon: XCircle, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  resolved: { label: 'Resolvido', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Fechado', icon: CheckCircle2, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-800' },
};

export default function PortalTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  // Mock ticket data
  const ticket = {
    id: '1',
    ticket_number: 'TK-001234',
    subject: 'Problema com login no sistema',
    description: 'Estou tendo dificuldades para acessar o sistema. Quando tento fazer login, recebo uma mensagem de erro "Credenciais inválidas" mesmo usando a senha correta.',
    status: 'open' as TicketStatus,
    priority: 'high' as TicketPriority,
    category: 'Suporte Técnico',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    agent: {
      name: 'Maria Santos',
      avatar: '',
    },
  };

  // Mock messages
  const messages = [
    {
      id: '1',
      content: 'Estou tendo dificuldades para acessar o sistema. Quando tento fazer login, recebo uma mensagem de erro "Credenciais inválidas" mesmo usando a senha correta.',
      sender_type: 'customer',
      sender_name: 'João Silva',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
    },
    {
      id: '2',
      content: 'Olá João! Obrigada por entrar em contato. Vou verificar o que pode estar acontecendo. Você poderia me informar qual navegador está utilizando?',
      sender_type: 'agent',
      sender_name: 'Maria Santos',
      created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
    },
    {
      id: '3',
      content: 'Estou usando o Google Chrome versão 120.',
      sender_type: 'customer',
      sender_name: 'João Silva',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
    },
    {
      id: '4',
      content: 'Obrigada pela informação! Identifiquei que houve uma atualização no sistema que pode ter causado esse problema. Por favor, tente limpar o cache do navegador e tentar novamente. Caso o problema persista, faremos um reset de senha.',
      sender_type: 'agent',
      sender_name: 'Maria Santos',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      attachments: [
        { name: 'instrucoes-limpar-cache.pdf', size: '245 KB' },
      ],
    },
  ];

  const statusInfo = statusConfig[ticket.status];
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priorityConfig[ticket.priority];

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    try {
      // TODO: Implement actual message sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Mensagem enviada',
        description: 'Sua resposta foi enviada com sucesso.',
      });
      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    toast({
      title: 'Obrigado pelo feedback!',
      description: 'Sua opinião é muito importante para nós.',
    });
  };

  const canReply = !['resolved', 'closed'].includes(ticket.status);

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/tickets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-mono">{ticket.ticket_number}</h1>
              <Badge className={statusInfo.color}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
              <Badge className={priorityInfo.color}>
                {priorityInfo.label}
              </Badge>
            </div>
            <h2 className="text-lg text-muted-foreground mt-1">{ticket.subject}</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Messages */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender_type === 'customer' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>
                        {message.sender_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex-1 max-w-[80%] ${message.sender_type === 'customer' ? 'text-right' : ''}`}
                    >
                      <div
                        className={`inline-block rounded-lg p-3 ${
                          message.sender_type === 'customer'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((file, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                className={`gap-2 ${
                                  message.sender_type === 'customer'
                                    ? 'text-primary-foreground hover:text-primary-foreground/80'
                                    : ''
                                }`}
                              >
                                <FileText className="h-3 w-3" />
                                <span className="text-xs">{file.name}</span>
                                <Download className="h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{message.sender_name}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reply Box */}
            {canReply ? (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm">
                        <Paperclip className="mr-2 h-4 w-4" />
                        Anexar Arquivo
                      </Button>
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                        {isSending ? (
                          <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Enviar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <h3 className="font-semibold">Este ticket foi resolvido</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        O atendimento foi encerrado. Como você avalia a qualidade do suporte?
                      </p>
                    </div>
                    {!feedbackGiven ? (
                      <div className="flex justify-center gap-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleFeedback('positive')}
                          className="gap-2"
                        >
                          <ThumbsUp className="h-5 w-5 text-green-500" />
                          Satisfeito
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleFeedback('negative')}
                          className="gap-2"
                        >
                          <ThumbsDown className="h-5 w-5 text-red-500" />
                          Insatisfeito
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Obrigado pelo seu feedback!
                      </p>
                    )}
                    <Button variant="link" onClick={() => navigate('/portal/tickets/new')}>
                      Abrir novo ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Detalhes do Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm">
                      {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última atualização</p>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(ticket.updated_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Categoria</p>
                    <p className="text-sm">{ticket.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Info */}
            {ticket.agent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Atendente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ticket.agent.avatar} />
                      <AvatarFallback>
                        {ticket.agent.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{ticket.agent.name}</p>
                      <p className="text-sm text-muted-foreground">Suporte Técnico</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Paperclip className="h-4 w-4" />
                  Ver Anexos
                </Button>
                {canReply && (
                  <Button variant="outline" className="w-full justify-start gap-2 text-destructive">
                    <XCircle className="h-4 w-4" />
                    Cancelar Ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}