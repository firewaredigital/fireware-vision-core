/**
 * Query Cache Configuration — Constantes padronizadas para React Query.
 * 
 * Elimina inconsistências de staleTime/gcTime (cacheTime) entre as 80+ páginas
 * do CRM, fornecendo valores sensatos para diferentes tipos de dados.
 */

// ==========================================
// STALE TIMES — Quando considerar dados "velhos"
// ==========================================
export const STALE_TIMES = {
  /** Dados que quase nunca mudam: módulos habilitados, permissões, config */
  static: 30 * 60 * 1000,       // 30 minutos
  
  /** Dados que mudam com frequência moderada: listas, contagens */
  dynamic: 2 * 60 * 1000,       // 2 minutos
  
  /** Dados que devem refletir o tempo real: chat, notificações */
  realtime: 30 * 1000,           // 30 segundos
  
  /** Dados de formulário/detalhe: geralmente stale imediatamente */
  detail: 60 * 1000,             // 1 minuto
  
  /** Lookups e opções de select: mudam raramente */
  lookup: 15 * 60 * 1000,        // 15 minutos
} as const;

// ==========================================
// GC TIMES (antigo cacheTime) — Quando remover da memória
// ==========================================
export const GC_TIMES = {
  /** Cache longo: dados de referência que queremos manter em memória */
  long: 60 * 60 * 1000,         // 1 hora
  
  /** Cache médio: listas e dados frequentemente acessados */
  medium: 10 * 60 * 1000,        // 10 minutos
  
  /** Cache curto: dados que devem ser descartados rapidamente */
  short: 2 * 60 * 1000,          // 2 minutos
} as const;

// ==========================================
// RETRY CONFIG — Estratégias de retry por tipo de operação
// ==========================================
export const RETRY_CONFIG = {
  /** Queries normais: 2 tentativas com backoff exponencial */
  default: {
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },
  
  /** Queries críticas que não devem falhar silenciosamente */
  critical: {
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 15000),
  },
  
  /** Mutations: sem retry automático (para evitar operações duplicadas) */
  mutation: {
    retry: 0,
  },
  
  /** Dados de background que podem falhar sem impacto */
  background: {
    retry: 1,
    retryDelay: () => 5000,
  },
} as const;

// ==========================================
// QUERY DEFAULTS — Configuração padrão do QueryClient
// ==========================================
export const QUERY_DEFAULTS = {
  queries: {
    staleTime: STALE_TIMES.dynamic,
    gcTime: GC_TIMES.medium,
    retry: RETRY_CONFIG.default.retry,
    retryDelay: RETRY_CONFIG.default.retryDelay,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: RETRY_CONFIG.mutation.retry,
  },
} as const;

// ==========================================
// QUERY KEY FACTORIES — Chaves padronizadas por entidade
// ==========================================
export const queryKeys = {
  // Core entities
  leads: {
    all: ['leads'] as const,
    list: (filters?: Record<string, unknown>) => ['leads', 'list', filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    list: (filters?: Record<string, unknown>) => ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    list: (filters?: Record<string, unknown>) => ['accounts', 'list', filters] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    list: (filters?: Record<string, unknown>) => ['opportunities', 'list', filters] as const,
    detail: (id: string) => ['opportunities', 'detail', id] as const,
  },
  tickets: {
    all: ['tickets'] as const,
    list: (filters?: Record<string, unknown>) => ['tickets', 'list', filters] as const,
    detail: (id: string) => ['tickets', 'detail', id] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  
  // Auth & system
  orgModules: (orgId: string) => ['org-modules', orgId] as const,
  permissions: (userId: string) => ['permissions', userId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  
  // Dashboard
  dashboard: (orgId: string) => ['dashboard', orgId] as const,
} as const;
