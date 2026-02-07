import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  ShoppingCart, Headphones, Phone, Megaphone, Store, 
  CreditCard, Calculator, Monitor, Database, Zap, 
  Link, Bot, BarChart3, Users, Shield, Loader2,
  AlertTriangle, Building2, ShieldAlert
} from '@/components/icons';

type ModuleKeyType = 'sales' | 'service' | 'contact_center' | 'marketing' | 'commerce' | 
  'billing' | 'cpq' | 'itsm' | 'data_hub' | 'automations' | 'integrations' | 
  'ai_agents' | 'analytics' | 'portals' | 'governance';

type PlanTierType = 'free' | 'starter' | 'professional' | 'enterprise';

const MODULE_INFO: Record<ModuleKeyType, { name: string; description: string; icon: React.ElementType }> = {
  sales: { name: 'Vendas', description: 'Pipeline, leads, oportunidades e cotações', icon: ShoppingCart },
  service: { name: 'Atendimento', description: 'Tickets, SLA e base de conhecimento', icon: Headphones },
  contact_center: { name: 'Contact Center', description: 'Omnichannel inbox e roteamento', icon: Phone },
  marketing: { name: 'Marketing', description: 'Campanhas, jornadas e segmentação', icon: Megaphone },
  commerce: { name: 'Commerce', description: 'Pedidos, produtos e promoções', icon: Store },
  billing: { name: 'Faturamento', description: 'Faturas, assinaturas e pagamentos', icon: CreditCard },
  cpq: { name: 'CPQ', description: 'Configurador de produtos e preços', icon: Calculator },
  itsm: { name: 'ITSM', description: 'Incidentes, mudanças e CMDB', icon: Monitor },
  data_hub: { name: 'Data Hub', description: 'Customer 360 e unificação de dados', icon: Database },
  automations: { name: 'Automações', description: 'Workflows e regras de negócio', icon: Zap },
  integrations: { name: 'Integrações', description: 'Conectores e APIs externas', icon: Link },
  ai_agents: { name: 'Agentes IA', description: 'Agent Studio e automação inteligente', icon: Bot },
  analytics: { name: 'Analytics', description: 'Dashboards e relatórios', icon: BarChart3 },
  portals: { name: 'Portais', description: 'Portal do cliente e parceiros', icon: Users },
  governance: { name: 'Governança', description: 'LGPD, auditoria e compliance', icon: Shield },
};

const PLAN_TIERS: PlanTierType[] = ['free', 'starter', 'professional', 'enterprise'];

interface OrgModule {
  id: string;
  organization_id: string;
  module_key: ModuleKeyType;
  enabled: boolean;
  plan_tier: PlanTierType;
  limits_json: Record<string, unknown>;
  usage_json: Record<string, unknown>;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

function parseRLSError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('row-level security') || message.includes('42501')) {
    return 'Permissão negada. Verifique se você possui privilégios de administrador e está vinculado a uma organização.';
  }
  if (message.includes('not-null') || message.includes('23502')) {
    return 'Dados obrigatórios ausentes. Sua conta pode não estar vinculada a uma organização.';
  }
  if (message.includes('unique') || message.includes('23505')) {
    return 'Este módulo já está configurado para sua organização.';
  }
  if (message.includes('foreign key') || message.includes('23503')) {
    return 'Referência inválida. A organização ou usuário não foi encontrado.';
  }
  
  return `Erro ao atualizar módulo: ${message}`;
}

export default function PlatformModules() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const organizationId = profile?.organization_id;
  const isAdmin = profile?.role === 'admin';

  const { data: modules, isLoading } = useQuery({
    queryKey: ['admin-org-modules', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('org_modules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('module_key');
      
      if (error) throw error;
      return data as OrgModule[];
    },
    enabled: !!organizationId,
  });

  const updateModule = useMutation({
    mutationFn: async ({ moduleKey, updates }: { moduleKey: ModuleKeyType; updates: Record<string, unknown> }) => {
      if (!organizationId) {
        throw new Error('Organização não vinculada ao seu perfil. Não é possível gerenciar módulos.');
      }
      if (!isAdmin) {
        throw new Error('Apenas administradores podem gerenciar módulos da plataforma.');
      }

      const existing = modules?.find(m => m.module_key === moduleKey);
      
      if (existing) {
        const { error } = await supabase
          .from('org_modules')
          .update({ ...updates, updated_at: new Date().toISOString(), updated_by: profile?.id })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('org_modules')
          .insert({
            organization_id: organizationId,
            module_key: moduleKey,
            enabled: true,
            plan_tier: 'free',
            limits_json: {},
            usage_json: {},
            created_by: profile?.id,
            updated_by: profile?.id,
            ...updates,
          } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-org-modules'] });
      queryClient.invalidateQueries({ queryKey: ['org-modules'] });
      toast.success('Módulo atualizado com sucesso');
    },
    onError: (error) => {
      console.error('Error updating module:', error);
      toast.error(parseRLSError(error));
    },
  });

  const getModuleState = (moduleKey: ModuleKeyType) => {
    return modules?.find(m => m.module_key === moduleKey);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Estado: usuário sem organização vinculada
  if (!organizationId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Módulos da Plataforma</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie quais módulos estão habilitados para sua organização
          </p>
        </div>
        <Alert variant="destructive">
          <Building2 className="h-4 w-4" />
          <AlertTitle>Organização não vinculada</AlertTitle>
          <AlertDescription>
            Seu perfil não está associado a nenhuma organização. Para gerenciar módulos, é necessário
            que sua conta esteja vinculada a uma organização. Entre em contato com o administrador do
            sistema ou faça logout e crie uma nova conta para que a organização seja provisionada automaticamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Estado: usuário sem permissão de admin
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Módulos da Plataforma</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie quais módulos estão habilitados para sua organização
          </p>
        </div>
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Apenas administradores podem gerenciar os módulos da plataforma. 
            Seu perfil atual possui a role <Badge variant="secondary" className="mx-1">{profile?.role ?? 'desconhecida'}</Badge>.
            Solicite a promoção ao administrador da sua organização.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Módulos da Plataforma</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie quais módulos estão habilitados para sua organização
        </p>
      </div>

      {modules && modules.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhum módulo provisionado</AlertTitle>
          <AlertDescription>
            Sua organização ainda não possui módulos configurados. Ative os módulos desejados 
            utilizando os controles abaixo.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(MODULE_INFO) as [ModuleKeyType, typeof MODULE_INFO[ModuleKeyType]][]).map(([key, info]) => {
          const moduleState = getModuleState(key);
          const isEnabled = moduleState?.enabled ?? false;
          const planTier = moduleState?.plan_tier ?? 'free';
          const Icon = info.icon;

          return (
            <Card key={key} className={isEnabled ? 'border-primary/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{info.name}</CardTitle>
                      <Badge variant={isEnabled ? 'default' : 'secondary'} className="mt-1 text-xs">
                        {planTier}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) => 
                      updateModule.mutate({ moduleKey: key, updates: { enabled: checked } })
                    }
                    disabled={updateModule.isPending}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription>{info.description}</CardDescription>
                
                {isEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Plano:</span>
                    <Select
                      value={planTier}
                      onValueChange={(value) => 
                        updateModule.mutate({ moduleKey: key, updates: { plan_tier: value } })
                      }
                      disabled={updateModule.isPending}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_TIERS.map(tier => (
                          <SelectItem key={tier} value={tier}>
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
