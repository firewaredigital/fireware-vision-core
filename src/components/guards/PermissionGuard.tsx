import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock } from 'lucide-react';

interface PermissionGuardProps {
  permission: string | string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export function PermissionGuard({ 
  permission, 
  requireAll = false,
  children, 
  fallback,
  showFallback = true
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100px]">
        <Skeleton className="h-16 w-full max-w-sm" />
      </div>
    );
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 bg-muted/50 rounded-lg">
        <Lock className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium mb-1">Acesso restrito</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Você não possui permissão para acessar este recurso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

// HOC para proteger componentes com verificação de permissão
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permission: string | string[],
  options?: { requireAll?: boolean; fallback?: ReactNode }
) {
  return function WrappedComponent(props: P) {
    return (
      <PermissionGuard 
        permission={permission} 
        requireAll={options?.requireAll}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

// Componente para renderização condicional sem fallback
export function Can({ 
  permission, 
  requireAll = false,
  children 
}: { 
  permission: string | string[];
  requireAll?: boolean;
  children: ReactNode;
}) {
  return (
    <PermissionGuard permission={permission} requireAll={requireAll} showFallback={false}>
      {children}
    </PermissionGuard>
  );
}

export default PermissionGuard;
