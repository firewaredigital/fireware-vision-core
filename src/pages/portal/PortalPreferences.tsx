import { PortalLayout } from './PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalPreferences() {
  const handleSave = () => toast.success('Preferências salvas com sucesso!');

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Preferências de Comunicação</h1>
        <Card>
          <CardHeader><CardTitle>Canais de Comunicação</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label>Email</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><Label>SMS</Label><Switch /></div>
            <div className="flex items-center justify-between"><Label>WhatsApp</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><Label>Push Notifications</Label><Switch /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Configurações Gerais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Idioma</Label><Select defaultValue="pt-BR"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pt-BR">Português (BR)</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="es">Español</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Fuso Horário</Label><Select defaultValue="America/Sao_Paulo"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem><SelectItem value="America/New_York">New York (EST)</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>
        <Button onClick={handleSave}>Salvar Preferências</Button>
      </div>
    </PortalLayout>
  );
}
