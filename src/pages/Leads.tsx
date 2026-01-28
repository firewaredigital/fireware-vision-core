import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  source: string | null;
  score: number;
  created_at: string;
  owner_id: string | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-info/10 text-info border-info/20',
  contacted: 'bg-warning/10 text-warning border-warning/20',
  qualified: 'bg-success/10 text-success border-success/20',
  unqualified: 'bg-muted text-muted-foreground border-muted',
  converted: 'bg-primary/10 text-primary border-primary/20',
};

export default function Leads() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load leads',
      });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete lead',
      });
    } else {
      toast({
        title: 'Lead deleted',
        description: 'The lead has been successfully deleted.',
      });
      fetchLeads();
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === '' ||
      `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (authLoading || !user) {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground">
              Manage and track your sales leads
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={() => navigate('/leads/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <Button variant="ghost" className="p-0 hover:bg-transparent">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-muted-foreground">No leads found</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/leads/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first lead
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link to={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.first_name} {lead.last_name}
                      </Link>
                      {lead.job_title && (
                        <p className="text-sm text-muted-foreground">{lead.job_title}</p>
                      )}
                    </TableCell>
                    <TableCell>{lead.company || '-'}</TableCell>
                    <TableCell>{lead.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[lead.status]}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.min(lead.score, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{lead.score}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lead.source || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteLead(lead.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination placeholder */}
        {filteredLeads.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredLeads.length} of {leads.length} leads
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
