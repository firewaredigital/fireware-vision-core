import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Bot, Brain, Save, Loader2 } from '@/components/icons';

const AI_MODELS = [
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', speed: 'Rápido', tier: 'Standard' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', speed: 'Rápido', tier: 'Standard' },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', speed: 'Ultra-rápido', tier: 'Economy' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', speed: 'Lento', tier: 'Premium' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', speed: 'Rápido', tier: 'Standard' },
  { id: 'openai/gpt-5', name: 'GPT-5', speed: 'Lento', tier: 'Premium' },
];

const AGENT_TYPES = [
  { value: 'sales', label: 'Vendas' },
  { value: 'service', label: 'Atendimento' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'itsm', label: 'ITSM' },
  { value: 'data_steward', label: 'Data Steward' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'custom', label: 'Customizado' },
];

export default function AIAgentForm() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    agent_type: 'custom' as string,
    system_prompt: '',
    model: 'google/gemini-3-flash-preview',
    temperature: 0.7,
    max_tokens: 4096,
    max_turns: 10,
    timeout_seconds: 120,
    scope: '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome do agente é obrigatório');
      return;
    }
    if (!profile?.organization_id) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          organization_id: profile.organization_id,
          name: form.name,
          description: form.description || null,
          agent_type: form.agent_type as unknown,
          system_prompt: form.system_prompt || null,
          model_config: {
            model: form.model,
            temperature: form.temperature,
            max_tokens: form.max_tokens,
          },
          max_turns: form.max_turns,
          timeout_seconds: form.timeout_seconds,
          scope: form.scope || null,
          status: 'draft',
          created_by: profile.id,
          updated_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Agente criado com sucesso');
      navigate(`/ai/agents/${data.id}`);
    } catch (err: unknown) {
      toast.error('Erro ao criar agente: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ai/agents')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Novo Agente</h1>
            <p className="text-muted-foreground mt-1">Configure um novo agente de IA</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Sales Agent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descrição</Label>
                <Textarea id="desc" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="O que este agente faz?" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.agent_type} onValueChange={(v) => setForm(p => ({ ...p, agent_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scope">Escopo (módulos)</Label>
                <Input id="scope" value={form.scope} onChange={(e) => setForm(p => ({ ...p, scope: e.target.value }))} placeholder="Ex: sales, service" />
              </div>
            </CardContent>
          </Card>

          {/* Model Config */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configuração do Modelo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={form.model} onValueChange={(v) => setForm(p => ({ ...p, model: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.speed})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp">Temperatura ({form.temperature})</Label>
                <input type="range" id="temp" min="0" max="1" step="0.1" value={form.temperature} onChange={(e) => setForm(p => ({ ...p, temperature: parseFloat(e.target.value) }))} className="w-full" />
                <p className="text-xs text-muted-foreground">0 = Determinístico, 1 = Criativo</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input id="maxTokens" type="number" min={256} max={32768} value={form.max_tokens} onChange={(e) => setForm(p => ({ ...p, max_tokens: parseInt(e.target.value) || 4096 }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="turns">Max Turnos</Label>
                  <Input id="turns" type="number" min={1} max={50} value={form.max_turns} onChange={(e) => setForm(p => ({ ...p, max_turns: parseInt(e.target.value) || 10 }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (s)</Label>
                  <Input id="timeout" type="number" min={10} max={600} value={form.timeout_seconds} onChange={(e) => setForm(p => ({ ...p, timeout_seconds: parseInt(e.target.value) || 120 }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>Instrução principal que define o comportamento do agente</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.system_prompt}
              onChange={(e) => setForm(p => ({ ...p, system_prompt: e.target.value }))}
              placeholder="Você é um assistente especializado em... Suas responsabilidades incluem..."
              rows={10}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/ai/agents')}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Criar Agente
          </Button>
        </div>
      </div>
    </>
  );
}
