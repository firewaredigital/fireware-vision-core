import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Gift, Calendar, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ENTITLEMENT_ICONS: Record<string, typeof Gift> = {
  discount: Gift,
  training: BookOpen,
  support: CheckCircle,
  marketing: Calendar,
};

const ENTITLEMENT_LABELS: Record<string, string> = {
  discount: 'Desconto',
  training: 'Treinamento',
  support: 'Suporte',
  marketing: 'Marketing',
  lead_distribution: 'Distribuição de Leads',
  api_access: 'Acesso à API',
  co_branding: 'Co-Branding',
};

function getPartnerSession() {
  try {
    const session = localStorage.getItem('partner_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

export default function PartnerResources() {
  const session = getPartnerSession();
  const partnerId = session?.partner_id;
  const orgId = session?.organization_id;

  const { data: entitlements, isLoading } = useQuery({
    queryKey: ['partner-entitlements', partnerId],
    queryFn: async () => {
      if (!partnerId || !orgId) return [];
      const { data, error } = await supabase
        .from('partner_entitlements')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('organization_id', orgId)
        .order('valid_from', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && !!orgId,
  });

  const activeEntitlements = entitlements?.filter(e => !e.valid_until || new Date(e.valid_until) > new Date()) || [];
  const expiredEntitlements = entitlements?.filter(e => e.valid_until && new Date(e.valid_until) <= new Date()) || [];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Recursos & Benefícios</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
          </div>
        ) : activeEntitlements.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold text-muted-foreground">Benefícios Ativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeEntitlements.map((ent) => {
                const Icon = ENTITLEMENT_ICONS[ent.entitlement_type] || Gift;
                const value = ent.value as Record<string, unknown>;
                return (
                  <Card key={ent.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {ENTITLEMENT_LABELS[ent.entitlement_type] || ent.entitlement_type}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Badge variant="default">Ativo</Badge>
                      {value?.description && (
                        <p className="text-sm text-muted-foreground">{String(value.description)}</p>
                      )}
                      {value?.percentage && (
                        <p className="text-lg font-bold">{String(value.percentage)}% de desconto</p>
                      )}
                      {value?.hours && (
                        <p className="text-lg font-bold">{String(value.hours)}h disponíveis</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span>Desde {format(new Date(ent.valid_from), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        {ent.valid_until && (
                          <span> · Até {format(new Date(ent.valid_until), 'dd/MM/yyyy', { locale: ptBR })}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {expiredEntitlements.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-muted-foreground mt-8">Expirados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                  {expiredEntitlements.map((ent) => {
                    const Icon = ENTITLEMENT_ICONS[ent.entitlement_type] || Gift;
                    return (
                      <Card key={ent.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Icon className="h-5 w-5" />
                            {ENTITLEMENT_LABELS[ent.entitlement_type] || ent.entitlement_type}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline">Expirado</Badge>
                          {ent.valid_until && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Expirou em {format(new Date(ent.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3" />
              <p className="text-lg font-medium">Nenhum benefício disponível</p>
              <p className="text-sm mt-1">Materiais de apoio, playbooks e treinamentos serão disponibilizados conforme seu nível de parceria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerLayout>
  );
}
