import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Flame, Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCcw, AlertCircle } from 'lucide-react';

export default function PortalLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // TODO: Implement actual portal authentication
      // For now, simulate login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store session token and redirect
      localStorage.setItem('portal_session', 'demo_session');
      navigate('/portal/tickets');
      
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
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
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link 
                    to="/portal/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
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