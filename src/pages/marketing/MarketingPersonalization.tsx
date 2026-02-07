import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2 } from '@/components/icons';

export default function MarketingPersonalization() {
  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Personalização</h1>
          <p className="text-muted-foreground mt-1">Regras de conteúdo dinâmico e personalização</p>
        </div>
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
