import { PortalLayout } from './PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart } from 'lucide-react';

export default function PortalOrders() {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meus Pedidos</h1>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm mt-1">Seus pedidos aparecerão aqui assim que forem realizados.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
}
