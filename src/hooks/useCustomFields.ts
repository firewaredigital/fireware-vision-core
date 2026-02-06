import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { STALE_TIMES, GC_TIMES } from '@/lib/queryConfig';
import { useToast } from '@/hooks/use-toast';

export type CustomFieldType =
  | 'text' | 'number' | 'decimal' | 'date' | 'datetime' | 'boolean'
  | 'select' | 'multiselect' | 'url' | 'email' | 'phone' | 'textarea' | 'lookup';

export type CustomFieldEntityType = 'lead' | 'contact' | 'account' | 'opportunity' | 'ticket' | 'order';

export interface CustomFieldDefinition {
  id: string;
  organization_id: string;
  entity_type: CustomFieldEntityType;
  field_name: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required: boolean;
  default_value: string | null;
  options: { label: string; value: string; color?: string }[];
  validation_rules: {
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    pattern?: string;
    pattern_message?: string;
  };
  display_order: number;
  section_name: string;
  is_active: boolean;
  description: string | null;
  placeholder: string | null;
  lookup_entity: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  organization_id: string;
  field_definition_id: string;
  entity_type: CustomFieldEntityType;
  entity_id: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_boolean: boolean | null;
  value_json: any | null;
  created_at: string;
  updated_at: string;
}

// Get the raw value from a custom field value record based on field type
export function getFieldValue(fieldDef: CustomFieldDefinition, fieldValue?: CustomFieldValue): any {
  if (!fieldValue) return fieldDef.default_value ?? null;

  switch (fieldDef.field_type) {
    case 'number':
    case 'decimal':
      return fieldValue.value_number;
    case 'boolean':
      return fieldValue.value_boolean;
    case 'date':
    case 'datetime':
      return fieldValue.value_date;
    case 'multiselect':
    case 'lookup':
      return fieldValue.value_json;
    default:
      return fieldValue.value_text;
  }
}

// Prepare value for saving based on field type
function prepareValueForSave(fieldDef: CustomFieldDefinition, value: any) {
  const base = {
    value_text: null as string | null,
    value_number: null as number | null,
    value_date: null as string | null,
    value_boolean: null as boolean | null,
    value_json: null as any,
  };

  if (value === null || value === undefined || value === '') return base;

  switch (fieldDef.field_type) {
    case 'number':
    case 'decimal':
      base.value_number = typeof value === 'number' ? value : parseFloat(value);
      break;
    case 'boolean':
      base.value_boolean = Boolean(value);
      break;
    case 'date':
    case 'datetime':
      base.value_date = value;
      break;
    case 'multiselect':
    case 'lookup':
      base.value_json = value;
      break;
    default:
      base.value_text = String(value);
      break;
  }

  return base;
}

// Validate a field value based on definition rules
export function validateFieldValue(
  fieldDef: CustomFieldDefinition,
  value: any
): string | null {
  if (fieldDef.is_required && (value === null || value === undefined || value === '')) {
    return `${fieldDef.field_label} é obrigatório`;
  }

  if (value === null || value === undefined || value === '') return null;

  const rules = fieldDef.validation_rules;

  if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
    return `${fieldDef.field_label} deve ser no mínimo ${rules.min}`;
  }
  if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
    return `${fieldDef.field_label} deve ser no máximo ${rules.max}`;
  }
  if (rules.min_length !== undefined && typeof value === 'string' && value.length < rules.min_length) {
    return `${fieldDef.field_label} deve ter no mínimo ${rules.min_length} caracteres`;
  }
  if (rules.max_length !== undefined && typeof value === 'string' && value.length > rules.max_length) {
    return `${fieldDef.field_label} deve ter no máximo ${rules.max_length} caracteres`;
  }
  if (rules.pattern && typeof value === 'string') {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(value)) {
      return rules.pattern_message || `${fieldDef.field_label} formato inválido`;
    }
  }

  // Type-specific validation
  if (fieldDef.field_type === 'email' && typeof value === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
  }
  if (fieldDef.field_type === 'url' && typeof value === 'string') {
    try {
      new URL(value);
    } catch {
      return 'URL inválida';
    }
  }

  return null;
}

