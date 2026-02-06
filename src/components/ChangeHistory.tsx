import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Minus,
  Edit3,
  Trash2,
  ChevronDown,
  Clock,
  User,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { STALE_TIMES } from '@/lib/queryConfig';

interface ChangeHistoryProps {
  entityType: string;
  entityId: string;
  className?: string;
  maxHeight?: string;
}

interface ChangeRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: 'create' | 'update' | 'delete';
  changed_by: string | null;
  changed_by_name: string;
  changed_by_email: string | null;
  changed_by_avatar: string | null;
  changed_at: string;
  changes: Array<{
    field: string;
    old_value: string | null;
    new_value: string | null;
    field_label: string;
  }>;
  metadata: any;
  total_count: number;
}

const ACTION_CONFIG = {
  create: {
    icon: Plus,
    label: 'Criação',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
  update: {
    icon: Edit3,
    label: 'Alteração',
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30',
  },
  delete: {
    icon: Trash2,
    label: 'Exclusão',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  },
};

const PAGE_SIZE = 15;

export function ChangeHistory({ entityType, entityId, className, maxHeight }: ChangeHistoryProps) {
  const { profile } = useAuth();
  const [page, setPage] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterField, setFilterField] = useState<string>('all');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['entity-change-history', entityType, entityId, page, filterUser, filterField],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entity_change_history', {
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
        p_changed_by: filterUser !== 'all' ? filterUser : null,
        p_field_filter: filterField !== 'all' ? filterField : null,
      });

      if (error) throw error;
      return (data || []) as ChangeRecord[];
    },
    enabled: !!entityId && !!profile?.organization_id,
    staleTime: STALE_TIMES.dynamic,
  });

  const records = data || [];
  const totalCount = records.length > 0 ? Number(records[0].total_count) : 0;
  const hasMore = (page + 1) * PAGE_SIZE < totalCount;

  // Collect unique users and fields for filters
  const uniqueUsers = Array.from(
    new Map(
      records
        .filter((r) => r.changed_by)
        .map((r) => [r.changed_by, { id: r.changed_by!, name: r.changed_by_name }])
    ).values()
  );

  const uniqueFields = Array.from(
    new Set(
      records.flatMap((r) => r.changes?.map((c) => c.field) || [])
    )
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0 && page === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-muted-foreground', className)}>
        <Clock className="h-8 w-8 mb-2" />
        <p className="text-sm">Nenhuma alteração registrada</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {uniqueUsers.length > 1 && (
          <Select value={filterUser} onValueChange={(v) => { setFilterUser(v); setPage(0); }}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <User className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filtrar por usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              {uniqueUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {uniqueFields.length > 1 && (
          <Select value={filterField} onValueChange={(v) => { setFilterField(v); setPage(0); }}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Filtrar por campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os campos</SelectItem>
              {uniqueFields.map((f) => (
                <SelectItem key={f} value={f}>{f.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Timeline */}
      <div className={cn('space-y-0', maxHeight && 'overflow-y-auto')} style={maxHeight ? { maxHeight } : undefined}>
        {records.map((record, index) => {
          const config = ACTION_CONFIG[record.action];
          const ActionIcon = config.icon;
          const isExpanded = expandedIds.has(record.id);
          const changesCount = record.changes?.length || 0;

          return (
            <div key={record.id} className="relative flex gap-4 pb-6">
              {/* Timeline line */}
              {index < records.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
              )}

              {/* Avatar */}
              <div className="relative z-10 shrink-0">
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={record.changed_by_avatar || ''} />
                  <AvatarFallback className={cn(config.bgColor, config.color, 'text-xs')}>
                    {record.changed_by_name
                      ? record.changed_by_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'SYS'}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center border-2 border-background',
                  config.bgColor
                )}>
                  <ActionIcon className={cn('h-3 w-3', config.color)} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{record.changed_by_name}</span>
                  <Badge variant="outline" className={cn('text-xs', config.borderColor, config.color)}>
                    {config.label}
                  </Badge>
                  {changesCount > 0 && record.action === 'update' && (
                    <span className="text-xs text-muted-foreground">
                      {changesCount} {changesCount === 1 ? 'campo' : 'campos'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(record.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {' · '}
                  {formatDistanceToNow(new Date(record.changed_at), { addSuffix: true, locale: ptBR })}
                </p>

                {/* Changes */}
                {changesCount > 0 && (
                  <div className="mt-2">
                    {record.action === 'update' ? (
                      <div>
                        <button
                          onClick={() => toggleExpand(record.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
                          {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-2">
                            {record.changes.map((change, ci) => (
                              <DiffRow key={ci} change={change} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : record.action === 'create' ? (
                      <div>
                        <button
                          onClick={() => toggleExpand(record.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronDown className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')} />
                          {isExpanded ? 'Ocultar valores iniciais' : `Ver ${changesCount} valores iniciais`}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-1">
                            {record.changes.slice(0, 20).map((change, ci) => (
                              <div key={ci} className="flex items-baseline gap-2 text-xs">
                                <span className="text-muted-foreground font-medium min-w-[120px]">
                                  {change.field_label}:
                                </span>
                                <span className="text-success">{truncate(change.new_value, 80)}</span>
                              </div>
                            ))}
                            {record.changes.length > 20 && (
                              <p className="text-xs text-muted-foreground">
                                ...e mais {record.changes.length - 20} campos
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-destructive/80 mt-1">
                        Registro excluído com {changesCount} campos
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {totalCount > 0
            ? `Mostrando ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} de ${totalCount}`
            : ''}
        </span>
        <div className="flex gap-2">
          {page > 0 && (
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={isFetching}>
              Anterior
            </Button>
          )}
          {hasMore && (
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={isFetching}>
              Carregar Mais
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffRow({ change }: { change: { field: string; old_value: string | null; new_value: string | null; field_label: string } }) {
  return (
    <div className="rounded-md border p-2.5 bg-muted/30">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
        {change.field_label}
      </p>
      <div className="flex flex-col gap-1">
        {change.old_value !== null && (
          <div className="flex items-start gap-2">
            <Minus className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
            <span className="text-xs bg-destructive/10 text-destructive rounded px-1.5 py-0.5 break-all">
              {truncate(change.old_value, 200)}
            </span>
          </div>
        )}
        {change.new_value !== null && (
          <div className="flex items-start gap-2">
            <Plus className="h-3 w-3 mt-0.5 text-success shrink-0" />
            <span className="text-xs bg-success/10 text-success rounded px-1.5 py-0.5 break-all">
              {truncate(change.new_value, 200)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function truncate(value: string | null, max: number): string {
  if (!value) return '(vazio)';
  return value.length > max ? value.slice(0, max) + '…' : value;
}
