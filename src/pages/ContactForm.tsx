import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, X } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

const contactSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório').max(100),
  last_name: z.string().min(1, 'Sobrenome é obrigatório').max(100),
  email: z.string().email('Deve ser um e-mail válido').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
  do_not_call: z.boolean().default(false),
  do_not_email: z.boolean().default(false),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_country: z.string().optional(),
  description: z.string().optional(),
  account_id: z.string().optional(),
  owner_id: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Account {
  id: string;
  name: string;
}

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

const roles = [
  { value: 'decision_maker', label: 'Decisor' },
  { value: 'technical', label: 'Técnico' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'influencer', label: 'Influenciador' },
  { value: 'end_user', label: 'Usuário Final' },
  { value: 'other', label: 'Outro' },
];

const departments = [
  'Diretoria',
  'Vendas',
  'Marketing',
  'Engenharia',
  'Produto',
  'Financeiro',
  'Operações',
  'Recursos Humanos',
  'Jurídico',
  'Sucesso do Cliente',
  'TI',
  'Outro',
];

export default function ContactForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { data: customFieldDefs = [] } = useCustomFieldDefinitions('contact');
  const { data: customFieldValuesData = [] } = useCustomFieldValues('contact', id);
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

  const isEditing = Boolean(id);
  const preselectedAccountId = searchParams.get('account');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      mobile: '',
      job_title: '',
      department: '',
      role: '',
      do_not_call: false,
      do_not_email: false,
      address_street: '',
      address_city: '',
      address_state: '',
      address_postal_code: '',
      address_country: '',
      description: '',
      account_id: preselectedAccountId || '',
      owner_id: '',
    },
  });


  useEffect(() => {
    if (user) {
      fetchReferenceData();
      if (isEditing) {
        fetchContact();
      }
    }
  }, [user, id, fetchContact, isEditing]);

  const fetchReferenceData = async () => {
    // Fetch accounts
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('id, name')
      .order('name');
    setAccounts(accountsData || []);

    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('is_active', true)
      .order('first_name');
    setUsers(usersData || []);
  };

  const fetchContact = useCallback( async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar contato',
      });
      navigate('/contacts');
    } else if (data) {
      form.reset({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone || '',
        mobile: data.mobile || '',
        job_title: data.job_title || '',
        department: data.department || '',
        role: data.role || '',
        do_not_call: data.do_not_call || false,
        do_not_email: data.do_not_email || false,
        address_street: data.address_street || '',
        address_city: data.address_city || '',
        address_state: data.address_state || '',
        address_postal_code: data.address_postal_code || '',
        address_country: data.address_country || '',
        description: data.description || '',
        account_id: data.account_id || '',
        owner_id: data.owner_id || '',
      });
      setTags(data.tags || []);
    }
    setLoading(false);
  }, [id, toast, form]);

  const onSubmit = async (data: ContactFormData) => {
    setSaving(true);

    // Get user's profile for organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user?.id)
      .single();

    if (!profile?.organization_id) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Organização não encontrada' });
      setSaving(false);
      return;
    }

    // Cast role to the expected enum type
    type ContactRole = 'decision_maker' | 'technical' | 'financial' | 'influencer' | 'end_user' | 'other' | null;
    const roleValue: ContactRole = data.role ? (data.role as ContactRole) : null;

    const contactData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      mobile: data.mobile || null,
      job_title: data.job_title || null,
      department: data.department || null,
      role: roleValue,
      do_not_call: data.do_not_call,
      do_not_email: data.do_not_email,
      address_street: data.address_street || null,
      address_city: data.address_city || null,
      address_state: data.address_state || null,
      address_postal_code: data.address_postal_code || null,
      address_country: data.address_country || null,
      description: data.description || null,
      account_id: data.account_id || null,
      owner_id: data.owner_id || null,
      tags: tags.length > 0 ? tags : null,
      organization_id: profile.organization_id,
    };

    if (isEditing) {
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar contato' });
      } else {
        toast({ title: 'Contato atualizado' });
        if (customFieldDefs.length > 0 && id) {
          saveCustomFields.mutate({ entityType: 'contact', entityId: id, values: customFieldValues, definitions: customFieldDefs });
        }
        navigate(`/contacts/${id}`);
      }
    } else {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao criar contato' });
      } else {
        toast({ title: 'Contato criado' });
        if (customFieldDefs.length > 0) {
          saveCustomFields.mutate({ entityType: 'contact', entityId: newContact.id, values: customFieldValues, definitions: customFieldDefs });
        }
        navigate(`/contacts/${newContact.id}`);
      }
    }

    setSaving(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const getUserName = (u: User) => {
    if (u.first_name || u.last_name) {
      return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    }
    return u.email;
  };

  if (authLoading || loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  return (
    
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contacts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? 'Editar Contato' : 'Novo Contato'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Atualizar informações do contato' : 'Adicionar um novo contato ao CRM'}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Nome e dados de contato</CardDescription>
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
                          <Input placeholder="João" {...field} />
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
                          <Input placeholder="Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
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
                          <Input placeholder="(11) 3000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Profissionais</CardTitle>
                <CardDescription>Cargo, departamento e função</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Conta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a conta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>Vincular este contato a uma empresa</FormDescription>
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
                          <Input placeholder="Diretor de Vendas" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o departamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
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
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel no Processo de Compra</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o papel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Their role in purchase decisions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="owner_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {getUserName(u)}
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

            {/* Communication Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
                <CardDescription>Contact restrictions and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                  <FormField
                    control={form.control}
                    name="do_not_call"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Do not call</FormLabel>
                          <FormDescription>
                            This contact does not want to receive phone calls
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="do_not_email"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Do not email</FormLabel>
                          <FormDescription>
                            This contact does not want to receive emails
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>Contact location</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address_street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
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
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="San Francisco" {...field} />
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
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="CA" {...field} />
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
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="94105" {...field} />
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
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="United States" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes and tags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this contact..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      className="max-w-xs"
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {customFieldDefs.length > 0 && (
              <CustomFieldsRenderer
                entityType="contact"
                definitions={customFieldDefs}
                values={customFieldValues}
                onChange={setCustomFieldValues}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/contacts')}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Contact'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    
  );
}
