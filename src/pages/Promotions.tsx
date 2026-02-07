import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Tag, 
  Percent, 
  DollarSign,
  Gift,
  Truck,
  Edit,
  Copy
} from '@/components/icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PromotionType = 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';

const typeConfig: Record<PromotionType, { label: string; icon: React.ReactNode }> = {
  percentage: { label: 'Porcentagem', icon: <Percent className="h-4 w-4" /> },
  fixed: { label: 'Valor Fixo', icon: <DollarSign className="h-4 w-4" /> },
  buy_x_get_y: { label: 'Compre X Leve Y', icon: <Gift className="h-4 w-4" /> },
  free_shipping: { label: 'Frete Grátis', icon: <Truck className="h-4 w-4" /> },
};

export default function Promotions() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', search, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter as any);
      }
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['promotion-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('is_active, used_count, type');
      
      if (error) throw error;

      const active = data?.filter(p => p.is_active).length || 0;
      const totalUsage = data?.reduce((sum, p) => sum + (p.used_count || 0), 0) || 0;

      return { active, inactive: (data?.length || 0) - active, totalUsage };
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-stats'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar promoção: ' + error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDiscount = (promo: any) => {
    const type = promo.type as PromotionType;
    if (type === 'percentage') {
      return `${promo.value}%`;
    }
    if (type === 'fixed') {
      return formatCurrency(Number(promo.value) || 0);
    }
    if (type === 'buy_x_get_y') {
      return `Compre ${promo.buy_quantity} Leve ${promo.get_quantity}`;
    }
    return 'Frete Grátis';
  };

  const isExpired = (promo: any) => {
    if (!promo.end_date) return false;
    return new Date(promo.end_date) < new Date();
  };

  const isNotStarted = (promo: any) => {
    if (!promo.start_date) return false;
    return new Date(promo.start_date) > new Date();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="commerce"
          title="Promoções"
          subtitle="Gerencie cupons e promoções"
          compact
          actions={
            <Button asChild className="gap-2 bg-white text-foreground hover:bg-white/90">
              <Link to="/promotions/new">
                <Plus className="h-4 w-4" /> Nova Promoção
              </Link>
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
              <p className="text-xs text-muted-foreground">Promoções ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inativas</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats?.inactive || 0}</div>
              <p className="text-xs text-muted-foreground">Promoções inativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usos Totais</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsage || 0}</div>
              <p className="text-xs text-muted-foreground">Vezes utilizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {Object.entries(typeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="inactive">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Promotions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promoção</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : promotions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Nenhuma promoção encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions?.map((promo) => {
                    const type = promo.type as PromotionType;
                    const typeCfg = typeConfig[type] || typeConfig.percentage;
                    const expired = isExpired(promo);
                    const notStarted = isNotStarted(promo);
                    
                    return (
                      <TableRow key={promo.id} className={expired ? 'opacity-50' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{promo.name}</p>
                            {promo.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {promo.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {promo.code ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                {promo.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyCode(promo.code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline">Automática</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {typeCfg.icon}
                            <span className="text-sm">{typeCfg.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatDiscount(promo)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-medium">{promo.used_count || 0}</span>
                            {promo.usage_limit && (
                              <span className="text-muted-foreground"> / {promo.usage_limit}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {promo.start_date || promo.end_date ? (
                            <div className="text-sm">
                              {promo.start_date && (
                                <p>{format(new Date(promo.start_date), "dd/MM/yy", { locale: ptBR })}</p>
                              )}
                              {promo.end_date && (
                                <p className="text-muted-foreground">
                                  até {format(new Date(promo.end_date), "dd/MM/yy", { locale: ptBR })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sem limite</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {expired ? (
                              <Badge variant="destructive">Expirada</Badge>
                            ) : notStarted ? (
                              <Badge variant="secondary">Agendada</Badge>
                            ) : (
                              <Switch
                                checked={promo.is_active}
                                onCheckedChange={(checked) => 
                                  toggleActiveMutation.mutate({ id: promo.id, isActive: checked })
                                }
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/promotions/${promo.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
