import { useState } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ClipboardList, Plus, Search, Loader2, Play, CheckCircle, XCircle, Bot } from 'lucide-react';

export default function AIEvals() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', agent_id: '',
    test_cases: '[\n  {\n    "input": "Olá, como posso ajudar?",\n    "expected_contains": ["ajudar", "assistente"]\n  }\n]',
  });

  const { data: evals, isLoading } = useQuery({
    queryKey: ['ai-evals', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('ai_evals')
        .select('*, ai_agents(name, agent_type)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: agents } = useQuery({
    queryKey: ['ai-agents-list', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('ai_agents')
        .select('id, name')
        .eq('organization_id', orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createEval = useMutation({
    mutationFn: async () => {
      if (!orgId || !form.name.trim() || !form.agent_id) throw new Error('Nome e agente são obrigatórios');
      let parsedCases;
      try { parsedCases = JSON.parse(form.test_cases); } catch { throw new Error('Test cases JSON inválido'); }

      const { error } = await supabase.from('ai_evals').insert({
        organization_id: orgId, name: form.name, description: form.description || null,
        agent_id: form.agent_id, test_cases: parsedCases, created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-evals'] });
      toast.success('Suite de avaliação criada');
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = (evals || []).filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Avaliações de IA</h1>
            <p className="text-muted-foreground mt-1">Suites de teste para validar comportamento dos agentes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Avaliação</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Suite de Avaliação</DialogTitle>
                <DialogDescription>Configure casos de teste para um agente</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Teste de Triagem" />
                  </div>
                  <div className="space-y-2">
                    <Label>Agente *</Label>
                    <Select value={form.agent_id} onValueChange={(v) => setForm(p => ({ ...p, agent_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {(agents || []).map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Casos de Teste (JSON)</Label>
                  <Textarea value={form.test_cases} onChange={(e) => setForm(p => ({ ...p, test_cases: e.target.value }))} rows={10} className="font-mono text-sm" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => createEval.mutate()} disabled={createEval.isPending}>
                  {createEval.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Avaliação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar avaliações..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma avaliação encontrada</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(ev => {
              const testCases = Array.isArray(ev.test_cases) ? ev.test_cases : [];
              return (
                <Card key={ev.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{ev.name}</CardTitle>
                      {ev.pass_rate !== null && (
                        <Badge variant={Number(ev.pass_rate) >= 80 ? 'default' : 'destructive'}>
                          {ev.pass_rate}%
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {(ev.ai_agents as any)?.name || 'N/A'}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{ev.description || 'Sem descrição'}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{testCases.length} caso(s) de teste</span>
                      <span>Runs: {ev.total_runs}</span>
                    </div>
                    {ev.pass_rate !== null && <Progress value={Number(ev.pass_rate)} className="h-2" />}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {ev.last_run_at ? (
                        <span>Último: {format(new Date(ev.last_run_at), 'dd/MM HH:mm')}</span>
                      ) : (
                        <span>Nunca executado</span>
                      )}
                      <Button variant="outline" size="sm" disabled>
                        <Play className="h-3 w-3 mr-1" />
                        Executar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
