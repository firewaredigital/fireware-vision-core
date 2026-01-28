import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type OpportunityStage = Database['public']['Enums']['opportunity_stage'];

const opportunitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  account_id: z.string().min(1, 'Account is required'),
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const),
  amount: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  close_date: z.string().optional(),
  description: z.string().max(5000).optional(),
  next_step: z.string().max(500).optional(),
  source: z.string().max(100).optional(),
  competitor: z.string().max(200).optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface Account {
  id: string;
  name: string;
}

export default function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      name: '',
      account_id: '',
      stage: 'prospecting',
      amount: undefined,
      probability: 10,
      close_date: '',
      description: '',
      next_step: '',
      source: '',
      competitor: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchAccounts() {
      if (!profile?.organization_id) return;
      
      const { data } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .order('name');
      
      if (data) setAccounts(data);
    }
    fetchAccounts();
  }, [profile?.organization_id]);

  useEffect(() => {
    async function fetchOpportunity() {
      if (!id || id === 'new') return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        toast({ title: 'Error loading opportunity', description: error.message, variant: 'destructive' });
        navigate('/opportunities');
      } else if (data) {
        form.reset({
          name: data.name,
          account_id: data.account_id,
          stage: data.stage,
          amount: data.amount || undefined,
          probability: data.probability || 10,
          close_date: data.close_date || '',
          description: data.description || '',
          next_step: data.next_step || '',
          source: data.source || '',
          competitor: data.competitor || '',
        });
      }
      setLoading(false);
    }
    fetchOpportunity();
  }, [id, form, toast, navigate]);

  const onSubmit = async (data: OpportunityFormData) => {
    if (!profile?.organization_id) {
      toast({ title: 'Error', description: 'No organization found', variant: 'destructive' });
      return;
    }

    setLoading(true);

    let error;
    if (id && id !== 'new') {
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          name: data.name,
          account_id: data.account_id,
          stage: data.stage,
          amount: data.amount || null,
          probability: data.probability || null,
          close_date: data.close_date || null,
          description: data.description || null,
          next_step: data.next_step || null,
          source: data.source || null,
          competitor: data.competitor || null,
        })
        .eq('id', id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('opportunities')
        .insert([{
          name: data.name,
          account_id: data.account_id,
          stage: data.stage,
          organization_id: profile.organization_id,
          owner_id: user?.id,
          amount: data.amount || null,
          probability: data.probability || null,
          close_date: data.close_date || null,
          description: data.description || null,
          next_step: data.next_step || null,
          source: data.source || null,
          competitor: data.competitor || null,
        }]);
      error = insertError;
    }

    if (error) {
      toast({ title: 'Error saving opportunity', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: id ? 'Opportunity updated' : 'Opportunity created' });
      navigate('/opportunities');
    }
    setLoading(false);
  };

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/opportunities')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{id && id !== 'new' ? 'Edit Opportunity' : 'New Opportunity'}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Opportunity Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Enterprise License Deal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prospecting">Prospecting</SelectItem>
                            <SelectItem value="qualification">Qualification</SelectItem>
                            <SelectItem value="proposal">Proposal</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="closed_won">Closed Won</SelectItem>
                            <SelectItem value="closed_lost">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="probability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Probability (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="close_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Close Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Website, Referral" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="competitor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Competitor</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Competitor Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="next_step"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Next Step</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Schedule demo call" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Add notes about this opportunity..." rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {id && id !== 'new' ? 'Update Opportunity' : 'Create Opportunity'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/opportunities')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
