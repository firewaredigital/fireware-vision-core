import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Loader2 } from '@/components/icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useCustomFieldDefinitions,
  useCustomFieldValues,
  useSaveCustomFieldValues,
  getFieldValue,
  validateFieldValue,
  type CustomFieldDefinition,
  type CustomFieldEntityType,
} from '@/hooks/useCustomFields';

// Autonomous mode: fetches its own data and manages save internally
interface AutonomousProps {
  entityType: CustomFieldEntityType;
  entityId?: string;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
  // Discriminator: controlled props absent
  definitions?: undefined;
  values?: undefined;
  onChange?: undefined;
}

// Controlled mode: receives data from parent, parent handles save
interface ControlledProps {
  entityType: CustomFieldEntityType;
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  readOnly?: boolean;
  compact?: boolean;
  className?: string;
  // Not used in controlled mode
  entityId?: undefined;
}

type CustomFieldsRendererProps = AutonomousProps | ControlledProps;

function isControlledMode(props: CustomFieldsRendererProps): props is ControlledProps {
  return props.definitions !== undefined && props.onChange !== undefined;
}

export function CustomFieldsRenderer(props: CustomFieldsRendererProps) {
  const {
    entityType,
    readOnly = false,
    compact = false,
    className,
  } = props;

  const controlled = isControlledMode(props);

  // --- Autonomous mode hooks (always called for hooks consistency) ---
  const { data: autoDefs = [], isLoading: defsLoading } = useCustomFieldDefinitions(entityType);
  const { data: autoValues = [], isLoading: valsLoading } = useCustomFieldValues(
    entityType,
    controlled ? undefined : props.entityId
  );
  const saveMutation = useSaveCustomFieldValues();

  // Resolve which definitions/values to use
  const definitions: CustomFieldDefinition[] = controlled ? props.definitions : autoDefs;
  const entityId = controlled ? undefined : props.entityId;

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize values for autonomous mode
  useEffect(() => {
    if (controlled) return;
    if (autoDefs.length > 0) {
      const initial: Record<string, unknown> = {};
      autoDefs.forEach((def) => {
        const fieldValue = autoValues.find((v) => v.field_definition_id === def.id);
        initial[def.id] = getFieldValue(def, fieldValue);
      });
      setFieldValues(initial);
      setIsDirty(false);
    }
  }, [controlled, autoDefs, autoValues]);

  // Sync controlled values
  useEffect(() => {
    if (controlled) {
      setFieldValues(props.values);
    }
  }, [controlled, controlled ? props.values : null, props.values]);

  const updateValue = (fieldId: string, value: unknown) => {
    if (controlled) {
      props.onChange({ ...props.values, [fieldId]: value });
    } else {
      setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
      setIsDirty(true);
    }

    // Clear error on change
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleSave = () => {
    if (controlled || !entityId) return;

    // Validate all fields
    const newErrors: Record<string, string> = {};
    definitions.forEach((def) => {
      const error = validateFieldValue(def, fieldValues[def.id]);
      if (error) newErrors[def.id] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate({
      entityType,
      entityId,
      values: fieldValues,
      definitions,
    });
    setIsDirty(false);
  };

  // Loading only applies to autonomous mode
  if (!controlled && (defsLoading || (entityId && valsLoading))) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  if (definitions.length === 0) return null;

  // Group by section_name
  const sections = definitions.reduce<Record<string, CustomFieldDefinition[]>>((acc, def) => {
    const section = def.section_name || 'Campos Personalizados';
    if (!acc[section]) acc[section] = [];
    acc[section].push(def);
    return acc;
  }, {});

  const sectionKeys = Object.keys(sections);

  const renderField = (def: CustomFieldDefinition) => {
    const value = fieldValues[def.id];
    const error = errors[def.id];

    if (readOnly) {
      return (
        <div key={def.id} className="space-y-1">
          <Label className="text-xs text-muted-foreground">{def.field_label}</Label>
          <p className="text-sm">{formatDisplayValue(def, value)}</p>
        </div>
      );
    }

    return (
      <div key={def.id} className="space-y-1.5">
        <Label htmlFor={def.id} className="text-sm font-medium">
          {def.field_label}
          {def.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {def.description && (
          <p className="text-xs text-muted-foreground">{def.description}</p>
        )}
        {renderFieldInput(def, value, (v: unknown) => updateValue(def.id, v))}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {sectionKeys.length === 1 ? (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            {sectionKeys[0]}
          </h4>
          <div className={cn('grid gap-4', compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
            {sections[sectionKeys[0]].map(renderField)}
          </div>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={sectionKeys} className="w-full">
          {sectionKeys.map((section) => (
            <AccordionItem key={section} value={section}>
              <AccordionTrigger className="text-sm font-medium">
                {section}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {sections[section].length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <div className={cn('grid gap-4 pt-2', compact ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
                  {sections[section].map(renderField)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {!readOnly && !controlled && entityId && isDirty && (
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Campos Personalizados
          </Button>
        </div>
      )}
    </div>
  );
}

function renderFieldInput(
  def: CustomFieldDefinition,
  value: unknown,
  onChange: (value: unknown) => void
) {
  switch (def.field_type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <Input
          id={def.id}
          type={def.field_type === 'email' ? 'email' : def.field_type === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder || ''}
        />
      );

    case 'number':
    case 'decimal':
      return (
        <Input
          id={def.id}
          type="number"
          step={def.field_type === 'decimal' ? '0.01' : '1'}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder={def.placeholder || ''}
        />
      );

    case 'textarea':
      return (
        <Textarea
          id={def.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder || ''}
          rows={3}
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={def.id}
            checked={!!value}
            onCheckedChange={(checked) => onChange(!!checked)}
          />
          <Label htmlFor={def.id} className="text-sm cursor-pointer">
            {def.placeholder || 'Sim'}
          </Label>
        </div>
      );

    case 'select':
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={def.placeholder || 'Selecione...'} />
          </SelectTrigger>
          <SelectContent>
            {def.options.map((opt: unknown) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multiselect': {
      const selected: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {def.options.map((opt: unknown) => {
            const isSelected = selected.includes(opt.value);
            return (
              <Badge
                key={opt.value}
                variant={isSelected ? 'default' : 'outline'}
                className="cursor-pointer select-none"
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((v: string) => v !== opt.value));
                  } else {
                    onChange([...selected, opt.value]);
                  }
                }}
              >
                {opt.label}
              </Badge>
            );
          })}
        </div>
      );
    }

    case 'date':
    case 'datetime':
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value
                ? format(new Date(value), def.field_type === 'datetime' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: ptBR })
                : def.placeholder || 'Selecionar data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => onChange(date?.toISOString() || null)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      );

    default:
      return (
        <Input
          id={def.id}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder || ''}
        />
      );
  }
}

function formatDisplayValue(def: CustomFieldDefinition, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  switch (def.field_type) {
    case 'boolean':
      return value ? 'Sim' : 'Não';
    case 'date':
      return format(new Date(value), 'dd/MM/yyyy', { locale: ptBR });
    case 'datetime':
      return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    case 'number':
      return Number(value).toLocaleString('pt-BR');
    case 'decimal':
      return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    case 'select': {
      const opt = def.options.find((o: unknown) => o.value === value);
      return opt?.label || value;
    }
    case 'multiselect': {
      if (!Array.isArray(value)) return '—';
      return value
        .map((v: string) => {
          const opt = def.options.find((o: unknown) => o.value === v);
          return opt?.label || v;
        })
        .join(', ');
    }
    default:
      return String(value);
  }
}
