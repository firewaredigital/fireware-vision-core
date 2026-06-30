import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Loader2 } from '@/components/icons';
import { toast } from 'sonner';

export default function ITIncidentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    impact: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    status: 'new' as string,
    affected_service: '',
    workaround: '',
    workaround_available: false,
    customer_visible: false,
    customer_communication: '',
    source: 'manual'
  });

  // Fetch existing incident for edit mode
  const { isLoading: isLoadingIncident } = useQuery({
    queryKey: ['it-incident', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('it_incidents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          impact: data.impact || 'medium',
          urgency: data.urgency || 'medium',
          status: data.status || 'new',
          affected_service: data.affected_service || '',
          workaround: data.workaround || '',
          workaround_available: data.workaround_available || false,
          customer_visible: data.customer_visible || false,
          customer_communication: data.customer_communication || '',
          source: data.source || 'manual'
        });
      }
      
      return data;
    },
    enabled: isEdit
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch teams
  const { data: teams } = useQuery({
    queryKey: ['teams-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const [assignedTo, setAssignedTo] = useState<string>('');
  const [assignmentGroupId, setAssignmentGroupId] = useState<string>('');

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) {
        throw new Error('Organização não encontrada');
      }

      const incidentData: unknown = {
        ...formData,
        organization_id: profile.organization_id,
        assigned_to: assignedTo || null,
        assignment_group_id: assignmentGroupId || null
      };

      if (isEdit && id) {
        const { error } = await supabase
          .from('it_incidents')
          .update(incidentData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Generate incident number
        const { data: numberData, error: numberError } = await supabase
          .rpc('generate_incident_number', { org_id: profile.organization_id });
        
        if (numberError) throw numberError;

        incidentData.incident_number = numberData;
        incidentData.reported_by = profile.id;

        const { error } = await supabase
          .from('it_incidents')
          .insert(incidentData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Incidente atualizado!' : 'Incidente criado!');
      queryClient.invalidateQueries({ queryKey: ['it-incidents'] });
      navigate('/it/incidents');
    },
    onError: (error) => {
      console.error('Error saving incident:', error);
      toast.error('Erro ao salvar incidente');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }
    saveMutation.mutate();
  };

  const categories = [
    'Hardware',
    'Software',
    'Rede',
    'Segurança',
    'Email',
    'Acesso',
    'Impressora',
    'Telefonia',
    'Backup',
    'Banco de Dados',
    'Servidor',
    'Outro'
  ];

  const sources = [
    { value: 'manual', label: 'Manual' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'chat', label: 'Chat' },
    { value: 'monitoring', label: 'Monitoramento' },
    { value: 'portal', label: 'Portal Self-Service' },
    { value: 'api', label: 'API/Integração' }
  ];

  if (isEdit && isLoadingIncident) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/it/incidents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Incidente' : 'Novo Incidente'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Atualize as informações do incidente' : 'Registre um novo incidente de TI'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Incidente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Descreva o incidente brevemente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o incidente em detalhes..."
                    rows={5}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategoria</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="Ex: Windows, SAP, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affected_service">Serviço Afetado</Label>
                  <Input
                    id="affected_service"
                    value={formData.affected_service}
                    onChange={(e) => setFormData({ ...formData, affected_service: e.target.value })}
                    placeholder="Ex: E-mail Corporativo, ERP, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Fonte</Label>
                  <Select 
                    value={formData.source} 
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workaround</CardTitle>
                <CardDescription>Solução temporária enquanto o incidente é resolvido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="workaround_available"
                    checked={formData.workaround_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, workaround_available: checked })}
                  />
                  <Label htmlFor="workaround_available">Workaround disponível</Label>
                </div>

                {formData.workaround_available && (
                  <div className="space-y-2">
                    <Label htmlFor="workaround">Descrição do Workaround</Label>
                    <Textarea
                      id="workaround"
                      value={formData.workaround}
                      onChange={(e) => setFormData({ ...formData, workaround: e.target.value })}
                      placeholder="Descreva o workaround..."
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comunicação com Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="customer_visible"
                    checked={formData.customer_visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, customer_visible: checked })}
                  />
                  <Label htmlFor="customer_visible">Visível para o cliente</Label>
                </div>

                {formData.customer_visible && (
                  <div className="space-y-2">
                    <Label htmlFor="customer_communication">Mensagem para o Cliente</Label>
                    <Textarea
                      id="customer_communication"
                      value={formData.customer_communication}
                      onChange={(e) => setFormData({ ...formData, customer_communication: e.target.value })}
                      placeholder="Mensagem que será exibida para o cliente..."
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Priorização</CardTitle>
                <CardDescription>A prioridade é calculada automaticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Impacto</Label>
                  <Select 
                    value={formData.impact} 
                    onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') => 
                      setFormData({ ...formData, impact: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo - Poucos usuários</SelectItem>
                      <SelectItem value="medium">Médio - Área/Departamento</SelectItem>
                      <SelectItem value="high">Alto - Múltiplas áreas</SelectItem>
                      <SelectItem value="critical">Crítico - Toda empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Urgência</Label>
                  <Select 
                    value={formData.urgency} 
                    onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') => 
                      setFormData({ ...formData, urgency: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa - Pode aguardar</SelectItem>
                      <SelectItem value="medium">Média - Afeta trabalho</SelectItem>
                      <SelectItem value="high">Alta - Impede trabalho</SelectItem>
                      <SelectItem value="critical">Crítica - Parada total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isEdit && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Novo</SelectItem>
                        <SelectItem value="acknowledged">Reconhecido</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="pending_info">Aguardando Info</SelectItem>
                        <SelectItem value="pending_vendor">Aguardando Vendor</SelectItem>
                        <SelectItem value="on_hold">Em Espera</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atribuição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Grupo de Atribuição</Label>
                  <Select value={assignmentGroupId} onValueChange={setAssignmentGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {teams?.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Atribuído a</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não atribuído</SelectItem>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name} {user.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/it/incidents')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
