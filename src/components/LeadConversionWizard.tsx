import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  ArrowRight,
  Building2,
  User,
  Target,
  CheckCircle,
  AlertTriangle,
  Search,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  website: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  description: string | null;
  source: string | null;
}

interface LeadConversionWizardProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted: () => void;
}

interface DuplicateAccount {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
}

const conversionSchema = z.object({
  // Account
  createAccount: z.boolean().default(true),
  accountName: z.string().min(1, 'Nome da conta é obrigatório'),
  accountIndustry: z.string().optional(),
  accountWebsite: z.string().optional(),
  useExistingAccount: z.boolean().default(false),
  existingAccountId: z.string().optional(),
  
  // Contact
  createContact: z.boolean().default(true),
  contactFirstName: z.string().min(1, 'Nome é obrigatório'),
  contactLastName: z.string().min(1, 'Sobrenome é obrigatório'),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  contactJobTitle: z.string().optional(),
  
  // Opportunity
  createOpportunity: z.boolean().default(true),
  opportunityName: z.string().min(1, 'Nome da oportunidade é obrigatório'),
  opportunityAmount: z.coerce.number().min(0).optional(),
  opportunityDescription: z.string().optional(),
});

type ConversionFormData = z.infer<typeof conversionSchema>;

export function LeadConversionWizard({ 
  lead, 
  open, 
  onOpenChange, 
  onConverted 
}: LeadConversionWizardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [duplicateAccounts, setDuplicateAccounts] = useState<DuplicateAccount[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [conversionResult, setConversionResult] = useState<{
    accountId: string;
    contactId: string;
    opportunityId?: string;
  } | null>(null);

  const form = useForm<ConversionFormData>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      createAccount: true,
      accountName: lead.company || `${lead.first_name} ${lead.last_name}`,
      accountIndustry: lead.industry || '',
      accountWebsite: lead.website || '',
      useExistingAccount: false,
      existingAccountId: '',
      
      createContact: true,
      contactFirstName: lead.first_name,
      contactLastName: lead.last_name,
      contactEmail: lead.email || '',
      contactPhone: lead.phone || lead.mobile || '',
      contactJobTitle: lead.job_title || '',
      
      createOpportunity: true,
      opportunityName: `${lead.company || lead.first_name} - Nova Oportunidade`,
      opportunityAmount: 0,
      opportunityDescription: lead.description || '',
    },
  });

  const useExistingAccount = form.watch('useExistingAccount');
  const createOpportunity = form.watch('createOpportunity');

  const checkForDuplicates = async () => {
    setCheckingDuplicates(true);
    
    const searchTerms = [
      lead.company,
      lead.email,
      lead.website,
    ].filter(Boolean);

    if (searchTerms.length === 0) {
      setCheckingDuplicates(false);
      return;
    }

    // Search for potential duplicate accounts
    let query = supabase
      .from('accounts')
      .select('id, name, website, email');

    if (lead.company) {
      query = query.or(`name.ilike.%${lead.company}%`);
    }
    if (lead.email) {
      query = query.or(`email.ilike.%${lead.email}%`);
    }
    if (lead.website) {
      query = query.or(`website.ilike.%${lead.website}%`);
    }

    const { data } = await query.limit(5);
    
    if (data && data.length > 0) {
      setDuplicateAccounts(data);
    }
    
    setCheckingDuplicates(false);
  };

  const handleNext = () => {
    if (step === 1) {
      checkForDuplicates();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const onSubmit = async (data: ConversionFormData) => {
    if (!profile?.organization_id) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você deve fazer parte de uma organização para converter leads.',
      });
      return;
    }

    setLoading(true);

    try {
      let accountId: string;

      // Step 1: Create or use existing Account
      if (data.useExistingAccount && data.existingAccountId) {
        accountId = data.existingAccountId;
      } else {
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .insert([{
            name: data.accountName,
            industry: data.accountIndustry || null,
            website: data.accountWebsite || null,
            email: lead.email,
            phone: lead.phone,
            address_street: lead.address_street,
            address_city: lead.address_city,
            address_state: lead.address_state,
            address_postal_code: lead.address_postal_code,
            address_country: lead.address_country,
            source: lead.source,
            organization_id: profile.organization_id,
            owner_id: profile.id,
          }])
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = accountData.id;
      }

      // Step 2: Create Contact
      const { data: contactData, error: contactError } = await supabase
        .from('contacts')
        .insert([{
          first_name: data.contactFirstName,
          last_name: data.contactLastName,
          email: data.contactEmail || null,
          phone: data.contactPhone || null,
          job_title: data.contactJobTitle || null,
          account_id: accountId,
          organization_id: profile.organization_id,
          owner_id: profile.id,
        }])
        .select()
        .single();

      if (contactError) throw contactError;
      const contactId = contactData.id;

      // Step 3: Create Opportunity (optional)
      let opportunityId: string | undefined;
      if (data.createOpportunity) {
        const { data: oppData, error: oppError } = await supabase
          .from('opportunities')
          .insert([{
            name: data.opportunityName,
            amount: data.opportunityAmount || 0,
            description: data.opportunityDescription || null,
            account_id: accountId,
            stage: 'prospecting',
            source: lead.source,
            organization_id: profile.organization_id,
            owner_id: profile.id,
          }])
          .select()
          .single();

        if (oppError) throw oppError;
        opportunityId = oppData.id;

        // Link contact to opportunity
        await supabase
          .from('opportunity_contacts')
          .insert([{
            opportunity_id: opportunityId,
            contact_id: contactId,
            is_primary: true,
            role: 'decision_maker',
          }]);
      }

      // Step 4: Update Lead status to converted
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          converted_account_id: accountId,
          converted_contact_id: contactId,
          converted_opportunity_id: opportunityId || null,
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // Step 5: Create timeline event
      await supabase
        .from('timeline_events')
        .insert([{
          organization_id: profile.organization_id,
          event_type: 'lead_converted',
          title: 'Lead converted',
          description: `Lead "${lead.first_name} ${lead.last_name}" was converted to Account, Contact${opportunityId ? ', and Opportunity' : ''}.`,
          lead_id: lead.id,
          account_id: accountId,
          contact_id: contactId,
          opportunity_id: opportunityId || null,
          created_by: profile.id,
          metadata: {
            lead_name: `${lead.first_name} ${lead.last_name}`,
            account_name: data.accountName,
            opportunity_name: data.createOpportunity ? data.opportunityName : null,
          },
        }]);

      // Transfer notes from lead to account/contact
      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .eq('lead_id', lead.id);

      if (notes && notes.length > 0) {
        const updatedNotes = notes.map(note => ({
          ...note,
          id: undefined, // Let Supabase generate new IDs
          account_id: accountId,
          contact_id: contactId,
          lead_id: null,
        }));
        await supabase.from('notes').insert(updatedNotes);
      }

      setConversionResult({
        accountId,
        contactId,
        opportunityId,
      });

      toast({
        title: 'Lead convertido com sucesso!',
        description: `Conta${opportunityId ? ', Contato e Oportunidade criados' : ' e Contato criados'}.`,
      });

      setStep(3);
      onConverted();

    } catch (error: unknown) {
      console.error('Error converting lead:', error);
      toast({
        variant: 'destructive',
        title: 'Falha na conversão',
        description: error.message || 'Falha ao converter lead. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="p-2 bg-primary/10 rounded-full">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">{lead.first_name} {lead.last_name}</p>
          <p className="text-sm text-muted-foreground">
            {lead.job_title && lead.company 
              ? `${lead.job_title} na ${lead.company}`
              : lead.company || lead.job_title || 'Sem empresa'}
          </p>
        </div>
      </div>

      <Separator />

      {/* Account Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Conta</h3>
        </div>

        <FormField
          control={form.control}
          name="useExistingAccount"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Vincular a conta existente
              </FormLabel>
            </FormItem>
          )}
        />

        {useExistingAccount ? (
          <FormField
            control={form.control}
            name="existingAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selecionar Conta</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Buscar e selecionar conta..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {duplicateAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <>
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Conta *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="accountIndustry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indústria</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Contact Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Contato</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contactFirstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactLastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="contactJobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Duplicate Warning */}
      {duplicateAccounts.length > 0 && !useExistingAccount && (
        <Card className="border-warning">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Possíveis Duplicatas Encontradas
            </CardTitle>
            <CardDescription>
              Encontramos {duplicateAccounts.length} conta(s) que podem ser duplicadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {duplicateAccounts.map((acc) => (
              <div 
                key={acc.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{acc.name}</p>
                  <p className="text-sm text-muted-foreground">{acc.email || acc.website}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    form.setValue('useExistingAccount', true);
                    form.setValue('existingAccountId', acc.id);
                    setStep(1);
                  }}
                >
                  Usar esta conta
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Opportunity Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Oportunidade</h3>
        </div>

        <FormField
          control={form.control}
          name="createOpportunity"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="font-normal">
                Criar uma oportunidade para esta conversão
              </FormLabel>
            </FormItem>
          )}
        />

        {createOpportunity && (
          <div className="space-y-4 pl-6 border-l-2 border-muted">
            <FormField
              control={form.control}
              name="opportunityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Oportunidade *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opportunityAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="pl-9"
                        {...field}
                        value={field.value || ''} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opportunityDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="min-h-[80px]"
                      placeholder="Detalhes adicionais sobre esta oportunidade..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da Conversão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">
              {useExistingAccount ? 'Vincular a conta existente' : 'Criar nova conta'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Criar novo contato</span>
          </div>
          {createOpportunity && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">Criar nova oportunidade</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success" />
            <span className="text-sm">Marcar lead como convertido</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="p-4 bg-success/10 rounded-full">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold">Conversão Concluída!</h3>
        <p className="text-muted-foreground mt-2">
          O lead foi convertido com sucesso.
        </p>
      </div>

      {conversionResult && (
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(`/accounts/${conversionResult.accountId}`)}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Ver Conta
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate(`/contacts/${conversionResult.contactId}`)}
          >
            <User className="mr-2 h-4 w-4" />
            Ver Contato
          </Button>
          {conversionResult.opportunityId && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(`/opportunities/${conversionResult.opportunityId}`)}
            >
              <Target className="mr-2 h-4 w-4" />
              Ver Oportunidade
            </Button>
          )}
        </div>
      )}

      <Button onClick={() => onOpenChange(false)} className="w-full">
        Fechar
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Converter Lead</DialogTitle>
          <DialogDescription>
            Converta este lead em Conta, Contato e, opcionalmente, uma Oportunidade.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          <Badge variant={step >= 1 ? 'default' : 'outline'}>1. Detalhes</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step >= 2 ? 'default' : 'outline'}>2. Revisão</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant={step >= 3 ? 'default' : 'outline'}>3. Concluído</Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {step < 3 && (
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={step === 1 ? () => onOpenChange(false) : handleBack}
                >
                  {step === 1 ? 'Cancelar' : 'Voltar'}
                </Button>
                
                {step === 1 ? (
                  <Button type="button" onClick={handleNext}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Convertendo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Converter Lead
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
