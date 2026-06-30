import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CustomFieldsRenderer } from '@/components/CustomFieldsRenderer';
import { useCustomFieldDefinitions, useCustomFieldValues, useSaveCustomFieldValues, getFieldValue } from '@/hooks/useCustomFields';

const leadSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório').max(100),
  last_name: z.string().min(1, 'Sobrenome é obrigatório').max(100),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  mobile: z.string().max(50).optional().or(z.literal('')),
  company: z.string().max(255).optional().or(z.literal('')),
  job_title: z.string().max(255).optional().or(z.literal('')),
  industry: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  address_street: z.string().max(255).optional().or(z.literal('')),
  address_city: z.string().max(100).optional().or(z.literal('')),
  address_state: z.string().max(100).optional().or(z.literal('')),
  address_postal_code: z.string().max(20).optional().or(z.literal('')),
  address_country: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']),
  source: z.string().max(100).optional().or(z.literal('')),
  rating: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function LeadForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('lead');
  const { data: customFieldValuesData = [] } = useCustomFieldValues('lead', id);
  const saveCustomFields = useSaveCustomFieldValues();
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (customFieldDefs.length > 0) {
      const values: Record<string, unknown> = {};
      customFieldDefs.forEach(def => {
        const fieldValue = customFieldValuesData.find(v => v.field_definition_id === def.id);
        values[def.id] = getFieldValue(def, fieldValue);
      });
      setCustomFieldValues(values);
    }
  }, [customFieldDefs, customFieldValuesData]);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      mobile: '',
      company: '',
      job_title: '',
      industry: '',
      website: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_postal_code: '',
      address_country: '',
      status: 'new',
      source: '',
      rating: '',
      description: '',
    },
  });


  useEffect(() => {
    if (id && user) {
      setIsEditing(true);
      fetchLead();
    }
  }, [id, user, fetchLead]);

  const fetchLead = useCallback( async () => {
    const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar lead',
      });
      navigate('/leads');
    } else {
      form.reset({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        company: data.company || '',
        job_title: data.job_title || '',
        industry: data.industry || '',
        website: data.website || '',
        address_street: data.address_street || '',
        address_city: data.address_city || '',
        address_state: data.address_state || '',
        address_postal_code: data.address_postal_code || '',
        address_country: data.address_country || '',
        status: data.status,
        source: data.source || '',
        rating: data.rating || '',
        description: data.description || '',
      });
    }
  }, [id, toast, form]);

  const onSubmit = async (data: LeadFormData) => {
    if (!profile?.organization_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você deve fazer parte de uma organização para criar leads.',
      });
      return;
    }

    setIsLoading(true);

    const leadData = {
      first_name: data.first_name,
      last_name: data.last_name,
      status: data.status,
      email: data.email || null,
      phone: data.phone || null,
      mobile: data.mobile || null,
      company: data.company || null,
      job_title: data.job_title || null,
      industry: data.industry || null,
      website: data.website || null,
      address_street: data.address_street || null,
      address_city: data.address_city || null,
      address_state: data.address_state || null,
      address_postal_code: data.address_postal_code || null,
      address_country: data.address_country || null,
      source: data.source || null,
      rating: data.rating || null,
      description: data.description || null,
      organization_id: profile.organization_id,
      owner_id: user?.id || null,
    };

    if (isEditing && id) {
      const { error } = await supabase.from('leads').update(leadData).eq('id', id);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao atualizar lead',
        });
      } else {
        toast({ title: 'Lead atualizado', description: 'O lead foi atualizado com sucesso.' });
        if (customFieldDefs.length > 0 && id) {
          saveCustomFields.mutate({ entityType: 'lead', entityId: id, values: customFieldValues, definitions: customFieldDefs });
        }
        navigate(`/leads/${id}`);
      }
    } else {
      const { data: newLead, error } = await supabase.from('leads').insert([leadData]).select().single();

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message || 'Falha ao criar lead',
        });
      } else {
        toast({ title: 'Lead criado', description: 'O lead foi criado com sucesso.' });
        if (customFieldDefs.length > 0) {
          saveCustomFields.mutate({ entityType: 'lead', entityId: newLead.id, values: customFieldValues, definitions: customFieldDefs });
        }
        navigate(`/leads/${newLead.id}`);
      }
    }

    setIsLoading(false);
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isEditing ? `/leads/${id}` : '/leads')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Editar Lead' : 'Novo Lead'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualizar informações do lead' : 'Criar um novo lead de vendas'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Dados de contato do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Dados da empresa do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Sales Manager" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indústria</FormLabel>
                        <FormControl>
                          <Input placeholder="Technology" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Lead Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Lead</CardTitle>
                <CardDescription>Qualificação e acompanhamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Novo</SelectItem>
                            <SelectItem value="contacted">Contatado</SelectItem>
                            <SelectItem value="qualified">Qualificado</SelectItem>
                            <SelectItem value="unqualified">Desqualificado</SelectItem>
                            <SelectItem value="converted">Convertido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fonte do Lead</FormLabel>
                        <FormControl>
                          <Input placeholder="Website, Indicação, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classificação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione classificação" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hot">Quente</SelectItem>
                            <SelectItem value="warm">Morno</SelectItem>
                            <SelectItem value="cold">Frio</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionais sobre o lead..."
                            rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Localização do lead</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address_street"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logradouro</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua Principal, 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField
                    control={form.control}
                    name="address_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="01310-100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País</FormLabel>
                        <FormControl>
                          <Input placeholder="Brasil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {customFieldDefs.length > 0 && (
              <CustomFieldsRenderer
                entityType="lead"
                definitions={customFieldDefs}
                values={customFieldValues}
                onChange={setCustomFieldValues}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEditing ? `/leads/${id}` : '/leads')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    
  );
}
