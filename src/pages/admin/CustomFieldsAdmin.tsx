import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  List,
  ListChecks,
  Globe,
  Mail,
  Phone,
  AlignLeft,
  Link,
  Loader2,
} from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import {
  useAllCustomFieldDefinitions,
  useSaveCustomFieldDefinition,
  useDeleteCustomFieldDefinition,
  useUpdateFieldOrder,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
  type CustomFieldType,
} from '@/hooks/useCustomFields';

const ENTITY_TABS: { value: CustomFieldEntityType; label: string }[] = [
  { value: 'lead', label: 'Leads' },
  { value: 'contact', label: 'Contatos' },
  { value: 'account', label: 'Contas' },
  { value: 'opportunity', label: 'Oportunidades' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'order', label: 'Pedidos' },
];

const FIELD_TYPES: { value: CustomFieldType; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Texto', icon: Type },
  { value: 'number', label: 'Número', icon: Hash },
  { value: 'decimal', label: 'Decimal', icon: Hash },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'datetime', label: 'Data e Hora', icon: Calendar },
  { value: 'boolean', label: 'Sim/Não', icon: ToggleLeft },
  { value: 'select', label: 'Seleção', icon: List },
  { value: 'multiselect', label: 'Múltipla Seleção', icon: ListChecks },
  { value: 'url', label: 'URL', icon: Globe },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'textarea', label: 'Texto Longo', icon: AlignLeft },
  { value: 'lookup', label: 'Lookup', icon: Link },
];

const getFieldTypeIcon = (type: CustomFieldType) => {
  const found = FIELD_TYPES.find(f => f.value === type);
  return found?.icon || Type;
};

interface FieldFormState {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required: boolean;
  default_value: string;
  description: string;
  placeholder: string;
  section_name: string;
  options: { label: string; value: string }[];
  validation_min: string;
  validation_max: string;
  validation_min_length: string;
  validation_max_length: string;
}

const emptyFormState: FieldFormState = {
  field_name: '',
  field_label: '',
  field_type: 'text',
  is_required: false,
  default_value: '',
  description: '',
  placeholder: '',
  section_name: 'Campos Personalizados',
  options: [],
  validation_min: '',
  validation_max: '',
  validation_min_length: '',
  validation_max_length: '',
};

