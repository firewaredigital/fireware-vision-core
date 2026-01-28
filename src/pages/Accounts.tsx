import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  annual_revenue: number | null;
  employee_count: number | null;
  created_at: string;
}

export default function Accounts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('accounts').select('*').order('name');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load accounts' });
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  const deleteAccount = async (id: string) => {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete account' });
    } else {
      toast({ title: 'Account deleted' });
      fetchAccounts();
    }
  };

  const filteredAccounts = accounts.filter((a) =>
    searchQuery === '' || a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number | null) =>
    value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : '-';

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
            <p className="text-muted-foreground">Manage your customer accounts</p>
          </div>
          <Button size="sm" onClick={() => navigate('/accounts/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Account
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No accounts found</p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/accounts/new')}>Create Account</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell><Link to={`/accounts/${account.id}`} className="font-medium hover:underline">{account.name}</Link></TableCell>
                    <TableCell>{account.industry || '-'}</TableCell>
                    <TableCell>{account.phone || '-'}</TableCell>
                    <TableCell>{formatCurrency(account.annual_revenue)}</TableCell>
                    <TableCell>{account.employee_count || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(account.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/accounts/${account.id}`)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/accounts/${account.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteAccount(account.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
