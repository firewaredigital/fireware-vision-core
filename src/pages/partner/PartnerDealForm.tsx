import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerDealForm() {
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Indicação registrada com sucesso!');
    navigate('/partner/deals');
  };

  return (
    <PartnerLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/partner/deals')}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-3xl font-bold">Nova Indicação</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Tipo de Deal</Label>
                <Select defaultValue="lead_referral"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lead_referral">Indicação de Lead</SelectItem><SelectItem value="co_sell">Co-Sell</SelectItem><SelectItem value="resale">Revenda</SelectItem></SelectContent></Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome do Contato</Label><Input placeholder="Nome completo" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@empresa.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Empresa</Label><Input placeholder="Nome da empresa" /></div>
                <div className="space-y-2"><Label>Valor Estimado (R$)</Label><Input type="number" placeholder="0.00" /></div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Descreva o contexto da indicação..." /></div>
              <div className="flex gap-3 pt-2"><Button type="submit">Registrar Indicação</Button><Button type="button" variant="outline" onClick={() => navigate('/partner/deals')}>Cancelar</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
