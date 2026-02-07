import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  GitMerge, 
  AlertTriangle,
  Users,
  Building2,
  UserCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye
} from '@/components/icons';

type MergeStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed" | "failed" | "cancelled";

interface MergeRequest {
  id: string;
  organization_id: string;
  entity_type: string;
  source_ids: string[];
  target_id: string;
  merge_rules: Record<string, string>;
  preview_result: Record<string, any>;
  status: MergeStatus;
  requires_approval: boolean;
  requested_by: string | null;
  requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  approval_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  result_entity_id: string | null;
  affected_records: Record<string, number>;
  error_message: string | null;
  created_at: string;
}

interface EntityData {
  id: string;
  [key: string]: any;
}

const statusConfig: Record<MergeStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  approved: { label: "Aprovado", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800", icon: XCircle },
  in_progress: { label: "Em Progresso", color: "bg-blue-100 text-blue-800", icon: Loader2 },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800", icon: CheckCircle },
  failed: { label: "Falhou", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const entityFields: Record<string, string[]> = {
  contact: ["first_name", "last_name", "email", "phone", "title", "department", "address_street", "address_city", "address_state", "description"],
  account: ["name", "email", "phone", "website", "industry", "annual_revenue", "employee_count", "address_street", "address_city", "address_state", "description"],
  lead: ["first_name", "last_name", "email", "phone", "company", "title", "industry", "lead_source", "description"],
};

const fieldLabels: Record<string, string> = {
  first_name: "Nome",
  last_name: "Sobrenome",
  email: "Email",
  phone: "Telefone",
  title: "Cargo",
  department: "Departamento",
  company: "Empresa",
  name: "Nome",
  website: "Website",
  industry: "Indústria",
  annual_revenue: "Receita Anual",
  employee_count: "Funcionários",
  lead_source: "Origem",
  address_street: "Endereço",
  address_city: "Cidade",
  address_state: "Estado",
  description: "Descrição",
};

export default function MergeWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [mergeRules, setMergeRules] = useState<Record<string, string>>({});
  const [approvalNotes, setApprovalNotes] = useState("");

  // Fetch merge request
  const { data: mergeRequest, isLoading: loadingRequest } = useQuery({
    queryKey: ["merge-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merge_requests")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as MergeRequest;
    },
    enabled: !!id,
  });

  // Fetch source entities
  const { data: sourceEntities = [], isLoading: loadingEntities } = useQuery({
    queryKey: ["merge-source-entities", mergeRequest?.entity_type, mergeRequest?.source_ids],
    queryFn: async () => {
      if (!mergeRequest) return [];
      
      const tableName = mergeRequest.entity_type === "contact" ? "contacts" : 
                        mergeRequest.entity_type === "account" ? "accounts" : "leads";
      
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .in("id", mergeRequest.source_ids);
      
      if (error) throw error;
      return data as EntityData[];
    },
    enabled: !!mergeRequest,
  });

  // Fetch target entity
  const { data: targetEntity, isLoading: loadingTarget } = useQuery({
    queryKey: ["merge-target-entity", mergeRequest?.entity_type, mergeRequest?.target_id],
    queryFn: async () => {
      if (!mergeRequest) return null;
      
      const tableName = mergeRequest.entity_type === "contact" ? "contacts" : 
                        mergeRequest.entity_type === "account" ? "accounts" : "leads";
      
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", mergeRequest.target_id)
        .single();
      
      if (error) throw error;
      return data as EntityData;
    },
    enabled: !!mergeRequest,
  });

  // Initialize merge rules with target values
  useEffect(() => {
    if (targetEntity && mergeRequest && Object.keys(mergeRules).length === 0) {
      const fields = entityFields[mergeRequest.entity_type] || [];
      const initialRules: Record<string, string> = {};
      fields.forEach(field => {
        initialRules[field] = "target"; // Default to target value
      });
      setMergeRules(initialRules);
    }
  }, [targetEntity, mergeRequest]);

  // Update merge request
  const updateMergeMutation = useMutation({
    mutationFn: async (updates: Partial<MergeRequest>) => {
      const { error } = await supabase
        .from("merge_requests")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merge-request", id] });
    },
  });

  // Execute merge
  const executeMergeMutation = useMutation({
    mutationFn: async () => {
      if (!mergeRequest || !targetEntity) throw new Error("Dados insuficientes");

      // Start merge
      await supabase
        .from("merge_requests")
        .update({ 
          status: "in_progress", 
          started_at: new Date().toISOString(),
          merge_rules: mergeRules,
        })
        .eq("id", id);

      // Build merged data
      const allEntities = [targetEntity, ...sourceEntities];
      const mergedData: Record<string, any> = {};
      const fields = entityFields[mergeRequest.entity_type] || [];

      fields.forEach(field => {
        const rule = mergeRules[field] || "target";
        if (rule === "target") {
          mergedData[field] = targetEntity[field];
        } else if (rule.startsWith("source_")) {
          const sourceIndex = parseInt(rule.replace("source_", ""));
          mergedData[field] = sourceEntities[sourceIndex]?.[field] || targetEntity[field];
        } else if (rule === "keep_all") {
          // For arrays or combine
          const values = allEntities.map(e => e[field]).filter(Boolean);
          mergedData[field] = values.join("; ");
        }
      });

      // Update target entity
      const tableName = mergeRequest.entity_type === "contact" ? "contacts" : 
                        mergeRequest.entity_type === "account" ? "accounts" : "leads";

      const { error: updateError } = await supabase
        .from(tableName)
        .update(mergedData)
        .eq("id", mergeRequest.target_id);

      if (updateError) throw updateError;

      // Track affected records (simplified)
      const affectedRecords: Record<string, number> = {
        activities: 0,
        notes: 0,
        attachments: 0,
      };

      // Complete merge
      const { error: completeError } = await supabase
        .from("merge_requests")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString(),
          result_entity_id: mergeRequest.target_id,
          affected_records: affectedRecords,
          preview_result: mergedData,
        })
        .eq("id", id);

      if (completeError) throw completeError;

      return { affectedRecords, mergedData };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["merge-request", id] });
      toast.success(`Merge concluído! ${Object.values(result.affectedRecords).reduce((a, b) => a + b, 0)} registros atualizados`);
      navigate("/data/duplicates");
    },
    onError: (error) => {
      toast.error("Erro ao executar merge");
      console.error(error);
      // Mark as failed
      supabase
        .from("merge_requests")
        .update({ 
          status: "failed", 
          error_message: error instanceof Error ? error.message : "Erro desconhecido",
        })
        .eq("id", id);
    },
  });

  // Approve/Reject mutation
  const decideMutation = useMutation({
    mutationFn: async (approved: boolean) => {
      const { error } = await supabase
        .from("merge_requests")
        .update({
          status: approved ? "approved" : "rejected",
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
          approval_notes: approvalNotes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, approved) => {
      queryClient.invalidateQueries({ queryKey: ["merge-request", id] });
      toast.success(approved ? "Merge aprovado" : "Merge rejeitado");
      if (!approved) navigate("/data/duplicates");
    },
  });

  const isLoading = loadingRequest || loadingEntities || loadingTarget;
  const allEntities = targetEntity ? [targetEntity, ...sourceEntities] : sourceEntities;
  const fields = mergeRequest ? (entityFields[mergeRequest.entity_type] || []) : [];

  // Generate preview of merged result
  const generatePreview = () => {
    if (!targetEntity) return {};
    const preview: Record<string, any> = {};
    fields.forEach(field => {
      const rule = mergeRules[field] || "target";
      if (rule === "target") {
        preview[field] = targetEntity[field];
      } else if (rule.startsWith("source_")) {
        const sourceIndex = parseInt(rule.replace("source_", ""));
        preview[field] = sourceEntities[sourceIndex]?.[field] || targetEntity[field];
      } else if (rule === "keep_all") {
        const values = allEntities.map(e => e[field]).filter(Boolean);
        preview[field] = values.join("; ");
      }
    });
    return preview;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!mergeRequest) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Solicitação não encontrada</h2>
        <Button onClick={() => navigate("/data/duplicates")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[mergeRequest.status];
  const StatusIcon = statusInfo.icon;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/data/duplicates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Merge de Registros</h1>
            <p className="text-muted-foreground">
              Mescle {sourceEntities.length + 1} registros de {mergeRequest.entity_type}
            </p>
          </div>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s === step ? 'bg-primary text-primary-foreground' : 
                s < step ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={`ml-2 ${s === step ? 'font-medium' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Selecionar Valores' : s === 2 ? 'Revisar' : 'Executar'}
              </span>
              {s < 3 && <ArrowRight className="h-4 w-4 mx-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Values */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecione os Valores para Cada Campo</CardTitle>
              <CardDescription>
                Escolha qual valor será mantido para cada campo no registro final
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field) => (
                <div key={field} className="space-y-3">
                  <Label className="text-base font-medium">
                    {fieldLabels[field] || field}
                  </Label>
                  <RadioGroup
                    value={mergeRules[field] || "target"}
                    onValueChange={(value) => setMergeRules(prev => ({ ...prev, [field]: value }))}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {/* Target option */}
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="target" id={`${field}-target`} />
                      <Label htmlFor={`${field}-target`} className="flex-1 cursor-pointer">
                        <span className="block text-sm font-medium">Principal</span>
                        <span className="block text-sm text-muted-foreground truncate">
                          {targetEntity?.[field] || "(vazio)"}
                        </span>
                      </Label>
                    </div>
                    
                    {/* Source options */}
                    {sourceEntities.map((source, index) => (
                      <div key={source.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={`source_${index}`} id={`${field}-source-${index}`} />
                        <Label htmlFor={`${field}-source-${index}`} className="flex-1 cursor-pointer">
                          <span className="block text-sm font-medium">Fonte {index + 1}</span>
                          <span className="block text-sm text-muted-foreground truncate">
                            {source[field] || "(vazio)"}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Separator className="mt-4" />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => navigate("/data/duplicates")}>
                  Cancelar
                </Button>
                <Button onClick={() => setStep(2)}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registros Originais</CardTitle>
                <CardDescription>
                  Registros que serão mesclados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {allEntities.map((entity, index) => (
                  <div key={entity.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Principal" : `Fonte ${index}`}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {fields.slice(0, 6).map(field => (
                        <div key={field} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{fieldLabels[field] || field}:</span>
                          <span className="font-medium truncate ml-2">{entity[field] || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview do Resultado</CardTitle>
                <CardDescription>
                  Como ficará o registro após o merge
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <div className="flex items-center gap-2 mb-3">
                    <GitMerge className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Registro Mesclado</span>
                  </div>
                  <div className="space-y-2">
                    {fields.map(field => {
                      const preview = generatePreview();
                      const rule = mergeRules[field] || "target";
                      return (
                        <div key={field} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{fieldLabels[field] || field}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{preview[field] || "-"}</span>
                            <Badge variant="outline" className="text-xs">
                              {rule === "target" ? "Principal" : rule.replace("source_", "Fonte ")}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {mergeRequest.requires_approval && mergeRequest.status === "pending" && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label>Notas de Aprovação</Label>
                      <Textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Adicione notas sobre sua decisão..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex gap-2">
                {mergeRequest.status === "pending" && mergeRequest.requires_approval && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => decideMutation.mutate(false)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                    <Button onClick={() => decideMutation.mutate(true)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                  </>
                )}
                {(mergeRequest.status === "approved" || !mergeRequest.requires_approval) && (
                  <Button onClick={() => setStep(3)}>
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Execute */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Executar Merge</CardTitle>
              <CardDescription>
                Confirme para executar a mesclagem dos registros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Atenção: Esta ação não pode ser desfeita
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Os registros fonte serão mesclados ao registro principal e todos os 
                      relacionamentos (atividades, notas, anexos) serão transferidos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold">{allEntities.length}</p>
                  <p className="text-sm text-muted-foreground">Registros envolvidos</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold">{fields.length}</p>
                  <p className="text-sm text-muted-foreground">Campos configurados</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold">1</p>
                  <p className="text-sm text-muted-foreground">Registro final</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={() => executeMergeMutation.mutate()}
                  disabled={executeMergeMutation.isPending}
                >
                  {executeMergeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <GitMerge className="h-4 w-4 mr-2" />
                      Executar Merge
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
