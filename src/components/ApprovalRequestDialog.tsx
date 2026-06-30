import { useState, useEffect , useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  DollarSign,
  FileText,
  RefreshCw,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ApprovalType = 'discount' | 'special_terms' | 'contract' | 'price_override' | 'credit_limit' | 'exception';

interface ApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
  entityName: string;
  approvalType: ApprovalType;
  requestedValue: Record<string, unknown>;
  originalValue: Record<string, unknown>;
  onSuccess?: () => void;
}

interface Approver {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
}

const approvalTypeConfig: Record<ApprovalType, { label: string; icon: React.ReactNode; description: string }> = {
  discount: {
    label: 'Discount Approval',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Request approval for discount exceeding threshold',
  },
  special_terms: {
    label: 'Special Terms',
    icon: <FileText className="h-5 w-5" />,
    description: 'Request approval for special contract terms',
  },
  contract: {
    label: 'Contract Approval',
    icon: <FileText className="h-5 w-5" />,
    description: 'Request approval for contract execution',
  },
  price_override: {
    label: 'Price Override',
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Request approval for price override',
  },
  credit_limit: {
    label: 'Credit Limit',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'Request approval for credit limit exception',
  },
  exception: {
    label: 'Exception Request',
    icon: <AlertTriangle className="h-5 w-5" />,
    description: 'Request approval for general exception',
  },
};

export function ApprovalRequestDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  approvalType,
  requestedValue,
  originalValue,
  onSuccess,
}: ApprovalRequestDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [selectedApprover, setSelectedApprover] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchApprovers();
    }
  }, [open, fetchApprovers]);

  const fetchApprovers = useCallback( async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .in('role', ['manager', 'admin'])
      .neq('id', profile?.id);

    if (data) {
      setApprovers(data);
      if (data.length === 1) {
        setSelectedApprover(data[0].id);
      }
    }
  }, [profile?.organization_id, profile?.id]);

  const handleSubmit = async () => {
    if (!profile?.organization_id || !selectedApprover) return;

    setSubmitting(true);

    const config = approvalTypeConfig[approvalType];

    const { error } = await supabase.from('approval_requests').insert([{
      organization_id: profile.organization_id,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      approval_type: approvalType,
      title: `${config.label} for ${entityName}`,
      description: config.description,
      reason: reason,
      requested_value: JSON.parse(JSON.stringify(requestedValue)),
      original_value: JSON.parse(JSON.stringify(originalValue)),
      requested_by: profile.id,
      assigned_to: selectedApprover,
      status: 'pending',
    }]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit approval request',
      });
    } else {
      // Create notification for approver
      await supabase.from('notifications').insert([{
        organization_id: profile.organization_id,
        user_id: selectedApprover,
        title: `New Approval Request: ${config.label}`,
        message: `${profile.first_name} ${profile.last_name} has requested approval for ${entityName}`,
        type: 'approval',
        entity_type: entityType,
        entity_id: entityId,
        priority: 'high',
      }]);

      toast({
        title: 'Approval requested',
        description: 'Your request has been submitted for approval.',
      });
      onOpenChange(false);
      setReason('');
      setSelectedApprover('');
      onSuccess?.();
    }

    setSubmitting(false);
  };

  const config = approvalTypeConfig[approvalType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.label}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Entity Info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{entityName}</span>
              <Badge variant="secondary">{entityType}</Badge>
            </div>
          </div>

          {/* Value Comparison */}
          {(requestedValue.discount_percent !== undefined || requestedValue.total !== undefined) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Original Value</p>
                <p className="font-medium">
                  {originalValue.discount_percent !== undefined
                    ? `${originalValue.discount_percent}% discount`
                    : typeof originalValue.total === 'number'
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(originalValue.total)
                    : JSON.stringify(originalValue)
                  }
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Requested Value</p>
                <p className="font-medium text-primary">
                  {requestedValue.discount_percent !== undefined
                    ? `${requestedValue.discount_percent}% discount`
                    : typeof requestedValue.total === 'number'
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(requestedValue.total)
                    : JSON.stringify(requestedValue)
                  }
                </p>
              </div>
            </div>
          )}

          {/* Approver Selection */}
          <div className="space-y-2">
            <Label>Assign to Approver *</Label>
            <Select value={selectedApprover} onValueChange={setSelectedApprover}>
              <SelectTrigger>
                <SelectValue placeholder="Select approver" />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((approver) => (
                  <SelectItem key={approver.id} value={approver.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{approver.first_name} {approver.last_name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {approver.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Request *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this approval is needed..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedApprover || !reason || submitting}
          >
            {submitting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Clock className="mr-2 h-4 w-4" />
            )}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Pending Approvals Widget for Dashboard
export function PendingApprovalsWidget() {
  const { profile } = useAuth();
  const [approvals, setApprovals] = useState<Array<{
    id: string;
    title: string;
    entity_name: string;
    approval_type: ApprovalType;
    status: string;
    created_at: string;
    requester: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingApprovals();
  }, [profile, fetchPendingApprovals]);

  const fetchPendingApprovals = useCallback( async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        id,
        title,
        entity_name,
        approval_type,
        status,
        created_at,
        requester:profiles!approval_requests_requested_by_fkey(first_name, last_name)
      `)
      .eq('assigned_to', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setApprovals(data as typeof approvals);
    }
    setLoading(false);
  }, [profile?.organization_id, profile?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No pending approvals</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {approvals.map((approval) => {
        const config = approvalTypeConfig[approval.approval_type];
        return (
          <div
            key={approval.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
          >
            <div className="p-2 bg-warning/10 rounded-lg">
              {config.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{approval.title}</p>
              <p className="text-sm text-muted-foreground">
                From {approval.requester?.first_name} {approval.requester?.last_name}
              </p>
            </div>
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