// ---- Hooks ----

export function useCustomFieldDefinitions(entityType: CustomFieldEntityType) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['custom-field-definitions', entityType, profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .order('section_name')
        .order('display_order');

      if (error) throw error;

      return (data || []).map(d => ({
        ...d,
        options: Array.isArray(d.options) ? d.options : [],
        validation_rules: (d.validation_rules && typeof d.validation_rules === 'object' && !Array.isArray(d.validation_rules))
          ? d.validation_rules
          : {},
      })) as CustomFieldDefinition[];
    },
    enabled: !!profile?.organization_id,
    staleTime: STALE_TIMES.static,
    gcTime: GC_TIMES.long,
  });
}

export function useAllCustomFieldDefinitions() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['custom-field-definitions-all', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('entity_type')
        .order('section_name')
        .order('display_order');

      if (error) throw error;

      return (data || []).map(d => ({
        ...d,
        options: Array.isArray(d.options) ? d.options : [],
        validation_rules: (d.validation_rules && typeof d.validation_rules === 'object' && !Array.isArray(d.validation_rules))
          ? d.validation_rules
          : {},
      })) as CustomFieldDefinition[];
    },
    enabled: !!profile?.organization_id,
    staleTime: STALE_TIMES.static,
    gcTime: GC_TIMES.long,
  });
}

export function useCustomFieldValues(entityType: CustomFieldEntityType, entityId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['custom-field-values', entityType, entityId],
    queryFn: async () => {
      if (!entityId || !profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('custom_field_values')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      return (data || []) as CustomFieldValue[];
    },
    enabled: !!entityId && !!profile?.organization_id,
    staleTime: STALE_TIMES.dynamic,
    gcTime: GC_TIMES.medium,
  });
}

export function useSaveCustomFieldValues() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      values,
    }: {
      entityType: CustomFieldEntityType;
      entityId: string;
      values: Record<string, any>;
      definitions: CustomFieldDefinition[];
    }) => {
      if (!profile?.organization_id) throw new Error('Organization not found');

      // For each field definition with a value, upsert
      const upserts = Object.entries(values).map(([fieldDefId, value]) => {
        const fieldDef = arguments[0].definitions.find((d: CustomFieldDefinition) => d.id === fieldDefId);
        if (!fieldDef) return null;

        const prepared = prepareValueForSave(fieldDef, value);

        return {
          organization_id: profile.organization_id,
          field_definition_id: fieldDefId,
          entity_type: entityType,
          entity_id: entityId,
          ...prepared,
        };
      }).filter(Boolean);

      if (upserts.length === 0) return;

      const { error } = await supabase
        .from('custom_field_values')
        .upsert(upserts as any[], {
          onConflict: 'field_definition_id,entity_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['custom-field-values', variables.entityType, variables.entityId],
      });
      toast({ title: 'Campos personalizados salvos' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar campos personalizados',
        description: error.message,
      });
    },
  });
}

export function useSaveCustomFieldDefinition() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (definition: Partial<CustomFieldDefinition> & { entity_type: CustomFieldEntityType }) => {
      if (!profile?.organization_id) throw new Error('Organization not found');

      const payload = {
        ...definition,
        organization_id: profile.organization_id,
        created_by: definition.id ? undefined : profile.id,
      };

      if (definition.id) {
        // Update
        const { error } = await supabase
          .from('custom_field_definitions')
          .update(payload as any)
          .eq('id', definition.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('custom_field_definitions')
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions-all'] });
      toast({ title: 'Campo personalizado salvo' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar campo',
        description: error.message,
      });
    },
  });
}

export function useDeleteCustomFieldDefinition() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions-all'] });
      toast({ title: 'Campo desativado' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao desativar campo',
        description: error.message,
      });
    },
  });
}

export function useUpdateFieldOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      // Update each field's display_order
      for (const update of updates) {
        const { error } = await supabase
          .from('custom_field_definitions')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['custom-field-definitions-all'] });
    },
  });
}
