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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ITChangeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    business_justification: '',
    category: '',
    change_type: 'normal' as 'standard' | 'normal' | 'emergency',
    risk_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    implementation_plan: '',
    rollback_plan: '',
    test_plan: '',
    communication_plan: '',
    impact_analysis: '',
    downtime_required: false,
    downtime_duration_minutes: 0,
    cab_required: false,
    scheduled_start: '',
    scheduled_end: ''
  });

  const [assignedTo, setAssignedTo] = useState<string>('');

  // Fetch existing change for edit mode
  const { isLoading: isLoadingChange } = useQuery({
    queryKey: ['it-change', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('it_changes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          business_justification: data.business_justification || '',
          category: data.category || '',
          change_type: data.change_type || 'normal',
          risk_level: data.risk_level || 'medium',
          implementation_plan: data.implementation_plan || '',
          rollback_plan: data.rollback_plan || '',
          test_plan: data.test_plan || '',
          communication_plan: data.communication_plan || '',
          impact_analysis: data.impact_analysis || '',
          downtime_required: data.downtime_required || false,
          downtime_duration_minutes: data.downtime_duration_minutes || 0,
          cab_required: data.cab_required || false,
          scheduled_start: data.scheduled_start?.slice(0, 16) || '',
          scheduled_end: data.scheduled_end?.slice(0, 16) || ''
        });
        setAssignedTo(data.assigned_to || '');
      }
      
      return data;
    },
    enabled: isEdit
  });

  // Fetch users
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.organization_id) {
        throw new Error('Organização não encontrada');
      }

      const changeData: any = {
        ...formData,
        organization_id: profile.organization_id,
        assigned_to: assignedTo || null,
        scheduled_start: formData.scheduled_start || null,
        scheduled_end: formData.scheduled_end || null
      };

      if (isEdit && id) {
        const { error } = await supabase
          .from('it_changes')
          .update(changeData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        // Generate change number
        const { data: numberData, error: numberError } = await supabase
          .rpc('generate_change_number', { org_id: profile.organization_id });
        
        if (numberError) throw numberError;

        changeData.change_number = numberData;
        changeData.requested_by = profile.id;

        const { error } = await supabase
          .from('it_changes')
          .insert(changeData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Mudança atualizada!' : 'Mudança criada!');
      queryClient.invalidateQueries({ queryKey: ['it-changes'] });
      navigate('/it/changes');
    },
    onError: (error) => {
      console.error('Error saving change:', error);
      toast.error('Erro ao salvar mudança');
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
    'Infraestrutura',
    'Aplicação',
    'Banco de Dados',
    'Rede',
    'Segurança',
    'Hardware',
    'Software',
    'Configuração',
    'Outro'
  ];

  if (isEdit && isLoadingChange) {
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
        <Button variant="ghost" size="icon" onClick={() => navigate('/it/changes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? 'Editar Mudança' : 'Nova Mudança'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Atualize as informações da requisição de mudança' : 'Solicite uma nova mudança em TI'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Mudança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Descreva a mudança brevemente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a mudança em detalhes..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_justification">Justificativa de Negócio</Label>
                  <Textarea
                    id="business_justification"
                    value={formData.business_justification}
                    onChange={(e) => setFormData({ ...formData, business_justification: e.target.value })}
                    placeholder="Por que esta mudança é necessária?"
                    rows={3}
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Planejamento</CardTitle>
                <CardDescription>Planos de implementação e contingência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="implementation_plan">Plano de Implementação</Label>
                  <Textarea
                    id="implementation_plan"
                    value={formData.implementation_plan}
                    onChange={(e) => setFormData({ ...formData, implementation_plan: e.target.value })}
                    placeholder="Descreva os passos para implementar a mudança..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollback_plan">Plano de Rollback</Label>
                  <Textarea
                    id="rollback_plan"
                    value={formData.rollback_plan}
                    onChange={(e) => setFormData({ ...formData, rollback_plan: e.target.value })}
                    placeholder="Descreva como reverter a mudança se necessário..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test_plan">Plano de Testes</Label>
                  <Textarea
                    id="test_plan"
                    value={formData.test_plan}
                    onChange={(e) => setFormData({ ...formData, test_plan: e.target.value })}
                    placeholder="Descreva como a mudança será testada..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="communication_plan">Plano de Comunicação</Label>
                  <Textarea
                    id="communication_plan"
                    value={formData.communication_plan}
                    onChange={(e) => setFormData({ ...formData, communication_plan: e.target.value })}
                    placeholder="Quem precisa ser notificado e quando..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Impacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="impact_analysis">Análise de Impacto</Label>
                  <Textarea
                    id="impact_analysis"
                    value={formData.impact_analysis}
                    onChange={(e) => setFormData({ ...formData, impact_analysis: e.target.value })}
                    placeholder="Quais serviços, sistemas ou usuários serão afetados?"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="downtime_required"
                    checked={formData.downtime_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, downtime_required: checked })}
                  />
                  <Label htmlFor="downtime_required">Requer Indisponibilidade (Downtime)</Label>
                </div>

                {formData.downtime_required && (
                  <div className="space-y-2">
                    <Label htmlFor="downtime_duration">Duração Estimada (minutos)</Label>
                    <Input
                      id="downtime_duration"
                      type="number"
                      value={formData.downtime_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, downtime_duration_minutes: parseInt(e.target.value) || 0 })}
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
                <CardTitle>Classificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Mudança</Label>
                  <Select 
                    value={formData.change_type} 
                    onValueChange={(v: 'standard' | 'normal' | 'emergency') => 
                      setFormData({ ...formData, change_type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Padrão (Pré-aprovada)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="emergency">Emergência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nível de Risco</Label>
                  <Select 
                    value={formData.risk_level} 
                    onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') => 
                      setFormData({ ...formData, risk_level: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="critical">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="cab_required"
                    checked={formData.cab_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, cab_required: checked })}
                  />
                  <Label htmlFor="cab_required">Requer CAB</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_start">Início Previsto</Label>
                  <Input
                    id="scheduled_start"
                    type="datetime-local"
                    value={formData.scheduled_start}
                    onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_end">Término Previsto</Label>
                  <Input
                    id="scheduled_end"
                    type="datetime-local"
                    value={formData.scheduled_end}
                    onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/it/changes')}
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
