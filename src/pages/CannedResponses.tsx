import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MessageSquare,
  Tag,
  Folder,
  Keyboard,
  BarChart3,
  RefreshCcw,
  Filter,
  Code,
  Globe,
  Lock,
  Check,
  X,
  Zap,
} from '@/components/icons';

interface CannedResponse {
  id: string;
  name: string;
  content: string;
  content_html: string | null;
  category: string | null;
  shortcut: string | null;
  is_active: boolean;
  is_public: boolean;
  usage_count: number;
  tags: string[] | null;
  language: string;
  variables: any[];
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CannedResponseCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
}

const AVAILABLE_VARIABLES = [
  { name: 'ticket.number', description: 'Número do ticket', example: 'TK-001234' },
  { name: 'ticket.subject', description: 'Assunto do ticket', example: 'Problema com login' },
  { name: 'ticket.status', description: 'Status atual do ticket', example: 'open' },
  { name: 'ticket.priority', description: 'Prioridade do ticket', example: 'high' },
  { name: 'contact.first_name', description: 'Primeiro nome do contato', example: 'João' },
  { name: 'contact.last_name', description: 'Sobrenome do contato', example: 'Silva' },
  { name: 'contact.email', description: 'Email do contato', example: 'joao@email.com' },
  { name: 'contact.phone', description: 'Telefone do contato', example: '(11) 99999-9999' },
  { name: 'account.name', description: 'Nome da empresa', example: 'Empresa ABC' },
];

