import { PartnerLayout } from './PartnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export default function PartnerResources() {
  return (
    <PartnerLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Recursos & Materiais</h1>
        <Card><CardContent className="p-12 text-center text-muted-foreground"><BookOpen className="h-12 w-12 mx-auto mb-3" /><p>Materiais de apoio, playbooks e treinamentos serão disponibilizados aqui.</p></CardContent></Card>
      </div>
    </PartnerLayout>
  );
}
