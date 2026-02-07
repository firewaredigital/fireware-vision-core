import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from '@/components/icons';
import { ModuleHeroBanner } from '@/components/ModuleHeroBanner';

export default function MarketingPersonalization() {
  return (
    <div className="space-y-6">
        <ModuleHeroBanner
          module="marketing"
          title="Personalização"
          subtitle="Regras de conteúdo dinâmico e personalização"
          compact
        />
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Wand2 className="h-12 w-12 mx-auto mb-3" />
            <p className="text-lg font-medium">Motor de Personalização</p>
            <p className="text-sm mt-2">Configure regras de conteúdo dinâmico baseado em segmentos, comportamento e dados do Data Hub para entregar experiências personalizadas em todos os canais.</p>
          </CardContent>
        </Card>
    </div>
  );
}
