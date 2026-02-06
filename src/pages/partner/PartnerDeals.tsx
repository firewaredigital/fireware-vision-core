import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PartnerDeals() {
  const navigate = useNavigate();
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Deals & Indicações</h1>
          <Button className="gap-2" onClick={() => navigate('/partner/deals/new')}><Plus className="h-4 w-4" /> Nova Indicação</Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Handshake className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-medium">Nenhum deal registrado</p>
            <p className="text-sm mt-1">Registre indicações de leads para iniciar o processo de comissão.</p>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
