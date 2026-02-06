import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Bot, Brain, Shield, Gauge, Cpu, Zap,
  AlertTriangle, CheckCircle, Settings, Loader2,
  TrendingUp, Clock, Lock
} from 'lucide-react';

const AI_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', tier: 'standard', speed: 'fast' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'standard', speed: 'fast' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', tier: 'economy', speed: 'fastest' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'premium', speed: 'slow' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro (Preview)', tier: 'premium', speed: 'moderate' },
  { id: 'openai/gpt-5', name: 'GPT-5', tier: 'premium', speed: 'slow' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', tier: 'standard', speed: 'fast' },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', tier: 'economy', speed: 'fastest' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', tier: 'premium', speed: 'moderate' },
];

const NATIVE_AGENTS = [
  { type: 'sales', name: 'Sales Agent', description: 'Qualificação de leads, próximas ações, cadências', icon: TrendingUp },
  { type: 'service', name: 'Service Agent', description: 'Triagem omnichannel, KB search, ticket management', icon: Bot },
  { type: 'marketing', name: 'Marketing Agent', description: 'Campanhas, segmentação, A/B testing', icon: Zap },
  { type: 'commerce', name: 'Commerce Agent', description: 'Rastreamento de pedidos, devoluções, pagamentos', icon: Cpu },
  { type: 'itsm', name: 'ITSM Agent', description: 'Triagem de incidentes, CMDB, workarounds', icon: Settings },
  { type: 'data_steward', name: 'Data Steward Agent', description: 'Detecção de duplicatas, merge, qualidade', icon: Brain },
  { type: 'compliance', name: 'Compliance Agent', description: 'Processamento LGPD, consentimento, retenção', icon: Shield },
];