export default function CustomFieldsAdmin() {
  const [activeEntity, setActiveEntity] = useState<CustomFieldEntityType>('lead');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<FieldFormState>(emptyFormState);
  const [optionInput, setOptionInput] = useState('');

  const { data: allDefinitions = [], isLoading } = useAllCustomFieldDefinitions();
  const saveMutation = useSaveCustomFieldDefinition();
  const deleteMutation = useDeleteCustomFieldDefinition();
  const reorderMutation = useUpdateFieldOrder();

  const entityFields = allDefinitions
    .filter((d) => d.entity_type === activeEntity)
    .sort((a, b) => a.display_order - b.display_order);

  const activeFields = entityFields.filter(d => d.is_active);
  const inactiveFields = entityFields.filter(d => !d.is_active);

  const handleOpenCreate = () => {
    setFormState(emptyFormState);
    setDialogOpen(true);
  };

  const handleOpenEdit = (def: CustomFieldDefinition) => {
    setFormState({
      id: def.id,
      field_name: def.field_name,
      field_label: def.field_label,
      field_type: def.field_type,
      is_required: def.is_required,
      default_value: def.default_value || '',
      description: def.description || '',
      placeholder: def.placeholder || '',
      section_name: def.section_name || 'Campos Personalizados',
      options: (def.options || []) as { label: string; value: string }[],
      validation_min: def.validation_rules?.min?.toString() || '',
      validation_max: def.validation_rules?.max?.toString() || '',
      validation_min_length: def.validation_rules?.min_length?.toString() || '',
      validation_max_length: def.validation_rules?.max_length?.toString() || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formState.field_label.trim()) return;

    // Auto-generate field_name from label if not set
    const fieldName = formState.field_name.trim() || 
      formState.field_label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    const validationRules: any = {};
    if (formState.validation_min) validationRules.min = Number(formState.validation_min);
    if (formState.validation_max) validationRules.max = Number(formState.validation_max);
    if (formState.validation_min_length) validationRules.min_length = Number(formState.validation_min_length);
    if (formState.validation_max_length) validationRules.max_length = Number(formState.validation_max_length);

    saveMutation.mutate({
      id: formState.id,
      entity_type: activeEntity,
      field_name: fieldName,
      field_label: formState.field_label,
      field_type: formState.field_type,
      is_required: formState.is_required,
      default_value: formState.default_value || null,
      description: formState.description || null,
      placeholder: formState.placeholder || null,
      section_name: formState.section_name || 'Campos Personalizados',
      options: formState.options,
      validation_rules: Object.keys(validationRules).length > 0 ? validationRules : {},
      display_order: formState.id ? undefined : activeFields.length,
      is_active: true,
    } as any, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const handleAddOption = () => {
    if (!optionInput.trim()) return;
    const value = optionInput.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    setFormState(prev => ({
      ...prev,
      options: [...prev.options, { label: optionInput.trim(), value }],
    }));
    setOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    setFormState(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = [...activeFields];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    const updates = reordered.map((field, index) => ({
      id: field.id,
      display_order: index,
    }));

    reorderMutation.mutate(updates);
  };

  const showOptions = ['select', 'multiselect'].includes(formState.field_type);
  const showNumericValidation = ['number', 'decimal'].includes(formState.field_type);
  const showTextValidation = ['text', 'textarea', 'email', 'url', 'phone'].includes(formState.field_type);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campos Personalizados</h1>
            <p className="text-muted-foreground">
              Configure campos customizados para cada tipo de entidade
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Campo
          </Button>
        </div>

        <Tabs value={activeEntity} onValueChange={(v) => setActiveEntity(v as CustomFieldEntityType)}>
          <TabsList className="grid grid-cols-6 w-full max-w-2xl">
            {ENTITY_TABS.map((tab) => {
              const count = allDefinitions.filter(d => d.entity_type === tab.value && d.is_active).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                  {tab.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs h-5 min-w-[20px]">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ENTITY_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activeFields.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Type className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium mb-1">Nenhum campo personalizado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione campos customizados para {tab.label.toLowerCase()}
                    </p>
                    <Button onClick={handleOpenCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Campo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Campos Ativos</CardTitle>
                    <CardDescription>
                      Arraste para reordenar. Os campos aparecerão nesta ordem nos formulários.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="fields">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {activeFields.map((field, index) => {
                              const FieldIcon = getFieldTypeIcon(field.field_type);
                              return (
                                <Draggable key={field.id} draggableId={field.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                        snapshot.isDragging ? 'bg-accent shadow-lg' : 'bg-card hover:bg-muted/50'
                                      }`}
                                    >
                                      <div {...provided.dragHandleProps} className="cursor-grab">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div className="p-1.5 rounded bg-muted">
                                        <FieldIcon className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{field.field_label}</span>
                                          {field.is_required && (
                                            <Badge variant="destructive" className="text-[10px] h-4">Obrigatório</Badge>
                                          )}
                                          <Badge variant="outline" className="text-[10px] h-4">{field.field_type}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {field.section_name} · {field.field_name}
                                          {field.description ? ` · ${field.description}` : ''}
                                        </p>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(field)}>
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                              <EyeOff className="h-3.5 w-3.5" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Desativar Campo</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                O campo "{field.field_label}" será desativado mas os dados existentes serão preservados.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => deleteMutation.mutate(field.id)}>
                                                Desativar
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </Card>
              )}

              {inactiveFields.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Campos Desativados ({inactiveFields.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {inactiveFields.map((field) => {
                        const FieldIcon = getFieldTypeIcon(field.field_type);
                        return (
                          <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border opacity-60">
                            <div className="p-1.5 rounded bg-muted">
                              <FieldIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm line-through">{field.field_label}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">Desativado</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formState.id ? 'Editar Campo' : 'Novo Campo Personalizado'}</DialogTitle>
            <DialogDescription>
              {formState.id
                ? 'Atualize as configurações do campo personalizado'
                : `Criar um novo campo para ${ENTITY_TABS.find(t => t.value === activeEntity)?.label || activeEntity}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome de Exibição *</Label>
                <Input
                  value={formState.field_label}
                  onChange={(e) => setFormState(prev => ({ ...prev, field_label: e.target.value }))}
                  placeholder="Ex: CNPJ da Empresa"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Campo (slug)</Label>
                <Input
                  value={formState.field_name}
                  onChange={(e) => setFormState(prev => ({ ...prev, field_name: e.target.value }))}
                  placeholder="Auto-gerado do nome"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo do Campo *</Label>
                <Select
                  value={formState.field_type}
                  onValueChange={(v) => setFormState(prev => ({ ...prev, field_type: v as CustomFieldType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((ft) => {
                      const Icon = ft.icon;
                      return (
                        <SelectItem key={ft.value} value={ft.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {ft.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Seção</Label>
                <Input
                  value={formState.section_name}
                  onChange={(e) => setFormState(prev => ({ ...prev, section_name: e.target.value }))}
                  placeholder="Campos Personalizados"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={formState.placeholder}
                  onChange={(e) => setFormState(prev => ({ ...prev, placeholder: e.target.value }))}
                  placeholder="Texto de ajuda no campo"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Padrão</Label>
                <Input
                  value={formState.default_value}
                  onChange={(e) => setFormState(prev => ({ ...prev, default_value: e.target.value }))}
                  placeholder="Valor inicial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do campo para ajudar os usuários"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formState.is_required}
                onCheckedChange={(checked) => setFormState(prev => ({ ...prev, is_required: checked }))}
              />
              <Label>Campo obrigatório</Label>
            </div>

            {/* Options for select/multiselect */}
            {showOptions && (
              <div className="space-y-2">
                <Label>Opções</Label>
                <div className="flex gap-2">
                  <Input
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Adicionar opção..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formState.options.map((opt, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {opt.label}
                      <button
                        onClick={() => handleRemoveOption(i)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Rules */}
            {showNumericValidation && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    value={formState.validation_min}
                    onChange={(e) => setFormState(prev => ({ ...prev, validation_min: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Máximo</Label>
                  <Input
                    type="number"
                    value={formState.validation_max}
                    onChange={(e) => setFormState(prev => ({ ...prev, validation_max: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {showTextValidation && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Comprimento Mínimo</Label>
                  <Input
                    type="number"
                    value={formState.validation_min_length}
                    onChange={(e) => setFormState(prev => ({ ...prev, validation_min_length: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comprimento Máximo</Label>
                  <Input
                    type="number"
                    value={formState.validation_max_length}
                    onChange={(e) => setFormState(prev => ({ ...prev, validation_max_length: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending || !formState.field_label.trim()}>
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formState.id ? 'Atualizar' : 'Criar Campo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
