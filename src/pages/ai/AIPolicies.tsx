import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Plus, Search, Loader2, Lock, AlertTriangle, Filter, Gauge, CheckCircle } from 'lucide-react';

const POLICY_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  pii_protection: { label: 'Proteção PII', icon: Lock, description: 'Mascarar dados pessoais' },
  rate_limit: { label: 'Rate Limit', icon: Gauge, description: 'Limitar uso por período' },
  action_restriction: { label: 'Restrição de Ação', icon: AlertTriangle, description: 'Bloquear ações específicas' },
  content_filter: { label: 'Filtro de Conteúdo', icon: Filter, description: 'Filtrar conteúdo inapropriado' },
  approval_required: { label: 'Aprovação Obrigatória', icon: CheckCircle, description: 'Exigir aprovação humana' },
};

export default function AIPolicies() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', policy_type: 'pii_protection' as string,
    actions_on_violation: 'block', priority: 100, is_active: true,
    rules: '[]', scope: '',
  });

  const { data: policies, isLoading } = useQuery({
    queryKey: ['ai-policies', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('ai_policies')
        .select('*')
        .eq('organization_id', orgId)
        .order('priority', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createPolicy = useMutation({
    mutationFn: async () => {
      if (!orgId || !form.name.trim()) throw new Error('Nome obrigatório');
      let parsedRules;
      try { parsedRules = JSON.parse(form.rules); } catch { throw new Error('Regras JSON inválido'); }
      
      const { error } = await supabase.from('ai_policies').insert({
        organization_id: orgId, name: form.name, description: form.description || null,
        policy_type: form.policy_type as any, rules: parsedRules,
        actions_on_violation: form.actions_on_violation,
        priority: form.priority, is_active: form.is_active,
        scope: form.scope || null, created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-policies'] });
      toast.success('Política criada');
      setDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const togglePolicy = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('ai_policies').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-policies'] });
      toast.success('Política atualizada');
    },
  });

  const filtered = (policies || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Políticas de IA</h1>
            <p className="text-muted-foreground mt-1">Guardrails e regras de governança para agentes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Política</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Política</DialogTitle>
                <DialogDescription>Configure regras de governança para agentes de IA</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Proteção de PII" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.policy_type} onValueChange={(v) => setForm(p => ({ ...p, policy_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(POLICY_TYPE_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ação na Violação</Label>
                    <Select value={form.actions_on_violation} onValueChange={(v) => setForm(p => ({ ...p, actions_on_violation: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Bloquear</SelectItem>
                        <SelectItem value="warn">Avisar</SelectItem>
                        <SelectItem value="require_approval">Exigir Aprovação</SelectItem>
                        <SelectItem value="log">Apenas Logar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Input type="number" value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 100 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Escopo</Label>
                    <Input value={form.scope} onChange={(e) => setForm(p => ({ ...p, scope: e.target.value }))} placeholder="sales,service" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
                  <Label>Ativa</Label>
                </div>
                <div className="space-y-2">
                  <Label>Regras (JSON)</Label>
                  <Textarea value={form.rules} onChange={(e) => setForm(p => ({ ...p, rules: e.target.value }))} rows={5} className="font-mono text-sm" placeholder='[{"pattern": "...", "action": "block"}]' />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => createPolicy.mutate()} disabled={createPolicy.isPending}>
                  {createPolicy.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Política
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar políticas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma política encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Ativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(policy => {
                    const cfg = POLICY_TYPE_CONFIG[policy.policy_type] || { label: policy.policy_type, icon: Shield };
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={policy.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{policy.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{policy.description || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{cfg.label}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{policy.actions_on_violation}</Badge></TableCell>
                        <TableCell className="text-sm">{policy.priority}</TableCell>
                        <TableCell className="text-sm">{policy.scope || 'Global'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={policy.is_active}
                            onCheckedChange={(v) => togglePolicy.mutate({ id: policy.id, is_active: v })}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
