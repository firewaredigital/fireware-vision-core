import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * AuthGuard Global — Protege rotas que requerem autenticação.
 * 
 * - Verifica se o usuário está autenticado via useAuth()
 * - Mostra loading spinner enquanto verifica sessão (evita flash)
 * - Redireciona para /auth se não logado, preservando a rota de destino
 * - Usa Navigate em vez de useEffect+navigate para evitar renderização intermediária
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Estado de carregamento — skeleton/spinner para evitar flash de conteúdo
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Não autenticado — redireciona para /auth preservando a URL de destino
  if (!user) {
    return (
      <Navigate
        to="/auth"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // Autenticado — renderiza o conteúdo protegido
  return <>{children}</>;
}

export default AuthGuard;
