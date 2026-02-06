import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useModuleAccess, ModuleKey } from '@/hooks/useModuleAccess';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldX } from 'lucide-react';

interface ModuleGuardProps {
  moduleKey: ModuleKey;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ModuleGuard({ 
  moduleKey, 
  children, 
  fallback,
  redirectTo 
}: ModuleGuardProps) {
  const { hasAccess, isLoading } = useModuleAccess(moduleKey);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  if (!hasAccess) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Módulo não disponível</h2>
        <p className="text-muted-foreground max-w-md">
          O módulo <span className="font-medium">{moduleKey}</span> não está 
          habilitado para sua organização. Entre em contato com o administrador 
          para solicitar acesso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// HOC para proteger componentes com verificação de módulo
export function withModuleGuard<P extends object>(
  Component: React.ComponentType<P>,
  moduleKey: ModuleKey,
  options?: { redirectTo?: string; fallback?: ReactNode }
) {
  return function WrappedComponent(props: P) {
    return (
      <ModuleGuard 
        moduleKey={moduleKey} 
        redirectTo={options?.redirectTo}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ModuleGuard>
    );
  };
}

export default ModuleGuard;
