import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Building, DollarSign, Calendar, User, Percent, Target, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { Timeline } from '@/components/Timeline';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangeHistory } from '@/components/ChangeHistory';

interface OpportunityData {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  probability: number | null;
  close_date: string | null;
  description: string | null;
  next_step: string | null;
  source: string | null;
  competitor: string | null;
  created_at: string;
  updated_at: string;
  account: { id: string; name: string } | null;
  owner: { id: string; first_name: string | null; last_name: string | null; email: string } | null;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  job_title: string | null;
  role: string | null;
  is_primary: boolean;
}

const stageColors: Record<string, string> = {
  prospecting: 'bg-slate-100 text-slate-700',
  qualification: 'bg-blue-100 text-blue-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<OpportunityData | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      setLoading(true);
      
      // Fetch opportunity with related data
      const { data: oppData, error: oppError } = await supabase
        .from('opportunities')
        .select(`
          *,
          account:accounts!opportunities_account_id_fkey(id, name),
          owner:profiles!opportunities_owner_id_fkey(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .maybeSingle();

      if (oppError || !oppData) {
        toast({ title: 'Erro ao carregar oportunidade', description: oppError?.message, variant: 'destructive' });
        navigate('/opportunities');
        return;
      }
      
      setOpportunity(oppData as OpportunityData);

      // Fetch related contacts
      const { data: contactsData } = await supabase
        .from('opportunity_contacts')
        .select(`
          is_primary,
          role,
          contact:contacts!opportunity_contacts_contact_id_fkey(id, first_name, last_name, email, job_title)
        `)
        .eq('opportunity_id', id);

      if (contactsData) {
        setContacts(contactsData.map(c => ({
          ...c.contact,
          role: c.role,
          is_primary: c.is_primary || false,
        })) as Contact[]);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [id, toast, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    
    const { error } = await supabase.from('opportunities').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Erro ao excluir oportunidade', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Oportunidade excluída' });
      navigate('/opportunities');
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(amount);

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48 md:col-span-2" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!opportunity) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/opportunities')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{opportunity.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={stageColors[opportunity.stage]}>
                  {opportunity.stage.replace('_', ' ')}
                </Badge>
                {opportunity.account && (
                  <span className="text-sm text-muted-foreground">
                    {opportunity.account.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/opportunities/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Oportunidade?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente esta oportunidade e todos os dados relacionados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Negócio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-semibold">
                        {opportunity.amount ? formatCurrency(opportunity.amount) : 'Não definido'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Percent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Probabilidade</p>
                      <p className="font-semibold">{opportunity.probability || 0}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Fechamento</p>
                      <p className="font-semibold">
                        {opportunity.close_date 
                          ? format(new Date(opportunity.close_date), 'dd/MM/yyyy')
                          : 'Não definido'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Proprietário</p>
                      <p className="font-semibold">
                        {opportunity.owner 
                          ? `${opportunity.owner.first_name || ''} ${opportunity.owner.last_name || ''}`.trim() || opportunity.owner.email
                          : 'Não atribuído'}
                      </p>
                    </div>
                  </div>
                </div>

                {opportunity.next_step && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Próximo Passo</p>
                        <p className="font-medium">{opportunity.next_step}</p>
                      </div>
                    </div>
                  </>
                )}

                {opportunity.description && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                      <p className="text-sm whitespace-pre-wrap">{opportunity.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Tabs defaultValue="timeline">
              <TabsList>
                <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                <TabsTrigger value="contacts">Stakeholders ({contacts.length})</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Linha do Tempo de Atividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Timeline opportunityId={id} maxHeight="400px" />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contacts" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stakeholders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contacts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum stakeholder vinculado a esta oportunidade
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {contacts.map((contact) => (
                          <div 
                            key={contact.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {contact.first_name} {contact.last_name}
                                </span>
                                {contact.is_primary && (
                                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {contact.job_title || contact.email}
                              </p>
                            </div>
                            {contact.role && (
                              <Badge variant="outline">{contact.role.replace('_', ' ')}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conta</CardTitle>
              </CardHeader>
              <CardContent>
                {opportunity.account ? (
                  <div 
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/accounts/${opportunity.account!.id}`)}
                  >
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{opportunity.account.name}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma conta vinculada</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {opportunity.source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origem</span>
                    <span>{opportunity.source}</span>
                  </div>
                )}
                {opportunity.competitor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Concorrente</span>
                    <span>{opportunity.competitor}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em</span>
                  <span>{format(new Date(opportunity.created_at), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última Atualização</span>
                  <span>{format(new Date(opportunity.updated_at), 'dd/MM/yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