export default function CannedResponses() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [activeTab, setActiveTab] = useState('responses');
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    content_html: '',
    category: '',
    shortcut: '',
    is_public: true,
    is_active: true,
    tags: [] as string[],
    language: 'pt-BR',
  });
  const [newTag, setNewTag] = useState('');
  
  // Category form
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CannedResponseCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
  });
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [responseToDelete, setResponseToDelete] = useState<CannedResponse | null>(null);
  
  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewResponse, setPreviewResponse] = useState<CannedResponse | null>(null);

  // Fetch canned responses
  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['canned-responses', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data as CannedResponse[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['canned-response-categories', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('canned_response_categories')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('display_order');
      
      if (error) throw error;
      return data as CannedResponseCategory[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch analytics
  const { data: analytics = [] } = useQuery({
    queryKey: ['canned-response-analytics', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      
      const { data, error } = await supabase
        .from('canned_response_analytics')
        .select(`
          *,
          canned_response:canned_response_id(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.organization_id,
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        name: data.name,
        content: data.content,
        content_html: data.content_html || null,
        category: data.category || null,
        shortcut: data.shortcut || null,
        is_public: data.is_public,
        is_active: data.is_active,
        tags: data.tags.length > 0 ? data.tags : null,
        language: data.language,
        organization_id: profile!.organization_id,
        owner_id: data.is_public ? null : profile!.id,
      };
      
      if (data.id) {
        const { error } = await supabase
          .from('canned_responses')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('canned_responses')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      setFormOpen(false);
      setEditingResponse(null);
      resetForm();
      toast({
        title: 'Resposta salva',
        description: 'A resposta rápida foi salva com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete response mutation
  const deleteResponseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canned_responses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      setDeleteDialogOpen(false);
      setResponseToDelete(null);
      toast({
        title: 'Resposta excluída',
        description: 'A resposta rápida foi excluída com sucesso.',
      });
    },
  });

  // Save category mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryFormData & { id?: string }) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        organization_id: profile!.organization_id,
        display_order: categories.length,
      };
      
      if (data.id) {
        const { error } = await supabase
          .from('canned_response_categories')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('canned_response_categories')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-response-categories'] });
      setCategoryFormOpen(false);
      setEditingCategory(null);
      setCategoryFormData({ name: '', description: '', icon: '', color: '#3B82F6' });
      toast({ title: 'Categoria salva' });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('canned_response_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-response-categories'] });
      toast({ title: 'Categoria excluída' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      content: '',
      content_html: '',
      category: '',
      shortcut: '',
      is_public: true,
      is_active: true,
      tags: [],
      language: 'pt-BR',
    });
    setNewTag('');
  };

  const openEditForm = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      name: response.name,
      content: response.content,
      content_html: response.content_html || '',
      category: response.category || '',
      shortcut: response.shortcut || '',
      is_public: response.is_public,
      is_active: response.is_active,
      tags: response.tags || [],
      language: response.language || 'pt-BR',
    });
    setFormOpen(true);
  };

  const openEditCategory = (category: CannedResponseCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3B82F6',
    });
    setCategoryFormOpen(true);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const insertVariable = (varName: string) => {
    const variable = `{{${varName}}}`;
    setFormData({ ...formData, content: formData.content + variable });
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado!', description: 'Conteúdo copiado para a área de transferência.' });
  };

  // Filter responses
  const filteredResponses = responses.filter(response => {
    const matchesSearch = 
      response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.shortcut?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || response.category === selectedCategory;
    const matchesOwner = !showOnlyMine || response.owner_id === profile?.id;
    
    return matchesSearch && matchesCategory && matchesOwner;
  });

  // Group by category
  const groupedResponses = filteredResponses.reduce((acc, response) => {
    const cat = response.category || 'Sem categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(response);
    return acc;
  }, {} as Record<string, CannedResponse[]>);

  // Stats
  const totalResponses = responses.length;
  const activeResponses = responses.filter(r => r.is_active).length;
  const totalUsage = responses.reduce((sum, r) => sum + r.usage_count, 0);
  const publicResponses = responses.filter(r => r.is_public).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Respostas Rápidas</h1>
            <p className="text-muted-foreground">
              Gerencie macros e templates de resposta para agilizar o atendimento
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={formOpen} onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) {
                setEditingResponse(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Resposta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingResponse ? 'Editar Resposta Rápida' : 'Nova Resposta Rápida'}
                  </DialogTitle>
                  <DialogDescription>
                    Crie templates de resposta com variáveis dinâmicas para agilizar o atendimento.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  {/* Name and Shortcut */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Saudação inicial"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shortcut">
                        <Keyboard className="inline h-3.5 w-3.5 mr-1" />
                        Atalho (opcional)
                      </Label>
                      <Input
                        id="shortcut"
                        value={formData.shortcut}
                        onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                        placeholder="Ex: /saudacao"
                      />
                    </div>
                  </div>

                  {/* Category and Language */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem categoria</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Idioma</Label>
                      <Select
                        value={formData.language}
                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="content">Conteúdo *</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Code className="mr-2 h-3.5 w-3.5" />
                            Inserir Variável
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          <ScrollArea className="h-64">
                            {AVAILABLE_VARIABLES.map((variable) => (
                              <DropdownMenuItem
                                key={variable.name}
                                onClick={() => insertVariable(variable.name)}
                              >
                                <div className="flex flex-col">
                                  <span className="font-mono text-sm">
                                    {`{{${variable.name}}}`}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {variable.description}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </ScrollArea>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Digite o conteúdo da resposta. Use {{variavel}} para inserir dados dinâmicos."
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis disponíveis: ticket.number, ticket.subject, contact.first_name, contact.email, account.name, etc.
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Adicionar tag"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button onClick={() => handleRemoveTag(tag)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Options */}
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                      />
                      <Label htmlFor="is_public" className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        Pública (visível para todos)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active" className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        Ativa
                      </Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setFormOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => saveResponseMutation.mutate({
                      ...formData,
                      id: editingResponse?.id,
                    })}
                    disabled={!formData.name || !formData.content || saveResponseMutation.isPending}
                  >
                    {saveResponseMutation.isPending ? (
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {editingResponse ? 'Atualizar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-xs text-muted-foreground">
                {activeResponses} ativas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usos Totais</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Respostas enviadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Organizações
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Públicas</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publicResponses}</div>
              <p className="text-xs text-muted-foreground">
                Compartilhadas com o time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="responses">
              <MessageSquare className="mr-2 h-4 w-4" />
              Respostas
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Folder className="mr-2 h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Análise de Uso
            </TabsTrigger>
            <TabsTrigger value="variables">
              <Code className="mr-2 h-4 w-4" />
              Variáveis
            </TabsTrigger>
          </TabsList>

          {/* Responses Tab */}
          <TabsContent value="responses" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, conteúdo ou atalho..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Sem categoria">Sem categoria</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch
                  id="showOnlyMine"
                  checked={showOnlyMine}
                  onCheckedChange={setShowOnlyMine}
                />
                <Label htmlFor="showOnlyMine" className="text-sm">
                  Apenas minhas
                </Label>
              </div>
            </div>

            {/* Responses List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResponses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma resposta encontrada</h3>
                  <p className="text-muted-foreground text-center mt-1">
                    {searchTerm || selectedCategory !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Crie sua primeira resposta rápida para agilizar o atendimento.'}
                  </p>
                  {!searchTerm && selectedCategory === 'all' && (
                    <Button className="mt-4" onClick={() => setFormOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Resposta
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(groupedResponses).map(([category, items]) => (
                  <AccordionItem key={category} value={category} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {items.map((response) => (
                          <Card key={response.id} className="overflow-hidden">
                            <div className="flex items-start gap-4 p-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium truncate">{response.name}</h4>
                                  {response.shortcut && (
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {response.shortcut}
                                    </Badge>
                                  )}
                                  {!response.is_active && (
                                    <Badge variant="secondary">Inativa</Badge>
                                  )}
                                  {!response.is_public && (
                                    <Badge variant="secondary">
                                      <Lock className="h-3 w-3 mr-1" />
                                      Privada
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {response.content}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="h-3 w-3" />
                                    {response.usage_count} usos
                                  </span>
                                  {response.tags && response.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {response.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setPreviewResponse(response);
                                    setPreviewOpen(true);
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => copyToClipboard(response.content)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copiar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditForm(response)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setResponseToDelete(response);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={categoryFormOpen} onOpenChange={(open) => {
                setCategoryFormOpen(open);
                if (!open) {
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', description: '', icon: '', color: '#3B82F6' });
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                        placeholder="Ex: Saudações"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={categoryFormData.description}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                        placeholder="Descrição da categoria"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ícone</Label>
                        <Input
                          value={categoryFormData.icon}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                          placeholder="Ex: 👋"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cor</Label>
                        <Input
                          type="color"
                          value={categoryFormData.color}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCategoryFormOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => saveCategoryMutation.mutate({
                        ...categoryFormData,
                        id: editingCategory?.id,
                      })}
                      disabled={!categoryFormData.name}
                    >
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold">Nenhuma categoria</h3>
                  <p className="text-muted-foreground text-center mt-1">
                    Crie categorias para organizar suas respostas rápidas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Respostas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => {
                      const responseCount = responses.filter(r => r.category === category.name).length;
                      return (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              <span className="font-medium">{category.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {category.description || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{responseCount}</Badge>
                          </TableCell>
                          <TableCell>
                            {category.is_active ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <Check className="h-3 w-3 mr-1" />
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inativa</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditCategory(category)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteCategoryMutation.mutate(category.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Respostas Mais Usadas</CardTitle>
                <CardDescription>
                  Ranking das respostas rápidas mais utilizadas pela equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses
                    .filter(r => r.usage_count > 0)
                    .sort((a, b) => b.usage_count - a.usage_count)
                    .slice(0, 10)
                    .map((response, index) => (
                      <div key={response.id} className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{response.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {response.category || 'Sem categoria'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{response.usage_count}</p>
                          <p className="text-xs text-muted-foreground">usos</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variáveis Disponíveis</CardTitle>
                <CardDescription>
                  Use estas variáveis em suas respostas para inserir dados dinâmicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variável</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Exemplo</TableHead>
                      <TableHead className="w-[100px]">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AVAILABLE_VARIABLES.map((variable) => (
                      <TableRow key={variable.name}>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {`{{${variable.name}}}`}
                          </code>
                        </TableCell>
                        <TableCell>{variable.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {variable.example}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`{{${variable.name}}}`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewResponse?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-wrap gap-2">
                {previewResponse?.shortcut && (
                  <Badge variant="outline" className="font-mono">
                    {previewResponse.shortcut}
                  </Badge>
                )}
                {previewResponse?.category && (
                  <Badge variant="secondary">{previewResponse.category}</Badge>
                )}
                {previewResponse?.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="rounded-lg border p-4 bg-muted/50">
                <pre className="whitespace-pre-wrap text-sm">
                  {previewResponse?.content}
                </pre>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{previewResponse?.usage_count} usos</span>
                <span>
                  Atualizado em{' '}
                  {previewResponse?.updated_at && format(
                    new Date(previewResponse.updated_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => previewResponse && copyToClipboard(previewResponse.content)}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Conteúdo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir resposta rápida?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A resposta "{responseToDelete?.name}" será
                permanentemente excluída.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => responseToDelete && deleteResponseMutation.mutate(responseToDelete.id)}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}