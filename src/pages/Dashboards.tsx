import { useState, useEffect , useCallback } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, LayoutDashboard, Star, StarOff, Eye, Copy, Trash2,
  MoreHorizontal, RefreshCw, Users, Lock, Globe, BarChart3,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  module: string;
  visibility: string;
  is_default: boolean;
  is_system: boolean;
  is_favorite: boolean;
  view_count: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const moduleLabels: Record<string, string> = {
  general: 'Geral', sales: 'Vendas', service: 'Atendimento',
  marketing: 'Marketing', commerce: 'Commerce', itsm: 'TI / ITSM',
  ai_agents: 'IA', data_hub: 'Data Hub', integrations: 'Integrações',
};

const visibilityIcons: Record<string, React.ReactNode> = {
  private: <Lock className="h-3 w-3" />, team: <Users className="h-3 w-3" />,
  organization: <Globe className="h-3 w-3" />,
};

export default function Dashboards() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) fetchDashboards();
  }, [profile?.organization_id, fetchDashboards]);

  const fetchDashboards = useCallback( async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('dashboards')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false });
    if (data) setDashboards(data as Dashboard[]);
    setLoading(false);
  }, [profile?.organization_id, profile?.id]);

  const toggleFavorite = async (dashboardId: string, current: boolean) => {
    await supabase.from('dashboards').update({ is_favorite: !current }).eq('id', dashboardId);
    setDashboards(prev => prev.map(d => d.id === dashboardId ? { ...d, is_favorite: !current } : d));
  };

  const cloneDashboard = async (dashboardId: string) => {
    const { data, error } = await supabase.rpc('clone_dashboard', {
      p_dashboard_id: dashboardId,
      p_new_name: `${dashboards.find(d => d.id === dashboardId)?.name} (Cópia)`,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao clonar dashboard' });
    } else {
      toast({ title: 'Dashboard clonado' });
      fetchDashboards();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('dashboards').delete().eq('id', deleteId);
    if (!error) {
      toast({ title: 'Dashboard excluído' });
      fetchDashboards();
    }
    setDeleteId(null);
  };

  const filtered = dashboards.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'all' || d.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        module="admin"
        title="Dashboards"
        subtitle="Crie e gerencie dashboards personalizados"
        compact
        actions={
          <Button onClick={() => navigate('/dashboards/new')} className="gap-2 bg-white text-foreground hover:bg-white/90">
            <Plus className="h-4 w-4" /> Novo Dashboard
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dashboards.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Favoritos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-500">{dashboards.filter(d => d.is_favorite).length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Compartilhados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dashboards.filter(d => d.visibility !== 'private').length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Visualizações</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{dashboards.reduce((s, d) => s + d.view_count, 0).toLocaleString()}</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar dashboards..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Módulos</SelectItem>
            {Object.entries(moduleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum dashboard encontrado</p>
            <Button onClick={() => navigate('/dashboards/new')}><Plus className="mr-2 h-4 w-4" />Criar Dashboard</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(dashboard => (
            <Card key={dashboard.id} className="cursor-pointer hover:shadow-md transition-shadow group" onClick={() => navigate(`/dashboards/${dashboard.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{dashboard.name}</CardTitle>
                    {dashboard.description && <CardDescription className="mt-1 line-clamp-2 text-xs">{dashboard.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); toggleFavorite(dashboard.id, dashboard.is_favorite); }}>
                      {dashboard.is_favorite ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/dashboards/${dashboard.id}`); }}><Eye className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); cloneDashboard(dashboard.id); }}><Copy className="mr-2 h-4 w-4" />Clonar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!dashboard.is_system && <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(dashboard.id); }}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{moduleLabels[dashboard.module] || dashboard.module}</Badge>
                  <Badge variant="outline" className="gap-1 text-xs">{visibilityIcons[dashboard.visibility]}{dashboard.visibility === 'private' ? 'Privado' : dashboard.visibility === 'team' ? 'Equipe' : 'Org'}</Badge>
                  {dashboard.is_system && <Badge variant="default" className="text-xs">Sistema</Badge>}
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>{dashboard.view_count} visualizações</span>
                  <span>{format(new Date(dashboard.updated_at), 'dd/MM/yy', { locale: ptBR })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Tem certeza que deseja excluir este dashboard? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
