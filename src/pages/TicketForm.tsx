import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ticketSchema = z.object({
  subject: z.string().min(5, 'O assunto deve ter pelo menos 5 caracteres').max(200),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  type: z.enum(['incident', 'request', 'question', 'complaint', 'return']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  channel: z.enum(['email', 'chat', 'phone', 'whatsapp', 'portal', 'form']),
  account_id: z.string().optional().nullable(),
  contact_id: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  queue_id: z.string().optional().nullable(),
  assigned_to: z.string().optional().nullable(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const typeLabels = {
  incident: 'Incidente',
  request: 'Solicitação',
  question: 'Dúvida',
  complaint: 'Reclamação',
  return: 'Devolução',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const channelLabels = {
  email: 'E-mail',
  chat: 'Chat',
  phone: 'Telefone',
  whatsapp: 'WhatsApp',
  portal: 'Portal',
  form: 'Formulário',
};

export default function TicketForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      description: '',
      type: 'request',
      priority: 'medium',
      channel: 'portal',
      account_id: null,
      contact_id: null,
      category_id: null,
      queue_id: null,
      assigned_to: null,
    },
  });

  // Fetch existing ticket for edit mode
  const { data: ticket, isLoading: isLoadingTicket } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-select', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-select', profile?.organization_id, form.watch('account_id')],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('organization_id', profile.organization_id)
        .order('first_name');
      
      const accountId = form.watch('account_id');
      if (accountId) {
        query = query.eq('account_id', accountId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['ticket-categories', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch queues
  const { data: queues = [] } = useQuery({
    queryKey: ['ticket-queues', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('ticket_queues')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Populate form when editing
  useEffect(() => {
    if (ticket) {
      form.reset({
        subject: ticket.subject,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        channel: ticket.channel,
        account_id: ticket.account_id,
        contact_id: ticket.contact_id,
        category_id: ticket.category_id,
        queue_id: ticket.queue_id,
        assigned_to: ticket.assigned_to,
      });
    }
  }, [ticket, form]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      if (!profile?.organization_id) throw new Error('Organização não encontrada');

      const ticketData = {
        ...data,
        organization_id: profile.organization_id,
        account_id: data.account_id || null,
        contact_id: data.contact_id || null,
        category_id: data.category_id || null,
        queue_id: data.queue_id || null,
        assigned_to: data.assigned_to || null,
        ...(data.assigned_to && !ticket?.assigned_to ? { assigned_at: new Date().toISOString() } : {}),
      };

      if (isEditing) {
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', id);
        if (error) throw error;
        return id;
      } else {
        // Generate ticket number using RPC
        const { data: ticketNumber } = await supabase.rpc('generate_ticket_number', {
          org_id: profile.organization_id,
        });
        
        const { data: newTicket, error } = await supabase
          .from('tickets')
          .insert({
            ...ticketData,
            ticket_number: ticketNumber || `TKT-${Date.now()}`,
            reporter_id: profile.id,
          })
          .select('id')
          .single();
        if (error) throw error;
        return newTicket.id;
      }
    },
    onSuccess: (ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast({
        title: isEditing ? 'Ticket atualizado' : 'Ticket criado',
        description: isEditing 
          ? 'As alterações foram salvas com sucesso.'
          : 'O ticket foi criado com sucesso.',
      });
      navigate(`/tickets/${ticketId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TicketFormData) => {
    mutation.mutate(data);
  };

  if (isEditing && isLoadingTicket) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Editar Ticket' : 'Novo Ticket'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing 
                ? 'Atualize as informações do ticket'
                : 'Preencha os dados para criar um novo ticket de suporte'
              }
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Descreva brevemente o problema ou solicitação" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Forneça todos os detalhes relevantes..."
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Inclua todas as informações necessárias para resolver o ticket.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(typeLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                        <FormLabel>Prioridade *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(priorityLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
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
                    name="channel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Canal *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o canal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(channelLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta/Empresa</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma conta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
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
                    name="contact_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um contato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {contacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.first_name} {contact.last_name}
                                {contact.email && ` (${contact.email})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Atribuição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
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
                    name="queue_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fila</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma fila" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {queues.map((queue) => (
                              <SelectItem key={queue.id} value={queue.id}>
                                {queue.name}
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
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Atribuir para..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Não atribuído</SelectItem>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.first_name} {member.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Salvar Alterações' : 'Criar Ticket'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
