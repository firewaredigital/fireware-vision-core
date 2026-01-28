import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  PhoneOff,
  MailX,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Timeline } from '@/components/Timeline';
import { NotesWidget } from '@/components/NotesWidget';
import { ActivitiesWidget } from '@/components/ActivitiesWidget';
import { format } from 'date-fns';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  department: string | null;
  role: string | null;
  do_not_call: boolean;
  do_not_email: boolean;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  account?: {
    id: string;
    name: string;
  };
  owner?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface OpportunityContact {
  id: string;
  role: string | null;
  is_primary: boolean;
  opportunity: {
    id: string;
    name: string;
    stage: string;
    amount: number | null;
  };
}

const roleColors: Record<string, string> = {
  decision_maker: 'bg-primary/10 text-primary',
  technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  financial: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  influencer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  end_user: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  other: 'bg-muted text-muted-foreground',
};

const stageColors: Record<string, string> = {
  prospecting: 'bg-info/10 text-info border-info/20',
  qualification: 'bg-warning/10 text-warning border-warning/20',
  proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  negotiation: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  closed_won: 'bg-success/10 text-success border-success/20',
  closed_lost: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchContactData();
    }
  }, [id, user]);

  const fetchContactData = async () => {
    setLoading(true);

    // Fetch contact with relations
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select(`
        *,
        account:accounts!contacts_account_id_fkey(id, name),
        owner:profiles!contacts_owner_id_fkey(first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (contactError) {
      console.error('Error fetching contact:', contactError);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load contact details',
      });
      navigate('/contacts');
      return;
    }

    setContact(contactData);

    // Fetch related opportunities via junction table
    const { data: oppsData } = await supabase
      .from('opportunity_contacts')
      .select(`
        id,
        role,
        is_primary,
        opportunity:opportunities!opportunity_contacts_opportunity_id_fkey(id, name, stage, amount)
      `)
      .eq('contact_id', id);

    setOpportunities(oppsData || []);

    setLoading(false);
  };

  const deleteContact = async () => {
    if (!id) return;

    const { error } = await supabase.from('contacts').delete().eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete contact',
      });
    } else {
      toast({
        title: 'Contact deleted',
        description: 'The contact has been successfully deleted.',
      });
      navigate('/contacts');
    }
  };

  const formatCurrency = (value: number | null) =>
    value
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value)
      : '-';

  const formatAddress = () => {
    if (!contact) return null;
    const parts = [
      contact.address_street,
      contact.address_city,
      contact.address_state,
      contact.address_postal_code,
      contact.address_country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getOwnerName = () => {
    if (contact?.owner) {
      if (contact.owner.first_name || contact.owner.last_name) {
        return `${contact.owner.first_name || ''} ${contact.owner.last_name || ''}`.trim();
      }
      return contact.owner.email;
    }
    return 'Unassigned';
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Contact not found</p>
          <Button onClick={() => navigate('/contacts')}>Back to Contacts</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate('/contacts')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {contact.first_name} {contact.last_name}
                </h1>
                {contact.role && (
                  <Badge variant="outline" className={roleColors[contact.role] || roleColors.other}>
                    {contact.role.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {contact.job_title || 'No title'}
                {contact.account && (
                  <>
                    {' at '}
                    <Link to={`/accounts/${contact.account.id}`} className="hover:underline">
                      {contact.account.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/contacts/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this contact? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteContact}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Communication Preferences Warning */}
        {(contact.do_not_call || contact.do_not_email) && (
          <div className="flex gap-4 p-4 rounded-lg border border-warning/50 bg-warning/10">
            {contact.do_not_call && (
              <div className="flex items-center gap-2 text-warning">
                <PhoneOff className="h-4 w-4" />
                <span className="text-sm font-medium">Do not call</span>
              </div>
            )}
            {contact.do_not_email && (
              <div className="flex items-center gap-2 text-warning">
                <MailX className="h-4 w-4" />
                <span className="text-sm font-medium">Do not email</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>Personal and professional details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Contact Details
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {contact.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${contact.phone}`} className="text-sm hover:underline">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${contact.mobile}`} className="text-sm hover:underline">
                              {contact.mobile} (Mobile)
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Professional Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Professional Information
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {contact.job_title && (
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.job_title}</span>
                          </div>
                        )}
                        {contact.department && (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{contact.department}</span>
                          </div>
                        )}
                        {contact.account && (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <Link
                              to={`/accounts/${contact.account.id}`}
                              className="text-sm hover:underline"
                            >
                              {contact.account.name}
                            </Link>
                          </div>
                        )}
                        {formatAddress() && (
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm">{formatAddress()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {contact.description && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Description
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">{contact.description}</p>
                        </div>
                      </>
                    )}

                    {contact.tags && contact.tags.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {contact.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="opportunities" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Related Opportunities</CardTitle>
                    <CardDescription>Deals this contact is involved with</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {opportunities.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <User className="h-8 w-8 mb-2" />
                        <p>Not involved in any opportunities</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opportunity</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opportunities.map((oc) => (
                            <TableRow key={oc.id}>
                              <TableCell>
                                <Link
                                  to={`/opportunities/${oc.opportunity.id}`}
                                  className="font-medium hover:underline"
                                >
                                  {oc.opportunity.name}
                                  {oc.is_primary && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Primary
                                    </Badge>
                                  )}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {oc.role && (
                                  <Badge variant="outline" className={roleColors[oc.role] || roleColors.other}>
                                    {oc.role.replace('_', ' ')}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={stageColors[oc.opportunity.stage] || ''}>
                                  {oc.opportunity.stage.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(oc.opportunity.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activities" className="mt-6">
                <ActivitiesWidget contactId={id} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>Complete history of interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Timeline contactId={id} maxHeight="500px" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span>{getOwnerName()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account</span>
                  {contact.account ? (
                    <Link to={`/accounts/${contact.account.id}`} className="hover:underline">
                      {contact.account.name}
                    </Link>
                  ) : (
                    <span>None</span>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span>{contact.role?.replace('_', ' ') || 'Not set'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span>{contact.department || 'Not set'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(contact.created_at), 'MMM d, yyyy')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{format(new Date(contact.updated_at), 'MMM d, yyyy')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <NotesWidget contactId={id} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
