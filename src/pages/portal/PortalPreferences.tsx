import { PortalLayout } from './PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from '@/components/icons';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect } from 'react';

function getPortalSession() {
  try {
    const session = localStorage.getItem('portal_session');
    return session ? JSON.parse(session) : null;
  } catch { return null; }
}

interface ChannelPrefs {
  [key: string]: string;
  email: string;
  sms: string;
  whatsapp: string;
  push: string;
}

export default function PortalPreferences() {
  const session = getPortalSession();
  const contactId = session?.contact_id;
  const orgId = session?.organization_id;
  const queryClient = useQueryClient();

  const [channels, setChannels] = useState<ChannelPrefs>({
    email: 'opt_in',
    sms: 'opt_in',
    whatsapp: 'opt_in',
    push: 'opt_in',
  });
  const [frequency, setFrequency] = useState('normal');
  const [globalOptout, setGlobalOptout] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['portal-preferences', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await supabase
        .from('contact_preferences')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  useEffect(() => {
    if (preferences) {
      const cp = preferences.channel_preferences as Record<string, string> | null;
      if (cp) {
        setChannels({
          email: cp.email || 'opt_in',
          sms: cp.sms || 'opt_in',
          whatsapp: cp.whatsapp || 'opt_in',
          push: cp.push || 'opt_in',
        });
      }
      setFrequency(preferences.frequency_limit || 'normal');
      setGlobalOptout(preferences.global_optout || false);
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!contactId) throw new Error('Sessão inválida');
      
      const payload = {
        contact_id: contactId,
        channel_preferences: channels as unknown,
        frequency_limit: frequency,
        global_optout: globalOptout,
        updated_at: new Date().toISOString(),
        updated_source: 'portal',
      };

      if (preferences?.id) {
        const { error } = await supabase
          .from('contact_preferences')
          .update(payload)
          .eq('id', preferences.id);
        if (error) throw error;
      } else {
        // Need organization_id for insert - get from session
        const { error } = await supabase
          .from('contact_preferences')
          .insert({ ...payload, organization_id: orgId } as unknown);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-preferences'] });
      toast.success('Preferências salvas com sucesso!');
    },
    onError: (err) => toast.error(`Erro ao salvar: ${err.message}`),
  });

  const toggleChannel = (channel: keyof ChannelPrefs) => {
    setChannels(prev => ({
      ...prev,
      [channel]: prev[channel] === 'opt_in' ? 'opt_out' : 'opt_in',
    }));
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Preferências de Comunicação</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        ) : (
          <>
            {/* Global Opt-out */}
            <Card>
              <CardHeader><CardTitle>Opt-out Global</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Desativar todas as comunicações</Label>
                    <p className="text-sm text-muted-foreground">Ao ativar, você não receberá nenhuma comunicação de marketing.</p>
                  </div>
                  <Switch checked={globalOptout} onCheckedChange={setGlobalOptout} />
                </div>
              </CardContent>
            </Card>

            {/* Channel Preferences */}
            <Card>
              <CardHeader><CardTitle>Canais de Comunicação</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email</Label>
                  <Switch
                    checked={channels.email === 'opt_in'}
                    onCheckedChange={() => toggleChannel('email')}
                    disabled={globalOptout}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SMS</Label>
                  <Switch
                    checked={channels.sms === 'opt_in'}
                    onCheckedChange={() => toggleChannel('sms')}
                    disabled={globalOptout}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>WhatsApp</Label>
                  <Switch
                    checked={channels.whatsapp === 'opt_in'}
                    onCheckedChange={() => toggleChannel('whatsapp')}
                    disabled={globalOptout}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Push Notifications</Label>
                  <Switch
                    checked={channels.push === 'opt_in'}
                    onCheckedChange={() => toggleChannel('push')}
                    disabled={globalOptout}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Frequency */}
            <Card>
              <CardHeader><CardTitle>Frequência</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Limite de frequência</Label>
                  <Select value={frequency} onValueChange={setFrequency} disabled={globalOptout}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa (máx. 1x/semana)</SelectItem>
                      <SelectItem value="normal">Normal (máx. 3x/semana)</SelectItem>
                      <SelectItem value="high">Alta (sem limite)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* General */}
            <Card>
              <CardHeader><CardTitle>Configurações Gerais</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select defaultValue="pt-BR">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (BR)</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select defaultValue="America/Sao_Paulo">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Preferências
            </Button>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
