import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Calendar,
  User,
  Activity,
  FileText,
  Plus,
  RefreshCw,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LeadConversionWizard } from '@/components/LeadConversionWizard';
import { Timeline } from '@/components/Timeline';
import { ChangeHistory } from '@/components/ChangeHistory';

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
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  source: string | null;
  score: number;
  rating: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-info/10 text-info border-info/20',
  contacted: 'bg-warning/10 text-warning border-warning/20',
  qualified: 'bg-success/10 text-success border-success/20',
  unqualified: 'bg-muted text-muted-foreground border-muted',
  converted: 'bg-primary/10 text-primary border-primary/20',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConversionWizard, setShowConversionWizard] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchLead();
    }
  }, [id, user]);

  const fetchLead = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao carregar detalhes do lead',
      });
      navigate('/leads');
    } else {
      setLead(data);
    }
    setLoading(false);
  };

  const deleteLead = async () => {
    if (!id) return;

    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao excluir lead',
      });
    } else {
      toast({
        title: 'Lead excluído',
        description: 'O lead foi excluído com sucesso.',
      });
      navigate('/leads');
    }
  };

  const formatAddress = () => {
    if (!lead) return null;
    const parts = [
      lead.address_street,
      lead.address_city,
      lead.address_state,
      lead.address_postal_code,
      lead.address_country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Lead não encontrado</p>
          <Button onClick={() => navigate('/leads')}>Voltar para Leads</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/leads')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {lead.first_name} {lead.last_name}
                </h1>
                <Badge variant="outline" className={statusColors[lead.status]}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {lead.job_title && lead.company
                  ? `${lead.job_title} at ${lead.company}`
                  : lead.job_title || lead.company || 'No company'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {lead.status !== 'converted' && (
              <Button variant="default" onClick={() => setShowConversionWizard(true)}>
                <Target className="mr-2 h-4 w-4" />
                Converter Lead
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/leads/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteLead}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="activities">Atividades</TabsTrigger>
                <TabsTrigger value="notes">Notas</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Lead</CardTitle>
                    <CardDescription>Dados de contato e empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Informações de Contato
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {lead.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                              {lead.email}
                            </a>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                        {lead.mobile && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${lead.mobile}`} className="text-sm hover:underline">
                              {lead.mobile} (Celular)
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Company Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Informações da Empresa
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {lead.company && (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.company}</span>
                          </div>
                        )}
                        {lead.industry && (
                          <div className="flex items-center gap-3">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.industry}</span>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              {lead.website}
                            </a>
                          </div>
                        )}
                        {formatAddress() && (
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm">{formatAddress()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {lead.description && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Descrição
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">{lead.description}</p>
                        </div>
                      </>
                    )}

                    {lead.tags && lead.tags.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Atividades</CardTitle>
                      <CardDescription>Ligações, reuniões e tarefas</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Atividade
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Activity className="h-8 w-8 mb-2" />
                      <p>Nenhuma atividade ainda</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Notas</CardTitle>
                      <CardDescription>Notas internas e comentários</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Nota
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>Nenhuma nota ainda</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>Histórico completo de interações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Timeline leadId={lead.id} maxHeight="400px" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <ChangeHistory entityType="lead" entityId={lead.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lead Score */}
            <Card>
              <CardHeader>
                <CardTitle>Pontuação do Lead</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeDasharray={`${(lead.score / 100) * 226} 226`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{lead.score}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {lead.score >= 80
                        ? 'Lead Quente'
                        : lead.score >= 50
                        ? 'Lead Morno'
                        : 'Lead Frio'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fonte</span>
                  <span>{lead.source || 'Desconhecida'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Classificação</span>
                  <span>{lead.rating || 'Não classificado'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Criado em</span>
                  <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última Modificação</span>
                  <span>{new Date(lead.updated_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  Registrar Ligação
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Reunião
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Atribuir Proprietário
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Lead Conversion Wizard */}
      {lead && (
        <LeadConversionWizard
          lead={lead}
          open={showConversionWizard}
          onOpenChange={setShowConversionWizard}
          onConverted={() => {
            fetchLead();
            toast({
              title: 'Lead Convertido',
              description: 'O lead foi convertido com sucesso.',
            });
          }}
        />
      )}
    </AppLayout>
  );
}
