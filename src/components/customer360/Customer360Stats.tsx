import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Target, TrendingUp, Ticket, ShoppingCart, MessageSquare, FileSignature } from '@/components/icons';

interface Customer360StatsProps {
  metrics: {
    totalRevenue: number;
    openPipeline: number;
    winRate: string | number;
    openTickets: number;
    totalOrders: number;
    orderValue: number;
    activeContracts: number;
    totalConversations: number;
  };
}

export function Customer360Stats({ metrics }: Customer360StatsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(value);

  const stats = [
    { icon: DollarSign, label: 'Receita Total', value: formatCurrency(metrics.totalRevenue), color: 'text-green-500' },
    { icon: Target, label: 'Pipeline Aberto', value: formatCurrency(metrics.openPipeline), color: 'text-amber-500' },
    { icon: TrendingUp, label: 'Win Rate', value: `${metrics.winRate}%`, color: 'text-blue-500' },
    { icon: Ticket, label: 'Tickets Abertos', value: String(metrics.openTickets), color: 'text-purple-500' },
    { icon: ShoppingCart, label: 'Pedidos', value: String(metrics.totalOrders), color: 'text-green-500' },
    { icon: FileSignature, label: 'Contratos Ativos', value: String(metrics.activeContracts), color: 'text-indigo-500' },
    { icon: MessageSquare, label: 'Conversas', value: String(metrics.totalConversations), color: 'text-cyan-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
