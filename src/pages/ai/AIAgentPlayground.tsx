import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft, Bot, Send, Loader2, User, Wrench,
  AlertTriangle, CheckCircle, Clock, Trash2
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Array<{ tool_name: string; result: unknown }>;
  run_id?: string;
  tokens_used?: number;
  duration_ms?: number;
  pii_detected?: boolean;
  requires_approval?: boolean;
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
    } catch (err: any) {
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
    <AppLayout>
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
                {(agent?.model_config as any)?.model || 'gemini-3-flash-preview'}
                {conversationId && ` • Conversa ativa`}
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
                  <p className="text-sm mt-2">Envie uma mensagem para iniciar</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Tool calls */}
                    {msg.tool_calls && msg.tool_calls.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <Separator />
                        {msg.tool_calls.map((tc, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs py-1">
                            <Wrench className="h-3 w-3" />
                            <span className="font-mono">{tc.tool_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(tc.result as any)?.status || 'executed'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    {msg.role === 'assistant' && (msg.tokens_used || msg.duration_ms) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {msg.tokens_used && <span>{msg.tokens_used.toLocaleString()} tokens</span>}
                        {msg.duration_ms && <span><Clock className="h-3 w-3 inline mr-1" />{msg.duration_ms}ms</span>}
                        {msg.pii_detected && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            PII detectado
                          </Badge>
                        )}
                        {msg.requires_approval && (
                          <Badge variant="secondary" className="text-xs">
                            Aguardando aprovação
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
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
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
    </AppLayout>
  );
}
