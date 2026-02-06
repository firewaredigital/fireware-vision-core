import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export type ModuleKey = 
  | 'sales'
  | 'service'
  | 'contact_center'
  | 'marketing'
  | 'commerce'
  | 'billing'
  | 'cpq'
  | 'itsm'
  | 'data_hub'
  | 'automations'
  | 'integrations'
  | 'ai_agents'
  | 'analytics'
  | 'portals'
  | 'governance';

export interface OrgModule {
  module_key: ModuleKey;
  plan_tier: string;
  limits: Record<string, unknown>;
  usage: Record<string, unknown>;
}

// Função auxiliar para validar e converter o retorno da RPC
function parseOrgModules(data: unknown): OrgModule[] {
  if (!data) return [];
  if (!Array.isArray(data)) return [];
  
  return data
    .filter((item): item is Record<string, unknown> => 
      typeof item === 'object' && item !== null
    )
    .map(item => ({
      module_key: item.module_key as ModuleKey,
      plan_tier: String(item.plan_tier || 'free'),
      limits: (item.limits as Record<string, unknown>) || {},
      usage: (item.usage as Record<string, unknown>) || {},
    }))
    .filter(item => item.module_key); // Garantir que module_key existe
}

export function useModuleAccess(moduleKey?: ModuleKey) {
  const { user, profile } = useAuth();
  const organizationId = profile?.organization_id;

  const { data: enabledModules, isLoading } = useQuery({
    queryKey: ['org-modules', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .rpc('get_org_enabled_modules', { _org_id: organizationId });
      
      if (error) {
        console.error('Error fetching org modules:', error);
        return [];
      }
      
      return parseOrgModules(data);
    },
    enabled: !!organizationId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const isModuleEnabled = (key: ModuleKey): boolean => {
    if (!enabledModules) return false;
    return enabledModules.some(m => m.module_key === key);
  };

  const getModuleInfo = (key: ModuleKey): OrgModule | undefined => {
    return enabledModules?.find(m => m.module_key === key);
  };

  const hasAccess = moduleKey ? isModuleEnabled(moduleKey) : true;

  return {
    enabledModules: enabledModules || [],
    isLoading,
    isModuleEnabled,
    getModuleInfo,
    hasAccess,
  };
}

export default useModuleAccess;
