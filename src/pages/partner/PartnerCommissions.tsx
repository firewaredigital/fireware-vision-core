import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function PartnerCommissions() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Comissões</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground"><DollarSign className="h-12 w-12 mx-auto mb-3" /><p>Nenhuma comissão registrada.</p></CardContent></Card>
      </div>
    </PartnerLayout>
  );
}