export default function PlatformAI() {
  const { profile } = useAuth();
  const { getModuleInfo } = useModuleAccess('ai_agents');
  const organizationId = profile?.organization_id;

  const [globalConfig, setGlobalConfig] = useState({
    defaultModel: 'google/gemini-3-flash-preview',
    maxTokensPerRequest: 4096,
    maxRequestsPerMinute: 30,
    maxRequestsPerDay: 1000,
    piiMaskingEnabled: true,
    auditAllRuns: true,
    requireApprovalForCritical: true,
    allowCustomAgents: true,
  });

  const [agentLimits, setAgentLimits] = useState({
    maxAgentsPerOrg: 20,
    maxToolsPerAgent: 10,
    maxRunsPerHour: 100,
    maxConcurrentRuns: 5,
  });

  const moduleInfo = getModuleInfo('ai_agents');

  const handleSaveConfig = () => {
    toast.success('Configuração de IA atualizada');
  };

  const handleSaveLimits = () => {
    toast.success('Limites de IA atualizados');
  };

  const selectedModel = AI_MODELS.find(m => m.id === globalConfig.defaultModel);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuração de IA</h1>
            <p className="text-muted-foreground mt-1">
              Configure modelos, limites e políticas globais de Inteligência Artificial
            </p>
          </div>
          {moduleInfo ? (
            <Badge variant="default" className="text-sm">
              <CheckCircle className="h-4 w-4 mr-1" />
              Módulo IA Habilitado
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Módulo IA Desabilitado
            </Badge>
          )}
        </div>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuração Global
            </TabsTrigger>
            <TabsTrigger value="limits">
              <Gauge className="h-4 w-4 mr-2" />
              Limites & Quotas
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="h-4 w-4 mr-2" />
              Agentes Nativos
            </TabsTrigger>
          </TabsList>

          {/* Global Configuration */}
          <TabsContent value="config">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Modelo Padrão
                  </CardTitle>
                  <CardDescription>
                    Modelo de IA utilizado por padrão nos agentes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Select
                      value={globalConfig.defaultModel}
                      onValueChange={(v) => setGlobalConfig(p => ({ ...p, defaultModel: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_MODELS.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <span>{model.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {model.tier}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedModel && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{selectedModel.tier}</Badge>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {selectedModel.speed}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max tokens por requisição</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min={256}
                      max={32768}
                      value={globalConfig.maxTokensPerRequest}
                      onChange={(e) => setGlobalConfig(p => ({ ...p, maxTokensPerRequest: parseInt(e.target.value) || 4096 }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Governança & Segurança
                  </CardTitle>
                  <CardDescription>
                    Políticas de segurança para execuções de IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Masking de PII</Label>
                      <p className="text-xs text-muted-foreground">
                        Mascarar dados pessoais nos prompts e logs
                      </p>
                    </div>
                    <Switch
                      checked={globalConfig.piiMaskingEnabled}
                      onCheckedChange={(v) => setGlobalConfig(p => ({ ...p, piiMaskingEnabled: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auditar todas as execuções</Label>
                      <p className="text-xs text-muted-foreground">
                        Gerar comprovantes de auditoria para cada run
                      </p>
                    </div>
                    <Switch
                      checked={globalConfig.auditAllRuns}
                      onCheckedChange={(v) => setGlobalConfig(p => ({ ...p, auditAllRuns: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Aprovação para ações críticas</Label>
                      <p className="text-xs text-muted-foreground">
                        Human-in-the-loop para ações de risco alto/crítico
                      </p>
                    </div>
                    <Switch
                      checked={globalConfig.requireApprovalForCritical}
                      onCheckedChange={(v) => setGlobalConfig(p => ({ ...p, requireApprovalForCritical: v }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Permitir agentes customizados</Label>
                      <p className="text-xs text-muted-foreground">
                        Permitir criação de agentes além dos nativos
                      </p>
                    </div>
                    <Switch
                      checked={globalConfig.allowCustomAgents}
                      onCheckedChange={(v) => setGlobalConfig(p => ({ ...p, allowCustomAgents: v }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={handleSaveConfig}>
                <Settings className="h-4 w-4 mr-2" />
                Salvar Configuração
              </Button>
            </div>
          </TabsContent>

          {/* Limits & Quotas */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Limites e Quotas
                </CardTitle>
                <CardDescription>
                  Configure limites de uso para evitar consumo excessivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ratePerMin">Requisições por minuto (rate limit)</Label>
                    <Input
                      id="ratePerMin"
                      type="number"
                      min={1}
                      max={100}
                      value={globalConfig.maxRequestsPerMinute}
                      onChange={(e) => setGlobalConfig(p => ({ ...p, maxRequestsPerMinute: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ratePerDay">Requisições por dia</Label>
                    <Input
                      id="ratePerDay"
                      type="number"
                      min={10}
                      max={100000}
                      value={globalConfig.maxRequestsPerDay}
                      onChange={(e) => setGlobalConfig(p => ({ ...p, maxRequestsPerDay: parseInt(e.target.value) || 1000 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAgents">Agentes máximos por organização</Label>
                    <Input
                      id="maxAgents"
                      type="number"
                      min={1}
                      max={100}
                      value={agentLimits.maxAgentsPerOrg}
                      onChange={(e) => setAgentLimits(p => ({ ...p, maxAgentsPerOrg: parseInt(e.target.value) || 20 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTools">Ferramentas por agente</Label>
                    <Input
                      id="maxTools"
                      type="number"
                      min={1}
                      max={50}
                      value={agentLimits.maxToolsPerAgent}
                      onChange={(e) => setAgentLimits(p => ({ ...p, maxToolsPerAgent: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRuns">Execuções máximas por hora</Label>
                    <Input
                      id="maxRuns"
                      type="number"
                      min={1}
                      max={1000}
                      value={agentLimits.maxRunsPerHour}
                      onChange={(e) => setAgentLimits(p => ({ ...p, maxRunsPerHour: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrent">Execuções simultâneas</Label>
                    <Input
                      id="maxConcurrent"
                      type="number"
                      min={1}
                      max={20}
                      value={agentLimits.maxConcurrentRuns}
                      onChange={(e) => setAgentLimits(p => ({ ...p, maxConcurrentRuns: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                </div>

                {/* Usage from module info */}
                {moduleInfo && moduleInfo.usage && Object.keys(moduleInfo.usage).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Uso Atual</h4>
                      <div className="grid gap-3 md:grid-cols-3">
                        {Object.entries(moduleInfo.usage).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-lg border">
                            <p className="text-sm text-muted-foreground">{key}</p>
                            <p className="text-xl font-bold">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSaveLimits}>
                    <Gauge className="h-4 w-4 mr-2" />
                    Salvar Limites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Native Agents */}
          <TabsContent value="agents">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agentes Nativos Pré-configurados</CardTitle>
                  <CardDescription>
                    Agentes de IA especializados disponíveis para ativação
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {NATIVE_AGENTS.map(agent => {
                  const Icon = agent.icon;
                  return (
                    <Card key={agent.type}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{agent.name}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {agent.type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{agent.description}</CardDescription>
                        <div className="mt-3 flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Governança
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Auditoria
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
