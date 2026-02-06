import { ReactNode } from 'react';
import { AuthGuard } from './AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

interface ProtectedLayoutProps {
  children: ReactNode;
}

/**
 * ProtectedLayout — Combina AuthGuard + AppLayout em um único wrapper.
 * 
 * Todas as rotas internas do CRM devem usar este componente.
 * Garante que:
 * 1. O usuário está autenticado (AuthGuard)
 * 2. O layout padrão (sidebar + topbar) é renderizado (AppLayout)
 * 
 * Uso:
 * ```tsx
 * <Route path="/dashboard" element={
 *   <ProtectedLayout><Dashboard /></ProtectedLayout>
 * } />
 * ```
 */
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <AuthGuard>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthGuard>
  );
}

export default ProtectedLayout;
