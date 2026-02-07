import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Mail, Eye, Copy, Trash2, MoreHorizontal,
  RefreshCw, LayoutTemplate, Tag, Star, Clock, BarChart3,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subject: string;
  layout: string | null;
  is_active: boolean | null;
  is_shared: boolean | null;
  usage_count: number | null;
  avg_open_rate: number | null;
  avg_click_rate: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  transactional: 'Transacional',
  promotional: 'Promocional',
  newsletter: 'Newsletter',
  onboarding: 'Onboarding',
  notification: 'Notificação',
  retention: 'Retenção',
  reactivation: 'Reativação',
};

export default function EmailTemplates() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organization_id) fetchTemplates();
  }, [profile?.organization_id]);

  const fetchTemplates = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('updated_at', { ascending: false });
    if (data) setTemplates(data as EmailTemplate[]);
    setLoading(false);
  };

  const handleClone = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    const { data, error } = await supabase.rpc('clone_email_template', {
      p_template_id: templateId,
      p_new_name: `${template.name} (Cópia)`,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao clonar template' });
    } else {
      toast({ title: 'Template clonado', description: 'Uma cópia foi criada com sucesso.' });
      fetchTemplates();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('email_templates').delete().eq('id', deleteId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir template' });
    } else {
      toast({ title: 'Template excluído' });
      fetchTemplates();
    }
    setDeleteId(null);
  };

  const filtered = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    avgOpen: templates.length > 0 ? (templates.reduce((s, t) => s + (t.avg_open_rate || 0), 0) / templates.length).toFixed(1) : '0',
    avgClick: templates.length > 0 ? (templates.reduce((s, t) => s + (t.avg_click_rate || 0), 0) / templates.length).toFixed(1) : '0',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutTemplate className="h-7 w-7 text-primary" />
            Templates de Email
          </h1>
          <p className="text-muted-foreground">Crie e gerencie templates reutilizáveis para suas campanhas</p>
        </div>
        <Button onClick={() => navigate('/marketing/templates/new')}>
          <Plus className="mr-2 h-4 w-4" />Novo Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Templates</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.active}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média Abertura</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgOpen}%</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Média Cliques</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.avgClick}%</div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar templates..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum template encontrado</p>
            <Button onClick={() => navigate('/marketing/templates/new')}><Plus className="mr-2 h-4 w-4" />Criar Template</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Cliques</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(template => (
                <TableRow key={template.id} className="cursor-pointer" onClick={() => navigate(`/marketing/templates/${template.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{template.description}</p>}
                      </div>
                      {template.is_shared && <Badge variant="outline" className="text-xs">Compartilhado</Badge>}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{categoryLabels[template.category || ''] || template.category}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{template.subject}</TableCell>
                  <TableCell>{template.usage_count || 0}</TableCell>
                  <TableCell>{template.avg_open_rate ? `${template.avg_open_rate}%` : '—'}</TableCell>
                  <TableCell>{template.avg_click_rate ? `${template.avg_click_rate}%` : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(template.updated_at), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/marketing/templates/${template.id}`); }}><Eye className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleClone(template.id); }}><Copy className="mr-2 h-4 w-4" />Clonar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(template.id); }}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
