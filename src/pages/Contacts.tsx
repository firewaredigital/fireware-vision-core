import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  created_at: string;
}

export default function Contacts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('contacts').select('*').order('last_name');
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load contacts' });
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  };

  const filteredContacts = contacts.filter((c) =>
    searchQuery === '' || `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">Manage your contact relationships</p>
          </div>
          <Button size="sm" onClick={() => navigate('/contacts/new')}><Plus className="mr-2 h-4 w-4" /> New Contact</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No contacts found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell><Link to={`/contacts/${contact.id}`} className="font-medium hover:underline">{contact.first_name} {contact.last_name}</Link></TableCell>
                    <TableCell>{contact.email || '-'}</TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell>{contact.job_title || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(contact.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}`)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/contacts/${contact.id}/edit`)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
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
