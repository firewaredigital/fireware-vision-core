import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Bot, Send, Loader2, User, Wrench,
  AlertTriangle, CheckCircle, Clock, Trash2, XCircle,
  Search, Database, FileText, Users, Package,
  BarChart3, ShieldAlert, ExternalLink
} from '@/components/icons';

interface ToolExecutionResult {
  status: 'success' | 'error' | 'not_found' | 'pending_approval';
  data?: unknown;
  message: string;
  records_affected?: number;
  entity_type?: string;
  entity_id?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Array<{ tool_name: string; result: ToolExecutionResult }>;
  run_id?: string;
  tokens_used?: number;
  duration_ms?: number;
  pii_detected?: boolean;
  requires_approval?: boolean;
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  knowledge_article: FileText,
  contact: Users,
  account: Database,
  customer: Users,
  ticket: FileText,
  opportunity: BarChart3,
  product: Package,
  order: Package,
  lead: Users,
  activity: Clock,
  note: FileText,
  contract: FileText,
  dashboard: BarChart3,
};

const STATUS_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  success: { icon: CheckCircle, className: 'text-green-600 dark:text-green-400' },
  error: { icon: XCircle, className: 'text-red-600 dark:text-red-400' },
  not_found: { icon: Search, className: 'text-yellow-600 dark:text-yellow-400' },
  pending_approval: { icon: ShieldAlert, className: 'text-orange-600 dark:text-orange-400' },
};

