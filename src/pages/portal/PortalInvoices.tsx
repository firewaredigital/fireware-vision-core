import { PortalLayout } from './PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function PortalInvoices() {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Faturas & Pagamentos</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3" /><p>Nenhuma fatura encontrada.</p></CardContent></Card>
      </div>
    </PortalLayout>
  );
}
