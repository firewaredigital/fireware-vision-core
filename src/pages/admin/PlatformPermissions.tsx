import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Shield, Users, Loader2 } from 'lucide-react';

const DEFAULT_CAPABILITIES = [
  // Sales
  'sales.leads.read', 'sales.leads.write', 'sales.leads.delete',
  'sales.opportunities.read', 'sales.opportunities.write', 'sales.opportunities.delete',
  'sales.quotes.read', 'sales.quotes.write', 'sales.quotes.approve',
  'sales.discount.approve', 'sales.discount.approve_high',
  // Service
  'service.tickets.read', 'service.tickets.write', 'service.tickets.delete',
  'service.tickets.assign', 'service.tickets.escalate',
  'service.knowledge.read', 'service.knowledge.write',
  // Marketing
  'marketing.campaigns.read', 'marketing.campaigns.write', 'marketing.campaigns.send',
  'marketing.segments.read', 'marketing.segments.write',
  // AI
  'ai.agents.view', 'ai.agents.create', 'ai.agents.deploy', 'ai.agents.admin',
  // Governance
  'governance.lgpd.view', 'governance.lgpd.process',
  'governance.audit.view', 'governance.audit.export',
  // Admin
  'admin.modules.manage', 'admin.permissions.manage', 'admin.users.manage',
];

interface PermissionSet {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

export default function PlatformPermissions() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<PermissionSet | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });

  const { data: permissionSets, isLoading } = useQuery({
    queryKey: ['permission-sets', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_sets')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_system', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as PermissionSet[];
    },
    enabled: !!organizationId,
  });

  const { data: assignments } = useQuery({
    queryKey: ['permission-assignments', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permission_set_assignments')
        .select('permission_set_id, user_id')
        .eq('organization_id', organizationId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: string[] }) => {
      if (editingSet) {
        const { error } = await supabase
          .from('permission_sets')
          .update({
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            updated_at: new Date().toISOString(),
            updated_by: profile?.id,
          })
          .eq('id', editingSet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('permission_sets')
          .insert({
            organization_id: organizationId,
            name: data.name,
            description: data.description,
            permissions: data.permissions,
            created_by: profile?.id,
            updated_by: profile?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-sets'] });
      toast.success(editingSet ? 'Conjunto atualizado' : 'Conjunto criado');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving permission set:', error);
      toast.error('Erro ao salvar conjunto de permissões');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('permission_sets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-sets'] });
      toast.success('Conjunto excluído');
    },
    onError: (error) => {
      console.error('Error deleting permission set:', error);
      toast.error('Erro ao excluir conjunto');
    },
  });

  const handleOpenDialog = (set?: PermissionSet) => {
    if (set) {
      setEditingSet(set);
      setFormData({
        name: set.name,
        description: set.description || '',
        permissions: set.permissions || [],
      });
    } else {
      setEditingSet(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSet(null);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const getAssignmentCount = (setId: string) => {
    return assignments?.filter(a => a.permission_set_id === setId).length || 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Conjuntos de Permissões</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie permissões granulares para usuários da organização
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Conjunto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSet ? 'Editar Conjunto' : 'Novo Conjunto de Permissões'}
                </DialogTitle>
                <DialogDescription>
                  Configure as permissões que serão concedidas aos usuários deste conjunto
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Gerente de Vendas"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do conjunto de permissões"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Permissões ({formData.permissions.length} selecionadas)</Label>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_CAPABILITIES.map(cap => (
                        <Badge
                          key={cap}
                          variant={formData.permissions.includes(cap) ? 'default' : 'outline'}
                          className="cursor-pointer hover:bg-primary/80"
                          onClick={() => togglePermission(cap)}
                        >
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={!formData.name || saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingSet ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Conjuntos Configurados
            </CardTitle>
            <CardDescription>
              {permissionSets?.length || 0} conjuntos de permissões definidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionSets?.map(set => (
                  <TableRow key={set.id}>
                    <TableCell className="font-medium">{set.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {set.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {set.permissions?.length || 0} permissões
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {getAssignmentCount(set.id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {set.is_system ? (
                        <Badge variant="outline">Sistema</Badge>
                      ) : (
                        <Badge variant="secondary">Personalizado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(set)}
                          disabled={set.is_system}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(set.id)}
                          disabled={set.is_system || deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!permissionSets || permissionSets.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum conjunto de permissões configurado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
