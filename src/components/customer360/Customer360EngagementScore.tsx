import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Customer360EngagementScoreProps {
  opportunities: any[];
  tickets: any[];
  orders: any[];
  activities: any[];
  conversations: number;
  contracts: number;
}

export function Customer360EngagementScore({
  opportunities,
  tickets,
  orders,
  activities,
  conversations,
  contracts,
}: Customer360EngagementScoreProps) {
  // Calculate engagement score based on multiple factors
  const factors = [
    {
      label: 'Oportunidades Ganhas',
      value: opportunities.filter((o) => o.stage === 'closed_won').length,
      weight: 20,
      max: 10,
    },
    {
      label: 'Atividades Recentes',
      value: activities.filter(
        (a) => new Date(a.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length,
      weight: 15,
      max: 20,
    },
    {
      label: 'Pedidos',
      value: orders.length,
      weight: 15,
      max: 10,
    },
    {
      label: 'Contratos Ativos',
      value: contracts,
      weight: 20,
      max: 5,
    },
    {
      label: 'Tickets Resolvidos',
      value: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
      weight: 10,
      max: 10,
    },
    {
      label: 'Conversas',
      value: conversations,
      weight: 10,
      max: 20,
    },
    {
      label: 'Pipeline Ativo',
      value: opportunities.filter((o) => !['closed_won', 'closed_lost'].includes(o.stage)).length,
      weight: 10,
      max: 5,
    },
  ];

  const totalScore = factors.reduce((sum, f) => {
    const normalized = Math.min(f.value / f.max, 1);
    return sum + normalized * f.weight;
  }, 0);

  const roundedScore = Math.round(totalScore);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excelente', variant: 'default' as const, icon: TrendingUp, color: 'text-green-500' };
    if (score >= 60) return { label: 'Bom', variant: 'secondary' as const, icon: TrendingUp, color: 'text-blue-500' };
    if (score >= 40) return { label: 'Moderado', variant: 'outline' as const, icon: Minus, color: 'text-yellow-500' };
    if (score >= 20) return { label: 'Baixo', variant: 'outline' as const, icon: TrendingDown, color: 'text-orange-500' };
    return { label: 'Muito Baixo', variant: 'destructive' as const, icon: TrendingDown, color: 'text-red-500' };
  };

  const scoreInfo = getScoreLabel(roundedScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Score de Engajamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-5xl font-bold ${scoreInfo.color}`}>{roundedScore}</div>
          <Badge variant={scoreInfo.variant} className="mt-2">
            <scoreInfo.icon className="h-3 w-3 mr-1" />
            {scoreInfo.label}
          </Badge>
        </div>

        <div className="space-y-3 pt-4">
          {factors.map((factor) => {
            const normalized = Math.min((factor.value / factor.max) * 100, 100);
            return (
              <div key={factor.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{factor.label}</span>
                  <span className="font-medium">
                    {factor.value} <span className="text-muted-foreground text-xs">/ {factor.max}</span>
                  </span>
                </div>
                <Progress value={normalized} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
