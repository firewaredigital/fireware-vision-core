import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Upload,
  LogIn,
  LogOut,
  FileText,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { exportToCSV } from '@/components/CSVImportDialog';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  changes: Record<string, unknown> | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  [key: string]: unknown;
}

const actionIcons: Record<string, typeof Eye> = {
  create: Edit,
  update: Edit,
  delete: Trash2,
  view: Eye,
  export: Download,
  import: Upload,
  login: LogIn,
  logout: LogOut,
};

const actionColors: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/20',
  update: 'bg-info/10 text-info border-info/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  view: 'bg-muted text-muted-foreground border-muted',
  export: 'bg-warning/10 text-warning border-warning/20',
  import: 'bg-primary/10 text-primary border-primary/20',
  login: 'bg-success/10 text-success border-success/20',
  logout: 'bg-muted text-muted-foreground border-muted',
};

const entityTypes = [
  { value: 'all', label: 'All Entities' },
  { value: 'lead', label: 'Leads' },
  { value: 'account', label: 'Accounts' },
  { value: 'contact', label: 'Contacts' },
  { value: 'opportunity', label: 'Opportunities' },
  { value: 'quote', label: 'Quotes' },
  { value: 'product', label: 'Products' },
  { value: 'activity', label: 'Activities' },
  { value: 'territory', label: 'Territories' },
  { value: 'cadence', label: 'Cadences' },
  { value: 'forecast', label: 'Forecasts' },
];

const actionTypes = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
  { value: 'export', label: 'Export' },
  { value: 'import', label: 'Import' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
];

const dateRanges = [
  { value: '1', label: 'Last 24 hours' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
];

export default function AuditLogs() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchLogs();
    }
  }, [user, profile, debouncedSearch, entityFilter, actionFilter, dateRange, customDateFrom, customDateTo, page]);

  const fetchLogs = async () => {
    if (!profile?.organization_id) return;
    
    // Check if user has permission (admin or manager)
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to view audit logs',
      });
      navigate('/dashboard');
      return;
    }

    setLoading(true);
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    // Apply date filter
    let fromDate: Date;
    let toDate = new Date();
    
    if (dateRange === 'custom' && customDateFrom && customDateTo) {
      fromDate = startOfDay(customDateFrom);
      toDate = endOfDay(customDateTo);
    } else {
      const days = parseInt(dateRange) || 7;
      fromDate = subDays(new Date(), days);
    }
    
    query = query
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString());

    // Apply entity filter
    if (entityFilter !== 'all') {
      query = query.eq('entity_type', entityFilter);
    }

    // Apply action filter
    if (actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    // Apply search filter
    if (debouncedSearch) {
      query = query.or(`user_email.ilike.%${debouncedSearch}%,entity_name.ilike.%${debouncedSearch}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load audit logs',
      });
    } else {
      const mappedData: AuditLog[] = (data || []).map((item) => ({
        ...item,
        changes: (typeof item.changes === 'object' ? item.changes : {}) as Record<string, unknown> | null,
        old_values: (typeof item.old_values === 'object' ? item.old_values : {}) as Record<string, unknown> | null,
        new_values: (typeof item.new_values === 'object' ? item.new_values : {}) as Record<string, unknown> | null,
        metadata: (typeof item.metadata === 'object' ? item.metadata : {}) as Record<string, unknown> | null,
      }));
      setLogs(mappedData);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    if (logs.length === 0) {
      toast({
        title: 'No data to export',
        description: 'Apply filters to find audit logs first',
      });
      return;
    }

    const columns = [
      { key: 'created_at', label: 'Timestamp' },
      { key: 'user_email', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'entity_type', label: 'Entity Type' },
      { key: 'entity_name', label: 'Entity Name' },
      { key: 'ip_address', label: 'IP Address' },
    ];

    await exportToCSV(logs as unknown as Record<string, unknown>[], 'audit_logs', columns);

    toast({
      title: 'Export complete',
      description: `Exported ${logs.length} audit log entries`,
    });
  };

  const renderChanges = (log: AuditLog) => {
    if (!log.old_values || !log.new_values) return null;
    
    const oldKeys = Object.keys(log.old_values);
    const newKeys = Object.keys(log.new_values);
    const allKeys = [...new Set([...oldKeys, ...newKeys])];
    
    if (allKeys.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Field Changes:</p>
        <div className="space-y-1">
          {allKeys.map((key) => {
            const oldVal = log.old_values[key];
            const newVal = log.new_values[key];
            if (oldVal === newVal) return null;
            
            return (
              <div key={key} className="text-sm">
                <span className="font-medium text-muted-foreground">{key}:</span>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-destructive line-through">
                    {oldVal !== undefined ? String(oldVal) : '(empty)'}
                  </span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-success">
                    {newVal !== undefined ? String(newVal) : '(empty)'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (authLoading || !user) {
    return null;
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all actions and changes in your organization
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    {customDateFrom ? format(customDateFrom, 'PP') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    {customDateTo ? format(customDateTo, 'PP') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Events</p>
            <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Creates</p>
            <p className="text-2xl font-bold text-success">
              {logs.filter(l => l.action === 'create').length}
            </p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Updates</p>
            <p className="text-2xl font-bold text-info">
              {logs.filter(l => l.action === 'update').length}
            </p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">Deletes</p>
            <p className="text-2xl font-bold text-destructive">
              {logs.filter(l => l.action === 'delete').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[200px]">User</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead className="w-[120px]">Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No audit logs found</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText;
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {format(new Date(log.created_at), 'PP')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'p')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-[150px]">
                              {log.user_email || 'System'}
                            </p>
                            {log.ip_address && (
                              <p className="text-xs text-muted-foreground">
                                {log.ip_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionColors[log.action]}>
                          <ActionIcon className="mr-1 h-3 w-3" />
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium capitalize">{log.entity_type}</p>
                          {log.entity_id && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.entity_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="truncate max-w-[300px]">
                          {log.entity_name || '-'}
                        </p>
                        {Object.keys(log.new_values || {}).length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {Object.keys(log.new_values).length} field(s) changed
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Log Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this audit event
              </DialogDescription>
            </DialogHeader>
            
            {selectedLog && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Timestamp</p>
                      <p className="font-medium">
                        {format(new Date(selectedLog.created_at), 'PPpp')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">User</p>
                      <p className="font-medium">{selectedLog.user_email || 'System'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Action</p>
                      <Badge variant="outline" className={actionColors[selectedLog.action]}>
                        {selectedLog.action.charAt(0).toUpperCase() + selectedLog.action.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entity Type</p>
                      <p className="font-medium capitalize">{selectedLog.entity_type}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Entity Info */}
                  <div>
                    <p className="text-sm font-medium mb-2">Entity Information</p>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{selectedLog.entity_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID</span>
                        <span className="font-mono text-sm">{selectedLog.entity_id || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Changes */}
                  {(selectedLog.action === 'update' || selectedLog.action === 'create') && (
                    <>
                      <Separator />
                      <div>
                        {renderChanges(selectedLog)}
                      </div>
                    </>
                  )}

                  {/* Technical Info */}
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Technical Details</p>
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IP Address</span>
                        <span className="font-mono">{selectedLog.ip_address || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User Agent</span>
                        <span className="truncate max-w-[300px]">{selectedLog.user_agent || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session ID</span>
                        <span className="font-mono">{selectedLog.session_id || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Additional Metadata</p>
                        <pre className="p-3 bg-muted/50 rounded-lg text-xs overflow-auto">
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
