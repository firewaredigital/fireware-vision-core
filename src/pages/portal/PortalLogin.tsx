import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCcw, AlertCircle } from 'lucide-react';

// Schema de validação com Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Formato de email inválido')
    .max(255, 'Email muito longo'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(128, 'Senha muito longa'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Interface para resposta da autenticação
interface AuthResponse {
  user_id: string | null;
  success: boolean;
  message: string;
}

// Interface para resposta da criação de sessão
interface SessionResponse {
  session_id: string;
  session_token: string;
  expires_at: string;
}

export default function PortalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuração do formulário com React Hook Form + Zod
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      // Buscar organization_id a partir do contato vinculado ao email
      // Primeiro, buscamos o contato pelo email para obter a organização
      const { data: contactData } = await supabase
        .from('contacts')
        .select('organization_id')
        .eq('email', data.email.trim().toLowerCase())
        .limit(1)
        .maybeSingle();

      // Se não encontrar organização pelo contato, tentar buscar pela view segura
      let organizationId: string | null = contactData?.organization_id || null;
      
      if (!organizationId) {
        // Tentar buscar diretamente - a RPC vai retornar erro apropriado
        // Usamos uma organização padrão ou buscamos de outra forma
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        
        organizationId = orgData?.id || null;
      }
      
      if (!organizationId) {
        throw new Error('Credenciais inválidas');
      }
      
      // Chamar função RPC de autenticação server-side
      const { data: authResult, error: authError } = await supabase
        .rpc('authenticate_portal_user', {
          p_email: data.email.trim().toLowerCase(),
          p_password: data.password,
          p_organization_id: organizationId,
        });

      if (authError) {
        console.error('Auth RPC error:', authError);
        throw new Error('Erro ao processar autenticação. Tente novamente.');
      }

      // A resposta vem como array com um objeto
      const authResponse = authResult?.[0] as AuthResponse | undefined;

      if (!authResponse?.success || !authResponse?.user_id) {
        throw new Error(authResponse?.message || 'Credenciais inválidas');
      }

      // Criar sessão segura server-side
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('create_portal_session', {
          p_user_id: authResponse.user_id,
          p_ip_address: null, // Será preenchido pelo backend em produção
          p_user_agent: navigator.userAgent,
        });

      if (sessionError || !sessionData?.[0]) {
        console.error('Session creation error:', sessionError);
        throw new Error('Erro ao criar sessão. Tente novamente.');
      }

      const session = sessionData[0] as SessionResponse;

      // Armazenar token de sessão seguro
      localStorage.setItem('portal_session_token', session.session_token);
      localStorage.setItem('portal_user_id', authResponse.user_id);
      localStorage.setItem('portal_session_expires', session.expires_at);
      
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });

      // Redirecionar para área de tickets
      navigate('/portal/tickets');
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Erro ao fazer login. Verifique suas credenciais.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Flame className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Portal do Cliente</h1>
          <p className="text-muted-foreground">Fireware CRM</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Entrar</CardTitle>
            <CardDescription>
              Acesse sua conta para gerenciar seus tickets e consultar a base de conhecimento.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          autoComplete="email"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Senha</FormLabel>
                      <Link 
                        to="/portal/forgot-password" 
                        className="text-sm text-primary hover:underline"
                        tabIndex={-1}
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pl-10 pr-10"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Entrar
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/portal/register" className="text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </CardFooter>
          </form>
          </Form>
        </Card>

        {/* Quick Links */}
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/portal/knowledge" className="hover:text-foreground hover:underline">
            Base de Conhecimento
          </Link>
          <span>•</span>
          <Link to="/portal/contact" className="hover:text-foreground hover:underline">
            Fale Conosco
          </Link>
        </div>
      </div>
    </div>
  );
}