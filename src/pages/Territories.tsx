import { useEffect, useState } from 'react';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';
import { useNavigate } from 'react-router-dom';
import { Map, Plus, Search, ChevronRight, ChevronDown, Edit, Trash2, Users, Building2, UserCircle } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Territory {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  criteria: any;
  parent_territory_id: string | null;
  owner_id: string | null;
  organization_id: string;
  created_at: string;
  owner?: { first_name: string | null; last_name: string | null; email: string } | null;
  children?: Territory[];
  account_count?: number;
  lead_count?: number;
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

export default function Territories() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    region: '',
    parent_territory_id: '',
    owner_id: ''
  });

  // Fetch territories
  const { data: territories = [], isLoading: territoriesLoading } = useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('territories')
        .select(`
          *,
          owner:profiles!territories_owner_id_fkey(first_name, last_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('name');
      
      if (error) throw error;
      return data as Territory[];
    },
    enabled: !!user
  });

  // Fetch team members for owner selection
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!user
  });

  // Fetch counts for territories
  const { data: territoryCounts = {} } = useQuery({
    queryKey: ['territory-counts'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) return {};

      const [accountsRes, leadsRes] = await Promise.all([
        supabase
          .from('accounts')
          .select('territory_id')
          .eq('organization_id', profile.organization_id)
          .not('territory_id', 'is', null),
        supabase
          .from('leads')
          .select('territory_id')
          .eq('organization_id', profile.organization_id)
          .not('territory_id', 'is', null)
      ]);

      const counts: Record<string, { accounts: number; leads: number }> = {};
      
      accountsRes.data?.forEach(a => {
        if (a.territory_id) {
          if (!counts[a.territory_id]) counts[a.territory_id] = { accounts: 0, leads: 0 };
          counts[a.territory_id].accounts++;
        }
      });
      
      leadsRes.data?.forEach(l => {
        if (l.territory_id) {
          if (!counts[l.territory_id]) counts[l.territory_id] = { accounts: 0, leads: 0 };
          counts[l.territory_id].leads++;
        }
      });

      return counts;
    },
    enabled: !!user
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (!profile?.organization_id) throw new Error('No organization');

      const payload = {
        name: data.name,
        description: data.description || null,
        region: data.region || null,
        parent_territory_id: data.parent_territory_id || null,
        owner_id: data.owner_id || null,
        organization_id: profile.organization_id
      };

      if (data.id) {
        const { error } = await supabase
          .from('territories')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('territories')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      setIsFormOpen(false);
      setEditingTerritory(null);
      resetForm();
      toast({
        title: editingTerritory ? 'Território atualizado' : 'Território criado',
        description: 'Alterações salvas com sucesso.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('territories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territories'] });
      toast({
        title: 'Território excluído',
        description: 'Território foi removido.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      region: '',
      parent_territory_id: '',
      owner_id: ''
    });
  };

  const openEditForm = (territory: Territory) => {
    setEditingTerritory(territory);
    setFormData({
      name: territory.name,
      description: territory.description || '',
      region: territory.region || '',
      parent_territory_id: territory.parent_territory_id || '',
      owner_id: territory.owner_id || ''
    });
    setIsFormOpen(true);
  };

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(eid => eid !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  // Build territory tree
  const buildTree = (territories: Territory[]): Territory[] => {
    const nodeMap: Record<string, Territory> = {};
    const roots: Territory[] = [];

    territories.forEach(t => {
      nodeMap[t.id] = { ...t, children: [] };
    });

    territories.forEach(t => {
      const node = nodeMap[t.id];
      if (t.parent_territory_id && nodeMap[t.parent_territory_id]) {
        nodeMap[t.parent_territory_id].children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const filteredTerritories = territories.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const territoryTree = buildTree(filteredTerritories);

  const renderTerritoryNode = (territory: Territory, level: number = 0) => {
    const hasChildren = territory.children && territory.children.length > 0;
    const isExpanded = expandedIds.includes(territory.id);
    const counts = territoryCounts[territory.id] || { accounts: 0, leads: 0 };

    return (
      <div key={territory.id}>
        <div 
          className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpand(territory.id)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="w-6" />
          )}
          
          <Map className="h-5 w-5 text-muted-foreground" />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{territory.name}</span>
              {territory.region && (
                <Badge variant="outline" className="text-xs">{territory.region}</Badge>
              )}
            </div>
            {territory.description && (
              <p className="text-sm text-muted-foreground truncate">{territory.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1" title="Accounts">
              <Building2 className="h-4 w-4" />
              <span>{counts.accounts}</span>
            </div>
            <div className="flex items-center gap-1" title="Leads">
              <Users className="h-4 w-4" />
              <span>{counts.leads}</span>
            </div>
            {territory.owner && (
              <div className="flex items-center gap-1" title="Owner">
                <UserCircle className="h-4 w-4" />
                <span className="max-w-[100px] truncate">
                  {territory.owner.first_name || territory.owner.email}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openEditForm(territory)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => deleteMutation.mutate(territory.id)}
              disabled={hasChildren}
              title={hasChildren ? 'Delete child territories first' : 'Delete territory'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {territory.children!.map(child => renderTerritoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="sales"
          title="Territórios"
          subtitle="Gerencie territórios de vendas e atribuições"
          compact
        />
        {/* Territory Form */}
        <div className="flex items-center justify-end">
          <div className="hidden" />
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) {
              setEditingTerritory(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Território
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingTerritory ? 'Editar Território' : 'Criar Território'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: América do Norte"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Região</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="ex: SUL, SUDESTE, NORDESTE"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalhes de cobertura do território..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent">Território Pai</Label>
                  <Select
                    value={formData.parent_territory_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_territory_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem pai</SelectItem>
                      {territories
                        .filter(t => t.id !== editingTerritory?.id)
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">Proprietário do Território</Label>
                  <Select
                    value={formData.owner_id}
                    onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Atribuir proprietário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não atribuído</SelectItem>
                      {teamMembers.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.first_name || m.email} {m.last_name || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate({ ...formData, id: editingTerritory?.id })}
                  disabled={!formData.name || saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Salvando...' : editingTerritory ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{territories.length}</div>
              <div className="text-sm text-muted-foreground">Total de Territórios</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {territories.filter(t => !t.parent_territory_id).length}
              </div>
              <div className="text-sm text-muted-foreground">Top-Level Regions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {territories.filter(t => t.owner_id).length}
              </div>
              <div className="text-sm text-muted-foreground">Assigned Territories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {Object.values(territoryCounts).reduce((sum, c) => sum + c.accounts, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Accounts Assigned</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search territories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Territory Tree */}
        <Card>
          <CardHeader>
            <CardTitle>Territory Hierarchy</CardTitle>
            <CardDescription>Click to expand/collapse nested territories</CardDescription>
          </CardHeader>
          <CardContent>
            {territoriesLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading territories...
              </div>
            ) : territoryTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Map className="h-8 w-8 mb-2" />
                <p>No territories defined yet</p>
                <p className="text-sm">Create your first territory to get started</p>
              </div>
            ) : (
              <div className="divide-y">
                {territoryTree.map(territory => renderTerritoryNode(territory))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
