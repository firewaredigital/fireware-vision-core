import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  Activity, Search, Loader2, Bot, Clock, CheckCircle, XCircle,
  AlertTriangle, PauseCircle, Eye, Shield
} from '@/components/icons';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pendente', icon: Clock, color: 'bg-yellow-500' },
  running: { label: 'Executando', icon: Activity, color: 'bg-blue-500' },
  waiting_approval: { label: 'Aguardando Aprovação', icon: PauseCircle, color: 'bg-orange-500' },
  completed: { label: 'Concluído', icon: CheckCircle, color: 'bg-green-500' },
  failed: { label: 'Falhou', icon: XCircle, color: 'bg-red-500' },
  cancelled: { label: 'Cancelado', icon: AlertTriangle, color: 'bg-gray-500' },
};

export default function AIRuns() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const { data: runs, isLoading } = useQuery({
    queryKey: ['ai-runs', orgId, statusFilter],
    queryFn: async () => {
      if (!orgId) return [];
      let query = supabase
        .from('ai_runs')
        .select('*, ai_agents(name, agent_type), profiles!ai_runs_triggered_by_fkey(email, first_name, last_name)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: runDetails } = useQuery({
    queryKey: ['ai-run-detail', selectedRun],
    queryFn: async () => {
      if (!selectedRun) return null;
      const [stepsRes, receiptsRes] = await Promise.all([
        supabase.from('ai_run_steps').select('*').eq('run_id', selectedRun).order('step_order'),
        supabase.from('ai_run_audit_receipts').select('*').eq('run_id', selectedRun).order('created_at'),
      ]);
      return { steps: stepsRes.data || [], receipts: receiptsRes.data || [] };
    },
    enabled: !!selectedRun,
  });

  const filtered = (runs || []).filter(r => {
    if (search) {
      const agentName = (r.ai_agents as any)?.name?.toLowerCase() || '';
      const userEmail = (r.profiles as any)?.email?.toLowerCase() || '';
      if (!agentName.includes(search.toLowerCase()) && !userEmail.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Execuções de IA</h1>
          <p className="text-muted-foreground mt-1">Histórico completo com auditoria e comprovantes</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por agente ou usuário..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Runs Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma execução encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Steps</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(run => {
                    const scfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending;
                    const StatusIcon = scfg.icon;
                    const duration = run.started_at && run.completed_at
                      ? Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                      : null;
                    const agentData = run.ai_agents as any;
                    const profileData = run.profiles as any;

                    return (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${scfg.color}`} />
                            <span className="text-sm">{scfg.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{agentData?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{run.trigger_type}</Badge></TableCell>
                        <TableCell className="text-sm">
                          {profileData?.first_name ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() : profileData?.email || '-'}
                        </TableCell>
                        <TableCell className="text-sm">{run.total_tokens_used?.toLocaleString() || 0}</TableCell>
                        <TableCell className="text-sm">{run.total_steps || 0}</TableCell>
                        <TableCell className="text-sm">{duration !== null ? `${duration}s` : '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(run.created_at), 'dd/MM HH:mm')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedRun(run.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Run Detail Dialog */}
        <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle>Detalhes da Execução</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              {runDetails && (
                <div className="space-y-6">
                  {/* Steps */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Steps ({runDetails.steps.length})
                    </h3>
                    <div className="space-y-2">
                      {runDetails.steps.map((step: any) => (
                        <Card key={step.id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">#{step.step_order}</Badge>
                                <span className="font-medium text-sm">{step.step_type}</span>
                                {step.tool_name && <Badge variant="secondary" className="text-xs">{step.tool_name}</Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {step.duration_ms && <span>{step.duration_ms}ms</span>}
                                {step.tokens_used > 0 && <span>{step.tokens_used} tokens</span>}
                                <Badge variant={step.status === 'completed' ? 'default' : 'destructive'} className="text-xs">{step.status}</Badge>
                              </div>
                            </div>
                            {step.error_message && (
                              <p className="text-xs text-destructive mt-2">{step.error_message}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Audit Receipts */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Comprovantes de Auditoria ({runDetails.receipts.length})
                    </h3>
                    <div className="space-y-2">
                      {runDetails.receipts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum comprovante gerado</p>
                      ) : (
                        runDetails.receipts.map((receipt: any) => (
                          <Card key={receipt.id}>
                            <CardContent className="py-3 px-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{receipt.action_type}</p>
                                  <p className="text-xs text-muted-foreground">{receipt.action_description}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={receipt.risk_level === 'critical' ? 'destructive' : 'outline'} className="text-xs">
                                    {receipt.risk_level}
                                  </Badge>
                                  {receipt.pii_detected && (
                                    <Badge variant="destructive" className="text-xs">PII</Badge>
                                  )}
                                  {receipt.requires_approval && (
                                    <Badge variant="secondary" className="text-xs">
                                      {receipt.approval_status || 'pending'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {receipt.tool_used && (
                                <p className="text-xs mt-1">Ferramenta: <code className="bg-muted px-1 rounded">{receipt.tool_used}</code></p>
                              )}
                              {receipt.affected_entity_type && (
                                <p className="text-xs mt-1">Entidade: {receipt.affected_entity_type} ({receipt.affected_entity_id})</p>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
