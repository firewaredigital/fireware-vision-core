import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot, Plus, Search, TrendingUp, Headphones, Megaphone, ShoppingCart,
  Server, Database, Shield, Wrench, Play, Settings, Activity, Loader2,
  Brain, Zap, CheckCircle, PauseCircle, AlertTriangle, Archive
} from '@/components/icons';

const AGENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sales: { label: 'Vendas', icon: TrendingUp, color: 'text-emerald-500' },
  service: { label: 'Atendimento', icon: Headphones, color: 'text-blue-500' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'text-purple-500' },
  commerce: { label: 'Commerce', icon: ShoppingCart, color: 'text-orange-500' },
  itsm: { label: 'ITSM', icon: Server, color: 'text-slate-500' },
  data_steward: { label: 'Data Steward', icon: Database, color: 'text-cyan-500' },
  compliance: { label: 'Compliance', icon: Shield, color: 'text-red-500' },
  custom: { label: 'Customizado', icon: Wrench, color: 'text-amber-500' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', icon: Archive, variant: 'outline' },
  testing: { label: 'Testando', icon: Zap, variant: 'secondary' },
  active: { label: 'Ativo', icon: CheckCircle, variant: 'default' },
  paused: { label: 'Pausado', icon: PauseCircle, variant: 'secondary' },
  deprecated: { label: 'Descontinuado', icon: AlertTriangle, variant: 'destructive' },
};

export default function AIAgents() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: agents, isLoading } = useQuery({
    queryKey: ['ai-agents', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const { data: metrics } = useQuery({
    queryKey: ['ai-metrics', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase.rpc('get_ai_usage_metrics', { _org_id: orgId });
      if (error) throw error;
      return data as Record<string, number>;
    },
    enabled: !!orgId,
  });

  const filtered = (agents || []).filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && a.agent_type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agent Studio</h1>
            <p className="text-muted-foreground mt-1">Gerencie agentes de IA com governança enterprise</p>
          </div>
          <Button onClick={() => navigate('/ai/agents/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Bot className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.active_agents ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Agentes Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.total_runs_today ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Execuções Hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{(metrics.total_tokens_today ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Tokens Hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{metrics.success_rate ?? 0}%</p>
                    <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(AGENT_TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
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

        {/* Agent Cards */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum agente encontrado</h3>
              <p className="text-muted-foreground mt-1">Crie seu primeiro agente de IA para começar.</p>
              <Button className="mt-4" onClick={() => navigate('/ai/agents/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Agente
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agent) => {
              const typeCfg = AGENT_TYPE_CONFIG[agent.agent_type] || AGENT_TYPE_CONFIG.custom;
              const statusCfg = STATUS_CONFIG[agent.status] || STATUS_CONFIG.draft;
              const TypeIcon = typeCfg.icon;
              const StatusIcon = statusCfg.icon;

              return (
                <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/ai/agents/${agent.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-primary/10 ${typeCfg.color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{typeCfg.label}</Badge>
                            {agent.is_native && <Badge variant="secondary" className="text-xs">Nativo</Badge>}
                          </div>
                        </div>
                      </div>
                      <Badge variant={statusCfg.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                      {agent.description || 'Sem descrição'}
                    </CardDescription>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        v{agent.version} • {(agent.model_config as any)?.model?.split('/').pop() || 'gemini'}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/ai/agents/${agent.id}/test`); }}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/ai/agents/${agent.id}`); }}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
