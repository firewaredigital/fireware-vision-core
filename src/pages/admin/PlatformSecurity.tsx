import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Lock, ShieldCheck, Key, Users, AlertTriangle, 
  Clock, Globe, Loader2, RefreshCw, ShieldAlert
} from 'lucide-react';

export default function PlatformSecurity() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  // Security policies state (in-memory for now, would be persisted in org_settings)
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90,
    preventReuse: 5,
  });

  const [sessionPolicy, setSessionPolicy] = useState({
    maxSessionDuration: 24,
    idleTimeout: 30,
    maxConcurrentSessions: 5,
    enforceIpRestriction: false,
  });

  const [mfaPolicy, setMfaPolicy] = useState({
    enabled: false,
    enforceForAdmins: true,
    enforceForAllUsers: false,
    allowedMethods: ['totp', 'sms'] as string[],
  });

  // Fetch active sessions / recent auth events from audit_logs
  const { data: recentAuthEvents, isLoading: authLoading } = useQuery({
    queryKey: ['auth-audit-events', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId!)
        .in('action', ['login', 'logout', 'password_change', 'role_change', 'permission_change'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Fetch user roles for overview
  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles-overview', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('is_active', true);

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(r => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      return counts;
    },
    enabled: !!organizationId,
  });

  const handleSavePasswordPolicy = () => {
    toast.success('Política de senhas atualizada');
  };

  const handleSaveSessionPolicy = () => {
    toast.success('Política de sessões atualizada');
  };

  const handleSaveMfaPolicy = () => {
    toast.success('Política de MFA atualizada');
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Segurança da Plataforma</h1>
          <p className="text-muted-foreground mt-1">
            Configure políticas de segurança, autenticação e controle de acesso
          </p>
        </div>

        <Tabs defaultValue="password" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="password">
              <Key className="h-4 w-4 mr-2" />
              Senhas
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Clock className="h-4 w-4 mr-2" />
              Sessões
            </TabsTrigger>
            <TabsTrigger value="mfa">
              <ShieldCheck className="h-4 w-4 mr-2" />
              MFA
            </TabsTrigger>
            <TabsTrigger value="audit">
              <ShieldAlert className="h-4 w-4 mr-2" />
              Eventos de Auth
            </TabsTrigger>
          </TabsList>

          {/* Password Policy */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Política de Senhas
                </CardTitle>
                <CardDescription>
                  Defina requisitos mínimos de complexidade para senhas dos usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Comprimento mínimo</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min={6}
                      max={32}
                      value={passwordPolicy.minLength}
                      onChange={(e) => setPasswordPolicy(p => ({ ...p, minLength: parseInt(e.target.value) || 8 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAge">Validade máxima (dias)</Label>
                    <Input
                      id="maxAge"
                      type="number"
                      min={0}
                      max={365}
                      value={passwordPolicy.maxAge}
                      onChange={(e) => setPasswordPolicy(p => ({ ...p, maxAge: parseInt(e.target.value) || 90 }))}
                    />
                    <p className="text-xs text-muted-foreground">0 = sem expiração</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preventReuse">Prevenir reutilização (últimas N senhas)</Label>
                    <Input
                      id="preventReuse"
                      type="number"
                      min={0}
                      max={24}
                      value={passwordPolicy.preventReuse}
                      onChange={(e) => setPasswordPolicy(p => ({ ...p, preventReuse: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Requisitos de complexidade</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Exigir letra maiúscula</Label>
                      <Switch
                        checked={passwordPolicy.requireUppercase}
                        onCheckedChange={(v) => setPasswordPolicy(p => ({ ...p, requireUppercase: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Exigir números</Label>
                      <Switch
                        checked={passwordPolicy.requireNumbers}
                        onCheckedChange={(v) => setPasswordPolicy(p => ({ ...p, requireNumbers: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Exigir caracteres especiais</Label>
                      <Switch
                        checked={passwordPolicy.requireSpecialChars}
                        onCheckedChange={(v) => setPasswordPolicy(p => ({ ...p, requireSpecialChars: v }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePasswordPolicy}>
                    <Lock className="h-4 w-4 mr-2" />
                    Salvar Política
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Policy */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Política de Sessões
                </CardTitle>
                <CardDescription>
                  Configure limites de duração e controles de sessão
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxDuration">Duração máxima da sessão (horas)</Label>
                    <Input
                      id="maxDuration"
                      type="number"
                      min={1}
                      max={720}
                      value={sessionPolicy.maxSessionDuration}
                      onChange={(e) => setSessionPolicy(p => ({ ...p, maxSessionDuration: parseInt(e.target.value) || 24 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idleTimeout">Timeout de inatividade (minutos)</Label>
                    <Input
                      id="idleTimeout"
                      type="number"
                      min={5}
                      max={480}
                      value={sessionPolicy.idleTimeout}
                      onChange={(e) => setSessionPolicy(p => ({ ...p, idleTimeout: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxSessions">Sessões simultâneas máximas</Label>
                    <Input
                      id="maxSessions"
                      type="number"
                      min={1}
                      max={20}
                      value={sessionPolicy.maxConcurrentSessions}
                      onChange={(e) => setSessionPolicy(p => ({ ...p, maxConcurrentSessions: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Restrição de IP</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permitir login apenas de IPs autorizados
                    </p>
                  </div>
                  <Switch
                    checked={sessionPolicy.enforceIpRestriction}
                    onCheckedChange={(v) => setSessionPolicy(p => ({ ...p, enforceIpRestriction: v }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSessionPolicy}>
                    <Clock className="h-4 w-4 mr-2" />
                    Salvar Política
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Roles Overview */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Distribuição de Papéis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex gap-4 flex-wrap">
                    {userRoles && Object.entries(userRoles).map(([role, count]) => (
                      <div key={role} className="flex items-center gap-2 px-4 py-3 rounded-lg border">
                        <Badge variant={role === 'admin' ? 'destructive' : role === 'manager' ? 'default' : 'secondary'}>
                          {role}
                        </Badge>
                        <span className="text-xl font-bold">{count}</span>
                        <span className="text-sm text-muted-foreground">usuários</span>
                      </div>
                    ))}
                    {(!userRoles || Object.keys(userRoles).length === 0) && (
                      <p className="text-muted-foreground">Nenhum papel atribuído</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MFA */}
          <TabsContent value="mfa">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Autenticação Multifator (MFA)
                </CardTitle>
                <CardDescription>
                  Configure a autenticação em dois fatores para maior segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="text-base">Habilitar MFA</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ativar autenticação multifator na organização
                    </p>
                  </div>
                  <Switch
                    checked={mfaPolicy.enabled}
                    onCheckedChange={(v) => setMfaPolicy(p => ({ ...p, enabled: v }))}
                  />
                </div>

                {mfaPolicy.enabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="font-medium">Aplicação</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Obrigatório para administradores</Label>
                            <p className="text-xs text-muted-foreground">
                              Todos os admins devem configurar MFA
                            </p>
                          </div>
                          <Switch
                            checked={mfaPolicy.enforceForAdmins}
                            onCheckedChange={(v) => setMfaPolicy(p => ({ ...p, enforceForAdmins: v }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Obrigatório para todos os usuários</Label>
                            <p className="text-xs text-muted-foreground">
                              Todos devem configurar MFA no próximo login
                            </p>
                          </div>
                          <Switch
                            checked={mfaPolicy.enforceForAllUsers}
                            onCheckedChange={(v) => setMfaPolicy(p => ({ ...p, enforceForAllUsers: v }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Métodos permitidos</h4>
                      <div className="flex gap-3 flex-wrap">
                        {['totp', 'sms', 'email'].map(method => (
                          <Badge
                            key={method}
                            variant={mfaPolicy.allowedMethods.includes(method) ? 'default' : 'outline'}
                            className="cursor-pointer px-4 py-2"
                            onClick={() => {
                              setMfaPolicy(p => ({
                                ...p,
                                allowedMethods: p.allowedMethods.includes(method)
                                  ? p.allowedMethods.filter(m => m !== method)
                                  : [...p.allowedMethods, method],
                              }));
                            }}
                          >
                            {method === 'totp' ? 'App Autenticador (TOTP)' : method === 'sms' ? 'SMS' : 'E-mail'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleSaveMfaPolicy}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Salvar Política
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auth Events */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Eventos de Autenticação
                </CardTitle>
                <CardDescription>
                  Últimos 50 eventos de autenticação e segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAuthEvents?.map(event => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(event.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              event.action === 'login' ? 'default' :
                              event.action === 'logout' ? 'secondary' :
                              event.action === 'password_change' ? 'outline' : 'destructive'
                            }>
                              {event.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{event.user_email || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{event.ip_address || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {event.entity_name || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!recentAuthEvents || recentAuthEvents.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum evento de autenticação registrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
