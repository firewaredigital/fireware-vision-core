import { useState, useEffect , useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Calendar,
  Mail,
  MessageSquare,
  Users,
  Target,
  Eye,
  Clock,
  RefreshCw,
  Plus,
  Trash2,
  Settings,
  FileText,
  Link,
  Megaphone,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Segment {
  id: string;
  name: string;
  member_count: number;
}

interface CampaignForm {
  name: string;
  description: string;
  type: string;
  subject: string;
  preview_text: string;
  content: string;
  content_html: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  segment_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  scheduled_at: string;
  is_ab_test: boolean;
}

const initialForm: CampaignForm = {
  name: '',
  description: '',
  type: 'email',
  subject: '',
  preview_text: '',
  content: '',
  content_html: '',
  from_name: '',
  from_email: '',
  reply_to: '',
  segment_id: '',
  utm_source: '',
  utm_medium: 'email',
  utm_campaign: '',
  utm_content: '',
  scheduled_at: '',
  is_ab_test: false,
};

const campaignTypes = [
  { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { value: 'sms', label: 'SMS', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'push', label: 'Push Notification', icon: <Megaphone className="h-4 w-4" /> },
];

export default function CampaignForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<CampaignForm>(initialForm);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(id);

  

  const fetchSegments = useCallback(async () => {
    if (!profile?.organization_id) return;

    const { data } = await supabase
      .from('segments')
      .select('id, name, member_count')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('name');

    if (data) {
      setSegments(data);
    }
  }, [profile?.id, profile.organization_id]);

  const fetchCampaign = useCallback( async () => {
    if (!id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Campanha não encontrada',
      });
      navigate('/marketing');
      return;
    }

    setForm({
      name: data.name || '',
      description: data.description || '',
      type: data.type || 'email',
      subject: data.subject || '',
      preview_text: data.preview_text || '',
      content: data.content || '',
      content_html: data.content_html || '',
      from_name: data.from_name || '',
      from_email: data.from_email || '',
      reply_to: data.reply_to || '',
      segment_id: data.segment_id || '',
      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || 'email',
      utm_campaign: data.utm_campaign || '',
      utm_content: data.utm_content || '',
      scheduled_at: data.scheduled_at ? data.scheduled_at.slice(0, 16) : '',
      is_ab_test: data.is_ab_test || false,
    });
    setLoading(false);
  }, [id, toast, navigate]);

  useEffect(() => {
    fetchSegments();
    if (id) {
      fetchCampaign();
    }
  }, [id, fetchCampaign, fetchSegments]);

  const handleSave = async (asDraft = true) => {
    if (!profile?.organization_id || !form.name) return;

    setSaving(true);

    const campaignData = {
      name: form.name,
      description: form.description || null,
      type: form.type as unknown,
      subject: form.subject || null,
      preview_text: form.preview_text || null,
      content: form.content || null,
      content_html: form.content_html || null,
      from_name: form.from_name || null,
      from_email: form.from_email || null,
      reply_to: form.reply_to || null,
      segment_id: form.segment_id || null,
      utm_source: form.utm_source || null,
      utm_medium: form.utm_medium || null,
      utm_campaign: form.utm_campaign || form.name,
      utm_content: form.utm_content || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      is_ab_test: form.is_ab_test,
      status: (asDraft ? 'draft' : (form.scheduled_at ? 'scheduled' : 'draft')) as unknown,
      organization_id: profile.organization_id,
      created_by: profile.id,
    };

    let error;
    if (id) {
      const result = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', id);
      error = result.error;
    } else {
      const result = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        navigate(`/marketing/campaigns/${result.data.id}`);
      }
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar campanha',
      });
    } else {
      toast({
        title: 'Campanha salva',
        description: `"${form.name}" foi ${asDraft ? 'salva como rascunho' : 'agendada'}.`,
      });
    }

    setSaving(false);
  };

  const selectedSegment = segments.find(s => s.id === form.segment_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/marketing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
            </h1>
            <p className="text-muted-foreground">
              Configure os detalhes da sua campanha de marketing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(true)} disabled={saving || !form.name}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave(false)} disabled={saving || !form.name || !form.segment_id}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {form.scheduled_at ? 'Agendar' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="audience">Audiência</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome da Campanha *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex: Newsletter Março 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={form.type}
                        onValueChange={(v) => setForm({ ...form, type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {campaignTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                {type.icon}
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descrição interna da campanha..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {form.type === 'email' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Conteúdo do Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Assunto *</Label>
                      <Input
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder="Ex: Confira as novidades deste mês!"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texto de Preview</Label>
                      <Input
                        value={form.preview_text}
                        onChange={(e) => setForm({ ...form, preview_text: e.target.value })}
                        placeholder="Texto exibido junto ao assunto na caixa de entrada"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder="Escreva o conteúdo do email aqui..."
                        rows={10}
                      />
                      <p className="text-sm text-muted-foreground">
                        Use {"{{nome}}"}, {"{{empresa}}"} para personalização
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {form.type === 'sms' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Conteúdo do SMS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder="Escreva sua mensagem SMS..."
                        rows={4}
                        maxLength={160}
                      />
                      <p className="text-sm text-muted-foreground">
                        {form.content.length}/160 caracteres
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Agendamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data e Hora</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduled_at}
                      onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Deixe vazio para enviar manualmente
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audiência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Segmento</Label>
                    <Select
                      value={form.segment_id}
                      onValueChange={(v) => setForm({ ...form, segment_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map((segment) => (
                          <SelectItem key={segment.id} value={segment.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{segment.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {segment.member_count.toLocaleString()}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedSegment && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedSegment.member_count.toLocaleString()}</span>
                      <span className="text-muted-foreground">destinatários</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Teste A/B</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Ativar Teste A/B</p>
                      <p className="text-sm text-muted-foreground">
                        Teste diferentes versões
                      </p>
                    </div>
                    <Switch
                      checked={form.is_ab_test}
                      onCheckedChange={(checked) => setForm({ ...form, is_ab_test: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Audiência</CardTitle>
              <CardDescription>
                Escolha quem receberá esta campanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {segments.map((segment) => (
                  <Card
                    key={segment.id}
                    className={`cursor-pointer transition-colors ${
                      form.segment_id === segment.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setForm({ ...form, segment_id: segment.id })}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {segment.member_count.toLocaleString()} contatos
                          </p>
                        </div>
                        {form.segment_id === segment.id && (
                          <Badge>Selecionado</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {form.type === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome do Remetente</Label>
                    <Input
                      value={form.from_name}
                      onChange={(e) => setForm({ ...form, from_name: e.target.value })}
                      placeholder="Ex: Equipe Marketing"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email do Remetente</Label>
                    <Input
                      type="email"
                      value={form.from_email}
                      onChange={(e) => setForm({ ...form, from_email: e.target.value })}
                      placeholder="Ex: marketing@empresa.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Responder Para</Label>
                  <Input
                    type="email"
                    value={form.reply_to}
                    onChange={(e) => setForm({ ...form, reply_to: e.target.value })}
                    placeholder="Ex: contato@empresa.com"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros UTM</CardTitle>
              <CardDescription>
                Configure os parâmetros de rastreamento para análise de campanhas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>UTM Source</Label>
                  <Input
                    value={form.utm_source}
                    onChange={(e) => setForm({ ...form, utm_source: e.target.value })}
                    placeholder="Ex: newsletter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UTM Medium</Label>
                  <Input
                    value={form.utm_medium}
                    onChange={(e) => setForm({ ...form, utm_medium: e.target.value })}
                    placeholder="Ex: email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UTM Campaign</Label>
                  <Input
                    value={form.utm_campaign}
                    onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })}
                    placeholder="Ex: promo_marco_2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>UTM Content</Label>
                  <Input
                    value={form.utm_content}
                    onChange={(e) => setForm({ ...form, utm_content: e.target.value })}
                    placeholder="Ex: cta_principal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
