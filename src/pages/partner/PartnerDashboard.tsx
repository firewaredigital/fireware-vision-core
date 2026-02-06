import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Handshake, TrendingUp, Clock } from 'lucide-react';

export default function PartnerDashboard() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard do Parceiro</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Handshake className="h-4 w-4" />Deals Ativos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-4 w-4" />Deals Ganhos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">0</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-4 w-4" />Comissões Pendentes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">R$ 0,00</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" />Comissões Pagas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">R$ 0,00</p></CardContent></Card>
        </div>
        <Card><CardContent className="p-12 text-center text-muted-foreground"><p>Bem-vindo ao Portal do Parceiro. Registre indicações e acompanhe suas comissões.</p></CardContent></Card>
      </div>
    </PartnerLayout>
  );
}
