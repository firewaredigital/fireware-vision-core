import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, RotateCcw, Tag, DollarSign } from '@/components/icons';

export default function CommerceDashboard() {
  const stats = [
    { title: 'Pedidos Hoje', value: '47', icon: ShoppingCart, change: '+12%' },
    { title: 'Receita Mensal', value: 'R$ 284.500', icon: DollarSign, change: '+8%' },
    { title: 'Devoluções', value: '3', icon: RotateCcw, change: '-25%' },
    { title: 'Promoções Ativas', value: '5', icon: Tag, change: '0%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commerce Dashboard</h1>
        <p className="text-muted-foreground">Visão geral de pedidos, receita e promoções</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change} vs mês anterior</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