function ToolResultCard({ toolName, result }: { toolName: string; result: ToolExecutionResult }) {
  const statusInfo = STATUS_STYLES[result.status] || STATUS_STYLES.success;
  const StatusIcon = statusInfo.icon;
  const EntityIcon = ENTITY_ICONS[result.entity_type || ''] || Wrench;

  return (
    <div className="mt-2 border rounded-md bg-background/50 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Wrench className="h-3 w-3" />
          <span className="font-mono">{toolName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.className}`} />
          <span className={`text-xs font-medium ${statusInfo.className}`}>
            {result.status === 'success' ? 'Sucesso' :
              result.status === 'error' ? 'Erro' :
              result.status === 'not_found' ? 'Não encontrado' : 'Aguardando aprovação'}
          </span>
          {result.records_affected !== undefined && (
            <Badge variant="outline" className="text-xs ml-1">
              {result.records_affected} registro(s)
            </Badge>
          )}
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">{result.message}</p>
        {result.data && <ToolDataDisplay data={result.data} entityType={result.entity_type} />}
        {result.entity_id && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <EntityIcon className="h-3 w-3" />
            <span>ID: <span className="font-mono">{result.entity_id.substring(0, 8)}...</span></span>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolDataDisplay({ data, entityType }: { data: unknown; entityType?: string }) {
  if (!data || typeof data !== 'object') return null;

  const dataObj = data as Record<string, unknown>;

  // If it's an array, show as compact table
  if (Array.isArray(data)) {
    if (data.length === 0) return <p className="text-xs text-muted-foreground mt-1">Nenhum resultado</p>;

    const items = data.slice(0, 5);
    const keys = Object.keys(items[0] || {}).filter(k => k !== 'id' && typeof (items[0] as unknown)[k] !== 'object').slice(0, 4);

    return (
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {keys.map(k => (
                <th key={k} className="text-left py-1 px-2 font-medium text-muted-foreground">{formatLabel(k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: unknown, i: number) => (
              <tr key={i} className="border-b last:border-0">
                {keys.map(k => (
                  <td key={k} className="py-1 px-2 truncate max-w-[200px]">{formatValue(item[k])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 5 && (
          <p className="text-xs text-muted-foreground mt-1 px-2">...e mais {data.length - 5} resultado(s)</p>
        )}
      </div>
    );
  }

  // If object has nested arrays (e.g., contacts + accounts)
  const arrayKeys = Object.keys(dataObj).filter(k => Array.isArray(dataObj[k]));
  const scalarKeys = Object.keys(dataObj).filter(k => !Array.isArray(dataObj[k]) && typeof dataObj[k] !== 'object');

  return (
    <div className="mt-2 space-y-2">
      {scalarKeys.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {scalarKeys.slice(0, 8).map(k => (
            <div key={k} className="text-xs">
              <span className="text-muted-foreground">{formatLabel(k)}: </span>
              <span className="font-medium">{formatValue(dataObj[k])}</span>
            </div>
          ))}
        </div>
      )}
      {arrayKeys.map(k => {
        const arr = dataObj[k] as unknown[];
        if (!arr || arr.length === 0) return null;
        const itemKeys = Object.keys(arr[0] || {}).filter(ik => ik !== 'id' && typeof arr[0][ik] !== 'object').slice(0, 4);
        return (
          <div key={k}>
            <p className="text-xs font-medium text-muted-foreground mb-1">{formatLabel(k)} ({arr.length})</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  {itemKeys.map(ik => (
                    <th key={ik} className="text-left py-1 px-2 font-medium text-muted-foreground">{formatLabel(ik)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arr.slice(0, 3).map((item: unknown, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    {itemKeys.map(ik => (
                      <td key={ik} className="py-1 px-2 truncate max-w-[180px]">{formatValue(item[ik])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Id', 'ID');
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (typeof val === 'number') {
    if (val > 1000) return val.toLocaleString('pt-BR');
    return String(val);
  }
  if (Array.isArray(val)) return val.join(', ');
  const s = String(val);
  if (s.match(/^\d{4}-\d{2}-\d{2}T/)) {
    try {
      return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return s; }
  }
  return s.length > 60 ? s.substring(0, 60) + '...' : s;
}

export default function AIAgentPlayground() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: agent } = useQuery({
    queryKey: ['ai-agent', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: toolsCount } = useQuery({
    queryKey: ['ai-agent-tools-count', id],
    queryFn: async () => {
      const { count } = await supabase
        .from('ai_agent_tools')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', id!)
        .eq('is_enabled', true);
      return count || 0;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !id) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-agent-execute', {
        body: {
          agent_id: id,
          message: userMessage,
          conversation_id: conversationId,
          context: {},
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na execução');
      }

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content || '',
        tool_calls: data.tool_calls,
        run_id: data.run_id,
        tokens_used: data.tokens_used,
        duration_ms: data.duration_ms,
        pii_detected: data.pii_detected,
        requires_approval: data.requires_approval,
      }]);
    } catch (err: unknown) {
      console.error('AI execution error:', err);
      toast.error('Erro na execução: ' + (err.message || 'Erro desconhecido'));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Erro: ${err.message || 'Falha na comunicação com o agente'}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/ai/agents/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">Playground: {agent?.name || '...'}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {(agent?.model_config as unknown)?.model || 'gemini-3-flash-preview'}
                {toolsCount ? ` • ${toolsCount} ferramenta(s)` : ''}
                {conversationId && ' • Conversa ativa'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Comece uma conversa com <strong>{agent?.name}</strong></p>
                  <p className="text-sm mt-2">
                    {toolsCount
                      ? `Este agente tem ${toolsCount} ferramenta(s) que executam ações reais no CRM`
                      : 'Envie uma mensagem para iniciar'}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Buscar artigos sobre...', 'Criar um ticket para...', 'Métricas de vendas', 'Buscar contato...'].map(suggestion => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setInput(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Tool call results - rich display */}
                    {msg.tool_calls && msg.tool_calls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <Separator />
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          {msg.tool_calls.length} ferramenta(s) executada(s)
                        </p>
                        {msg.tool_calls.map((tc, j) => (
                          <ToolResultCard key={j} toolName={tc.tool_name} result={tc.result} />
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    {msg.role === 'assistant' && (msg.tokens_used || msg.duration_ms) && (
                      <div className="flex items-center flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                        {msg.tokens_used && <span>{msg.tokens_used.toLocaleString()} tokens</span>}
                        {msg.duration_ms && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />{msg.duration_ms}ms
                          </span>
                        )}
                        {msg.run_id && (
                          <span className="font-mono text-[10px] opacity-60">
                            {msg.run_id.substring(0, 8)}
                          </span>
                        )}
                        {msg.pii_detected && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            PII
                          </Badge>
                        )}
                        {msg.requires_approval && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
                            Aprovação
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Processando...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2 max-w-3xl mx-auto">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="resize-none"
                rows={2}
                disabled={loading}
              />
              <Button onClick={handleSend} disabled={loading || !input.trim()} className="self-end">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
