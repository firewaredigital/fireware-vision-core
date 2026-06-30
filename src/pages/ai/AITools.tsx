import { useState } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
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
import {
  Wrench, Plus, Search, Shield, AlertTriangle, Loader2,
  Code, Globe, Database, Zap, Workflow
} from '@/components/icons';

const TOOL_TYPE_ICONS: Record<string, React.ElementType> = {
  http_request: Globe,
  database_query: Database,
  rpc_call: Code,
  connector_action: Zap,
  workflow_trigger: Workflow,
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-500/10 text-green-700',
  medium: 'bg-yellow-500/10 text-yellow-700',
  high: 'bg-orange-500/10 text-orange-700',
  critical: 'bg-red-500/10 text-red-700',
};

export default function AITools() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = profile?.organization_id;
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', tool_type: 'rpc_call' as string,
    risk_level: 'low' as string, requires_approval: false,
    parameters_schema: '{\n  "type": "object",\n  "properties": {}\n}',
    action_config: '{}', category: '',
  });

  const { data: tools, isLoading } = useQuery({
    queryKey: ['ai-tools', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const createTool = useMutation({
    mutationFn: async () => {
      if (!orgId || !form.name.trim()) throw new Error('Nome obrigatório');
      let parsedParams, parsedConfig;
      try { parsedParams = JSON.parse(form.parameters_schema); } catch { throw new Error('Parameters schema inválido'); }
      try { parsedConfig = JSON.parse(form.action_config); } catch { throw new Error('Action config inválido'); }
      
      const { error } = await supabase.from('ai_tools').insert({
        organization_id: orgId,
        name: form.name, description: form.description || null,
        tool_type: form.tool_type as unknown, risk_level: form.risk_level as unknown,
        requires_approval: form.requires_approval,
        parameters_schema: parsedParams, action_config: parsedConfig,
        category: form.category || null, created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tools'] });
      toast.success('Ferramenta criada');
      setDialogOpen(false);
      setForm({ name: '', description: '', tool_type: 'rpc_call', risk_level: 'low', requires_approval: false, parameters_schema: '{\n  "type": "object",\n  "properties": {}\n}', action_config: '{}', category: '' });
    },
    onError: (err: unknown) => toast.error(err.message),
  });

  const filtered = (tools || []).filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="ai"
          title="Ferramentas de IA"
          subtitle="Catálogo de ferramentas disponíveis para agentes"
          compact
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />Nova Ferramenta
            </Button>
          }
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Ferramenta</DialogTitle>
                <DialogDescription>Configure uma ferramenta para uso pelos agentes de IA</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="search_knowledge_base" />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Ex: vendas, atendimento" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="O que esta ferramenta faz?" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={form.tool_type} onValueChange={(v) => setForm(p => ({ ...p, tool_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rpc_call">RPC Call</SelectItem>
                        <SelectItem value="http_request">HTTP Request</SelectItem>
                        <SelectItem value="database_query">Database Query</SelectItem>
                        <SelectItem value="connector_action">Connector Action</SelectItem>
                        <SelectItem value="workflow_trigger">Workflow Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Risco</Label>
                    <Select value={form.risk_level} onValueChange={(v) => setForm(p => ({ ...p, risk_level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="critical">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.requires_approval} onCheckedChange={(v) => setForm(p => ({ ...p, requires_approval: v }))} />
                  <Label>Requer aprovação humana (human-in-the-loop)</Label>
                </div>
                <div className="space-y-2">
                  <Label>Parameters Schema (JSON Schema)</Label>
                  <Textarea value={form.parameters_schema} onChange={(e) => setForm(p => ({ ...p, parameters_schema: e.target.value }))} rows={5} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Action Config (JSON)</Label>
                  <Textarea value={form.action_config} onChange={(e) => setForm(p => ({ ...p, action_config: e.target.value }))} rows={3} className="font-mono text-sm" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => createTool.mutate()} disabled={createTool.isPending}>
                  {createTool.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar Ferramenta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar ferramentas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhuma ferramenta encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Risco</TableHead>
                    <TableHead>Aprovação</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Sistema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(tool => {
                    const TypeIcon = TOOL_TYPE_ICONS[tool.tool_type] || Wrench;
                    return (
                      <TableRow key={tool.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{tool.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{tool.description || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{tool.tool_type}</Badge></TableCell>
                        <TableCell>
                          <Badge className={RISK_COLORS[tool.risk_level] || ''}>{tool.risk_level}</Badge>
                        </TableCell>
                        <TableCell>
                          {tool.requires_approval ? (
                            <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Sim</Badge>
                          ) : 'Não'}
                        </TableCell>
                        <TableCell className="text-sm">{tool.category || '-'}</TableCell>
                        <TableCell>{tool.is_system ? <Badge variant="outline">Sistema</Badge> : '-'}</TableCell>
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
