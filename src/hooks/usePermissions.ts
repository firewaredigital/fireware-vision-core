import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_permissions', { _user_id: user.id });
      
      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }
      
      return (data as string[]) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const hasPermission = (capability: string): boolean => {
    if (!permissions) return false;
    
    // Verificação exata
    if (permissions.includes(capability)) return true;
    
    // Verificação com wildcard (ex: "sales.*" cobre "sales.leads.read")
    const parts = capability.split('.');
    for (let i = parts.length - 1; i > 0; i--) {
      const wildcardPath = [...parts.slice(0, i), '*'].join('.');
      if (permissions.includes(wildcardPath)) return true;
    }
    
    return false;
  };

  const hasAnyPermission = (capabilities: string[]): boolean => {
    return capabilities.some(cap => hasPermission(cap));
  };

  const hasAllPermissions = (capabilities: string[]): boolean => {
    return capabilities.every(cap => hasPermission(cap));
  };

  return {
    permissions: permissions || [],
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

export default usePermissions;
