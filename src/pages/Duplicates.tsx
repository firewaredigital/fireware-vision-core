import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  Users, 
  Building2, 
  UserCircle, 
  GitMerge, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Percent,
  RefreshCw,
  Settings,
  Zap,
  Filter
} from '@/components/icons';

type DuplicateStatus = "detected" | "confirmed" | "false_positive" | "merged" | "ignored";

interface DetectedDuplicate {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_ids: string[];
  match_reasons: { field: string; values?: string[]; confidence: number }[];
  similarity_score: number;
  status: DuplicateStatus;
  suggested_primary_id: string | null;
  decision_by: string | null;
  decision_at: string | null;
  decision_notes: string | null;
  merge_request_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DuplicateRule {
  id: string;
  organization_id: string;
  entity_type: string;
  name: string;
  description: string | null;
  match_fields: { field: string; match_type: string; weight: number }[];
  threshold_score: number;
  auto_merge_threshold: number | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

const statusConfig: Record<DuplicateStatus, { label: string; color: string; icon: React.ElementType }> = {
  detected: { label: "Detectada", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  false_positive: { label: "Falso Positivo", color: "bg-gray-100 text-gray-800", icon: XCircle },
  merged: { label: "Mesclada", color: "bg-green-100 text-green-800", icon: GitMerge },
  ignored: { label: "Ignorada", color: "bg-gray-100 text-gray-600", icon: XCircle },
};

const entityTypeLabels: Record<string, { label: string; icon: React.ElementType }> = {
  contact: { label: "Contato", icon: UserCircle },
  account: { label: "Conta", icon: Building2 },
  lead: { label: "Lead", icon: Users },
};

export default function Duplicates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("detected");
  const [selectedDuplicate, setSelectedDuplicate] = useState<DetectedDuplicate | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [showRulesDialog, setShowRulesDialog] = useState(false);

  // Fetch duplicates
  const { data: duplicates = [], isLoading } = useQuery({
    queryKey: ["detected-duplicates", entityFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("detected_duplicates")
        .select("*")
        .order("similarity_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch rules
  const { data: rules = [] } = useQuery({
    queryKey: ["duplicate-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("duplicate_detection_rules")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Fetch entity details for display
  const { data: entityDetails = {} } = useQuery({
    queryKey: ["duplicate-entity-details", duplicates],
    queryFn: async () => {
      const details: Record<string, { name: string; email?: string }> = {};
      
      for (const dup of duplicates) {
        for (const entityId of dup.entity_ids) {
          if (!details[entityId]) {
            if (dup.entity_type === "contact") {
              const { data } = await supabase
                .from("contacts")
                .select("first_name, last_name, email")
                .eq("id", entityId)
                .single();
              if (data) {
                details[entityId] = {
                  name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                  email: data.email || undefined,
                };
              }
            } else if (dup.entity_type === "account") {
              const { data } = await supabase
                .from("accounts")
                .select("name, email")
                .eq("id", entityId)
                .single();
              if (data) {
                details[entityId] = { name: data.name, email: data.email || undefined };
              }
            } else if (dup.entity_type === "lead") {
              const { data } = await supabase
                .from("leads")
                .select("first_name, last_name, email")
                .eq("id", entityId)
                .single();
              if (data) {
                details[entityId] = {
                  name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                  email: data.email || undefined,
                };
              }
            }
          }
        }
      }
      
      return details;
    },
    enabled: duplicates.length > 0,
  });

  // Update duplicate status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: DuplicateStatus; notes?: string }) => {
      const { error } = await supabase
        .from("detected_duplicates")
        .update({
          status,
          decision_by: profile?.id,
          decision_at: new Date().toISOString(),
          decision_notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["detected-duplicates"] });
      toast.success("Status atualizado com sucesso");
      setSelectedDuplicate(null);
      setDecisionNotes("");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  // Create merge request
  const createMergeMutation = useMutation({
    mutationFn: async (duplicate: DetectedDuplicate) => {
      const targetId = duplicate.suggested_primary_id || duplicate.entity_ids[0];
      const sourceIds = duplicate.entity_ids.filter(id => id !== targetId);

      const { data, error } = await supabase
        .from("merge_requests")
        .insert({
          organization_id: duplicate.organization_id,
          entity_type: duplicate.entity_type,
          source_ids: sourceIds,
          target_id: targetId,
          status: "pending",
          requested_by: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update duplicate with merge request id
      await supabase
        .from("detected_duplicates")
        .update({ merge_request_id: data.id, status: "confirmed" })
        .eq("id", duplicate.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["detected-duplicates"] });
      queryClient.invalidateQueries({ queryKey: ["merge-requests"] });
      toast.success("Solicitação de merge criada");
    },
    onError: () => {
      toast.error("Erro ao criar solicitação de merge");
    },
  });

  // Stats
  const stats = {
    total: duplicates.length,
    detected: duplicates.filter(d => d.status === "detected").length,
    highConfidence: duplicates.filter(d => d.similarity_score >= 90).length,
    pending: duplicates.filter(d => d.status === "detected" || d.status === "confirmed").length,
  };

  const filteredDuplicates = duplicates.filter(dup => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return dup.entity_ids.some(id => {
      const details = entityDetails[id];
      return details?.name?.toLowerCase().includes(term) || 
             details?.email?.toLowerCase().includes(term);
    });
  });

  return (
    <>
      <div className="space-y-6">
        <ModuleHeroBanner
          module="admin"
          title="Duplicatas"
          subtitle="Detecte e gerencie registros duplicados no sistema"
          compact
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRulesDialog(true)} className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Settings className="h-4 w-4" /> Regras
              </Button>
              <Button className="gap-2 bg-white text-foreground hover:bg-white/90">
                <Zap className="h-4 w-4" /> Executar Detecção
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Detectadas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">registros com potenciais duplicatas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Revisão</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.detected}</div>
              <p className="text-xs text-muted-foreground">precisam de análise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alta Confiança</CardTitle>
              <Percent className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highConfidence}</div>
              <p className="text-xs text-muted-foreground">similaridade ≥ 90%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Regras Ativas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</div>
              <p className="text-xs text-muted-foreground">de {rules.length} regras configuradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="contact">Contatos</SelectItem>
                  <SelectItem value="account">Contas</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="detected">Detectadas</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="false_positive">Falso Positivo</SelectItem>
                  <SelectItem value="merged">Mescladas</SelectItem>
                  <SelectItem value="ignored">Ignoradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Duplicates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Duplicatas Detectadas</CardTitle>
            <CardDescription>
              Revise e tome ações sobre os registros duplicados identificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDuplicates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma duplicata encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Razão do Match</TableHead>
                    <TableHead>Similaridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detectado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDuplicates.map((dup) => {
                    const entityConfig = entityTypeLabels[dup.entity_type] || { label: dup.entity_type, icon: Users };
                    const EntityIcon = entityConfig.icon;
                    const statusInfo = statusConfig[dup.status];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow key={dup.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <EntityIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{entityConfig.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {dup.entity_ids.map((id, index) => {
                              const details = entityDetails[id];
                              const isPrimary = id === dup.suggested_primary_id;
                              return (
                                <div key={id} className="flex items-center gap-2">
                                  {isPrimary && (
                                    <Badge variant="outline" className="text-xs">Principal</Badge>
                                  )}
                                  <span className={isPrimary ? "font-medium" : ""}>
                                    {details?.name || `ID: ${id.slice(0, 8)}...`}
                                  </span>
                                  {details?.email && (
                                    <span className="text-xs text-muted-foreground">
                                      ({details.email})
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dup.match_reasons.map((reason, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {reason.field}: {reason.confidence}%
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  dup.similarity_score >= 90 ? 'bg-green-500' : 
                                  dup.similarity_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${dup.similarity_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{dup.similarity_score}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(dup.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDuplicate(dup)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {dup.status === "detected" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => createMergeMutation.mutate(dup)}
                                >
                                  <GitMerge className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateStatusMutation.mutate({ 
                                    id: dup.id, 
                                    status: "false_positive" 
                                  })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Duplicate Detail Dialog */}
        <Dialog open={!!selectedDuplicate} onOpenChange={() => setSelectedDuplicate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Duplicata</DialogTitle>
              <DialogDescription>
                Revise os registros e tome uma decisão
              </DialogDescription>
            </DialogHeader>
            {selectedDuplicate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Entidade</label>
                    <p className="text-muted-foreground capitalize">{selectedDuplicate.entity_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Similaridade</label>
                    <p className="text-muted-foreground">{selectedDuplicate.similarity_score}%</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Registros Envolvidos</label>
                  <div className="mt-2 space-y-2">
                    {selectedDuplicate.entity_ids.map((id) => {
                      const details = entityDetails[id];
                      return (
                        <div key={id} className="p-3 border rounded-lg">
                          <p className="font-medium">{details?.name || id}</p>
                          {details?.email && (
                            <p className="text-sm text-muted-foreground">{details.email}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Razões do Match</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDuplicate.match_reasons.map((reason, index) => (
                      <Badge key={index} variant="outline">
                        {reason.field}: {reason.confidence}%
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedDuplicate.status === "detected" && (
                  <div>
                    <label className="text-sm font-medium">Notas da Decisão</label>
                    <Textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Adicione notas sobre sua decisão..."
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedDuplicate?.status === "detected" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedDuplicate.id,
                      status: "false_positive",
                      notes: decisionNotes,
                    })}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Falso Positivo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      id: selectedDuplicate.id,
                      status: "ignored",
                      notes: decisionNotes,
                    })}
                  >
                    Ignorar
                  </Button>
                  <Button
                    onClick={() => createMergeMutation.mutate(selectedDuplicate)}
                  >
                    <GitMerge className="h-4 w-4 mr-2" />
                    Criar Merge
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rules Dialog */}
        <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Regras de Detecção de Duplicatas</DialogTitle>
              <DialogDescription>
                Configure as regras utilizadas para identificar registros duplicados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma regra configurada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Campos</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell className="capitalize">{rule.entity_type}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {rule.match_fields.map((field, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {field.field} ({field.weight}%)
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{rule.threshold_score}%</TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? "default" : "secondary"}>
                            {rule.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRulesDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
