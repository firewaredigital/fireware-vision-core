import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ArrowLeft, Bot, Brain, Save, Play, Settings, Wrench,
  Shield, Activity, Clock, Loader2, CheckCircle, XCircle,
  AlertTriangle, PauseCircle, RotateCcw
} from 'lucide-react';

export default function AIAgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;

  const { data: agent, isLoading } = useQuery({
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

  const { data: tools } = useQuery({
    queryKey: ['ai-agent-tools', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_tools')
        .select('*, ai_tools(*)')
        .eq('agent_id', id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: policies } = useQuery({
    queryKey: ['ai-agent-policies', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_policies')
        .select('*, ai_policies(*)')
        .eq('agent_id', id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: runs } = useQuery({
    queryKey: ['ai-agent-runs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_runs')
        .select('*, profiles!ai_runs_triggered_by_fkey(email, first_name, last_name)')
        .eq('agent_id', id!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['ai-agent-versions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_versions')
        .select('*')
        .eq('agent_id', id!)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('ai_agents')
        .update({ status: newStatus as any, updated_by: profile?.id })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent', id] });
      toast.success('Status atualizado');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500', running: 'bg-blue-500', completed: 'bg-green-500',
      failed: 'bg-red-500', waiting_approval: 'bg-orange-500', cancelled: 'bg-gray-500',
    };
    return map[s] || 'bg-gray-400';
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!agent) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">Agente não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/ai/agents')}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  const modelConfig = agent.model_config as any;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ai/agents')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status}
                </Badge>
                {agent.is_native && <Badge variant="outline">Nativo</Badge>}
              </div>
              <p className="text-muted-foreground mt-1">{agent.description || 'Sem descrição'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/ai/agents/${id}/test`)}>
              <Play className="h-4 w-4 mr-2" />
              Playground
            </Button>
            {agent.status === 'draft' && (
              <Button onClick={() => updateStatus.mutate('active')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Ativar
              </Button>
            )}
            {agent.status === 'active' && (
              <Button variant="secondary" onClick={() => updateStatus.mutate('paused')}>
                <PauseCircle className="h-4 w-4 mr-2" />
                Pausar
              </Button>
            )}
            {agent.status === 'paused' && (
              <Button onClick={() => updateStatus.mutate('active')}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reativar
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config"><Settings className="h-4 w-4 mr-2" />Config</TabsTrigger>
            <TabsTrigger value="tools"><Wrench className="h-4 w-4 mr-2" />Tools ({tools?.length || 0})</TabsTrigger>
            <TabsTrigger value="policies"><Shield className="h-4 w-4 mr-2" />Políticas ({policies?.length || 0})</TabsTrigger>
            <TabsTrigger value="runs"><Activity className="h-4 w-4 mr-2" />Execuções ({runs?.length || 0})</TabsTrigger>
            <TabsTrigger value="versions"><Clock className="h-4 w-4 mr-2" />Versões</TabsTrigger>
          </TabsList>

          {/* Config Tab */}
          <TabsContent value="config">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-xs text-muted-foreground">Tipo</Label><p className="font-medium">{agent.agent_type}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Versão</Label><p className="font-medium">v{agent.version}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Escopo</Label><p className="font-medium">{agent.scope || 'Todos os módulos'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Max Turnos</Label><p className="font-medium">{agent.max_turns}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Timeout</Label><p className="font-medium">{agent.timeout_seconds}s</p></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Modelo</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-xs text-muted-foreground">Modelo</Label><p className="font-medium">{modelConfig?.model || 'N/A'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Temperatura</Label><p className="font-medium">{modelConfig?.temperature ?? 0.7}</p></div>
                  <div><Label className="text-xs text-muted-foreground">Max Tokens</Label><p className="font-medium">{modelConfig?.max_tokens ?? 4096}</p></div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-4">
              <CardHeader><CardTitle>System Prompt</CardTitle></CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-[300px] overflow-y-auto">
                  {agent.system_prompt || 'Nenhum system prompt configurado'}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas Vinculadas</CardTitle>
                <CardDescription>Ferramentas disponíveis para este agente</CardDescription>
              </CardHeader>
              <CardContent>
                {!tools || tools.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma ferramenta vinculada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Risco</TableHead>
                        <TableHead>Aprovação</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tools.map((at: any) => (
                        <TableRow key={at.id}>
                          <TableCell className="font-medium">{(at.ai_tools as any)?.name || 'N/A'}</TableCell>
                          <TableCell><Badge variant="outline">{(at.ai_tools as any)?.tool_type}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={(at.ai_tools as any)?.risk_level === 'critical' ? 'destructive' : 'secondary'}>
                              {(at.ai_tools as any)?.risk_level}
                            </Badge>
                          </TableCell>
                          <TableCell>{(at.ai_tools as any)?.requires_approval ? 'Sim' : 'Não'}</TableCell>
                          <TableCell>{at.is_enabled ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle>Políticas de Governança</CardTitle>
                <CardDescription>Regras e guardrails aplicados a este agente</CardDescription>
              </CardHeader>
              <CardContent>
                {!policies || policies.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma política vinculada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ação na Violação</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Ativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.map((ap: any) => (
                        <TableRow key={ap.id}>
                          <TableCell className="font-medium">{(ap.ai_policies as any)?.name || 'N/A'}</TableCell>
                          <TableCell><Badge variant="outline">{(ap.ai_policies as any)?.policy_type}</Badge></TableCell>
                          <TableCell>{(ap.ai_policies as any)?.actions_on_violation}</TableCell>
                          <TableCell>{(ap.ai_policies as any)?.priority}</TableCell>
                          <TableCell>{ap.is_active ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Runs Tab */}
          <TabsContent value="runs">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execuções</CardTitle>
                <CardDescription>Últimas 20 execuções deste agente</CardDescription>
              </CardHeader>
              <CardContent>
                {!runs || runs.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma execução registrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Steps</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((run: any) => {
                        const duration = run.started_at && run.completed_at
                          ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                          : null;
                        return (
                          <TableRow key={run.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${statusColor(run.status)}`} />
                                <span className="text-sm">{run.status}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{run.trigger_type}</TableCell>
                            <TableCell className="text-sm">{run.total_tokens_used?.toLocaleString() || 0}</TableCell>
                            <TableCell className="text-sm">{run.total_steps || 0}</TableCell>
                            <TableCell className="text-sm">{duration !== null ? `${duration}s` : '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{format(new Date(run.created_at), 'dd/MM HH:mm')}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Versões</CardTitle>
              </CardHeader>
              <CardContent>
                {!versions || versions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma versão publicada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Versão</TableHead>
                        <TableHead>Changelog</TableHead>
                        <TableHead>Publicado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">v{v.version_number}</TableCell>
                          <TableCell className="text-sm">{v.changelog || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {v.published_at ? format(new Date(v.published_at), 'dd/MM/yyyy HH:mm') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
