import { PortalLayout } from './PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

export default function PortalReturns() {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Devoluções</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground"><RotateCcw className="h-12 w-12 mx-auto mb-3" /><p>Nenhuma devolução em andamento.</p></CardContent></Card>
      </div>
    </PortalLayout>
  );
}
