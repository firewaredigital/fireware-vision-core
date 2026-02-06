import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Shield, User, Clock, CheckCircle2, XCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const lgpdRequestSchema = z.object({
  type: z.enum(['access', 'rectification', 'deletion', 'portability', 'objection', 'restriction']),
  requester_email: z.string().email('Email inválido'),
  requester_name: z.string().min(1, 'Nome é obrigatório'),
  requester_document: z.string().optional(),
  request_details: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

type LGPDRequestFormData = z.infer<typeof lgpdRequestSchema>;

const typeLabels: Record<string, { label: string; description: string }> = {
  access: {
    label: 'Acesso aos Dados',
    description: 'Solicitação de acesso aos dados pessoais armazenados',
  },
  rectification: {
    label: 'Retificação',
    description: 'Correção de dados pessoais incorretos ou incompletos',
  },
  deletion: {
    label: 'Exclusão (Esquecimento)',
    description: 'Solicitação de exclusão de dados pessoais',
  },
  portability: {
    label: 'Portabilidade',
    description: 'Transferência de dados para outro controlador',
  },
  objection: {
    label: 'Oposição',
    description: 'Oposição ao tratamento de dados pessoais',
  },
  restriction: {
    label: 'Restrição',
    description: 'Limitação do tratamento de dados pessoais',
  },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  received: { label: 'Recebida', color: 'bg-blue-100 text-blue-800' },
  verified: { label: 'Verificada', color: 'bg-purple-100 text-purple-800' },
  processing: { label: 'Em Processamento', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Concluída', color: 'bg-green-100 text-green-800' },
  denied: { label: 'Negada', color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirada', color: 'bg-gray-100 text-gray-800' },
};

export default function LGPDRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const form = useForm<LGPDRequestFormData>({
    resolver: zodResolver(lgpdRequestSchema),
    defaultValues: {
      type: 'access',
      requester_email: '',
      requester_name: '',
      requester_document: '',
      request_details: '',
      priority: 'normal',
    },
  });

  // Fetch existing request if editing
  const { data: request, isLoading } = useQuery({
    queryKey: ['lgpd-request', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('lgpd_requests')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (request) {
      form.reset({
        type: request.type as any,
        requester_email: request.requester_email,
        requester_name: request.requester_name || '',
        requester_document: request.requester_document || '',
        request_details: request.request_details || '',
        priority: (request.priority as any) || 'normal',
      });
    }
  }, [request, form]);

  const mutation = useMutation({
    mutationFn: async (data: LGPDRequestFormData) => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      if (isEditing) {
        const { error } = await supabase
          .from('lgpd_requests')
          .update({
            type: data.type,
            requester_email: data.requester_email,
            requester_name: data.requester_name,
            requester_document: data.requester_document || null,
            request_details: data.request_details || null,
            priority: data.priority,
          })
          .eq('id', id);
        if (error) throw error;
        return id;
      } else {
        const insertData = {
          organization_id: profile.organization_id,
          type: data.type,
          requester_email: data.requester_email,
          requester_name: data.requester_name,
          requester_document: data.requester_document || null,
          request_details: data.request_details || null,
          priority: data.priority,
        };
        
        const { data: newRequest, error } = await supabase
          .from('lgpd_requests')
          .insert(insertData)
          .select('id')
          .single();
        if (error) throw error;
        return newRequest.id;
      }
    },
    onSuccess: (requestId) => {
      toast.success(isEditing ? 'Solicitação atualizada!' : 'Solicitação criada!');
      queryClient.invalidateQueries({ queryKey: ['lgpd-requests'] });
      navigate(`/governance/lgpd/${requestId}`);
    },
    onError: (error) => {
      toast.error('Erro ao salvar solicitação');
      console.error(error);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!id) return;
      
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = profile?.id;
      }
      
      const { error } = await supabase
        .from('lgpd_requests')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado!');
      queryClient.invalidateQueries({ queryKey: ['lgpd-request', id] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status');
      console.error(error);
    },
  });

  const onSubmit = (data: LGPDRequestFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/governance')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Detalhes da Solicitação LGPD' : 'Nova Solicitação LGPD'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? 'Visualize e gerencie esta solicitação de titular'
                : 'Registre uma nova solicitação de direitos do titular'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Titular</CardTitle>
                    <CardDescription>
                      Informações do solicitante
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="requester_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do titular" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requester_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requester_document"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF/CNPJ</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormDescription>
                            Documento para verificação de identidade
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Solicitação</CardTitle>
                    <CardDescription>
                      Tipo e informações adicionais
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Solicitação *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(typeLabels).map(([value, { label, description }]) => (
                                <SelectItem key={value} value={value}>
                                  <div>
                                    <p className="font-medium">{label}</p>
                                    <p className="text-xs text-muted-foreground">{description}</p>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="urgent">Urgente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="request_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalhes Adicionais</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva os detalhes da solicitação..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Informações adicionais sobre a solicitação do titular
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => navigate('/governance')}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Atualizar' : 'Criar Solicitação'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {isEditing && request && (
              <>
                {/* Status Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status Atual</span>
                      <Badge className={statusLabels[request.status]?.color}>
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Alterar Status</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate('verified')}
                          disabled={request.status === 'verified' || updateStatusMutation.isPending}
                        >
                          Verificar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate('processing')}
                          disabled={request.status === 'processing' || updateStatusMutation.isPending}
                        >
                          Processar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatusMutation.mutate('completed')}
                          disabled={request.status === 'completed' || updateStatusMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateStatusMutation.mutate('denied')}
                          disabled={request.status === 'denied' || updateStatusMutation.isPending}
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          Negar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prazos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          Prazo: {format(new Date(request.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {differenceInDays(new Date(request.deadline), new Date())} dias restantes
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criada em</span>
                        <span>{format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {request.verified_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Verificada em</span>
                          <span>{format(new Date(request.verified_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}
                      {request.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Concluída em</span>
                          <span>{format(new Date(request.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações LGPD</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong>Art. 18 da LGPD:</strong> O titular tem direito a obter do controlador confirmação
                      da existência de tratamento, acesso aos dados, correção, anonimização, portabilidade,
                      eliminação, e outras garantias.
                    </p>
                    <p>
                      <strong>Prazo Legal:</strong> O controlador deve responder às solicitações em até 15 dias
                      (art. 18, §4º).
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Direitos do Titular
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    A LGPD (Lei 13.709/2018) garante aos titulares diversos direitos sobre seus dados pessoais.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Confirmação de tratamento</li>
                    <li>Acesso aos dados</li>
                    <li>Correção de dados incompletos</li>
                    <li>Anonimização ou bloqueio</li>
                    <li>Portabilidade</li>
                    <li>Eliminação</li>
                    <li>Revogação do consentimento</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
