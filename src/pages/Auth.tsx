import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from '@/components/icons';
import firewareLogo from '@/assets/fireware-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

/* ─── Validation Schemas ─── */
const loginSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Por favor, insira um email válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não correspondem',
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

/* ─── Auth Page ─── */
export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Falha no login',
        description: error.message === 'Invalid login credentials'
          ? 'Email ou senha inválidos. Tente novamente.'
          : error.message,
      });
    } else {
      toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });
      navigate('/dashboard');
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.firstName, data.lastName);
    setIsLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'Este email já está registrado. Faça login.';
      }
      toast({ variant: 'destructive', title: 'Falha no cadastro', description: message });
    } else {
      toast({ title: 'Conta criada!', description: 'Bem-vindo ao Fireware CRM.' });
      navigate('/dashboard');
    }
  };

  /* ── Loading state ── */
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'hsl(210, 6%, 15%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="auth-page-wrapper"
      style={{ backgroundColor: 'hsl(210, 6%, 15%)' }}
    >
      {/* ═══ Central Card Container ═══ */}
      <div className="auth-card-container">
        {/* ─── LEFT PANEL: Form ─── */}
        <div className="auth-form-panel">
          {/* Logo */}
          <div className="auth-form-logo">
            <img
              src={firewareLogo}
              alt="Fireware CRM"
              className="auth-logo-img"
            />
          </div>

          {mode === 'login' ? (
            /* ── Login Form ── */
            <div className="auth-form-content">
              <h2 className="auth-form-title">Entrar na sua conta</h2>

              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="auth-form-fields">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="auth-label">Usuário</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="voce@empresa.com"
                            className="auth-input"
                            autoComplete="email"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="auth-label">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="auth-input pr-10"
                              autoComplete="current-password"
                              disabled={isLoading}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="auth-eye-btn"
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

                  <Button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </Form>

              <div className="auth-form-footer">
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setShowPassword(false); }}
                  className="auth-link"
                >
                  Não tem uma conta? <span className="auth-link-accent">Cadastre-se</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── Signup Form ── */
            <div className="auth-form-content">
              <h2 className="auth-form-title">Criar sua conta</h2>

              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="auth-form-fields">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="auth-label">Nome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="João"
                              className="auth-input"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="auth-label">Sobrenome</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Silva"
                              className="auth-input"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="auth-label">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="voce@empresa.com"
                            className="auth-input"
                            autoComplete="email"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="auth-label">Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="auth-input pr-10"
                              autoComplete="new-password"
                              disabled={isLoading}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="auth-eye-btn"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="auth-label">Confirmar Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="auth-input pr-10"
                              autoComplete="new-password"
                              disabled={isLoading}
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="auth-eye-btn"
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                </form>
              </Form>

              <div className="auth-form-footer">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setShowPassword(false); setShowConfirmPassword(false); }}
                  className="auth-link"
                >
                  Já tem uma conta? <span className="auth-link-accent">Entrar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Dark branding ─── */}
        <div className="auth-brand-panel">
          {/* Top branding badge */}
          <div className="auth-brand-top">
            <span className="auth-brand-name">Fireware CRM</span>
            <span className="auth-brand-divider" />
            <span className="auth-brand-powered">POWERED BY <span className="auth-brand-highlight">FIREWARE</span></span>
          </div>

          {/* Central welcome message */}
          <div className="auth-brand-center">
            <h1 className="auth-brand-heading">
              Bem-vindo à plataforma Fireware CRM.
            </h1>
          </div>

          {/* Bottom tagline */}
          <div className="auth-brand-bottom">
            <p className="auth-brand-tagline">
              Plataforma Integrada de CRM, Vendas e Gestão Empresarial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
