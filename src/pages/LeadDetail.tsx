import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Calendar,
  User,
  Activity,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  website: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  source: string | null;
  score: number;
  rating: string | null;
  description: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  new: 'bg-info/10 text-info border-info/20',
  contacted: 'bg-warning/10 text-warning border-warning/20',
  qualified: 'bg-success/10 text-success border-success/20',
  unqualified: 'bg-muted text-muted-foreground border-muted',
  converted: 'bg-primary/10 text-primary border-primary/20',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchLead();
    }
  }, [id, user]);

  const fetchLead = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load lead details',
      });
      navigate('/leads');
    } else {
      setLead(data);
    }
    setLoading(false);
  };

  const deleteLead = async () => {
    if (!id) return;

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
      navigate('/leads');
    }
  };

  const formatAddress = () => {
    if (!lead) return null;
    const parts = [
      lead.address_street,
      lead.address_city,
      lead.address_state,
      lead.address_postal_code,
      lead.address_country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
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

  if (!lead) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={() => navigate('/leads')}>Back to Leads</Button>
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
              onClick={() => navigate('/leads')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {lead.first_name} {lead.last_name}
                </h1>
                <Badge variant="outline" className={statusColors[lead.status]}>
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {lead.job_title && lead.company
                  ? `${lead.job_title} at ${lead.company}`
                  : lead.job_title || lead.company || 'No company'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {lead.status !== 'converted' && (
              <Button variant="outline" onClick={() => navigate(`/leads/${id}/convert`)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Convert
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/leads/${id}/edit`)}>
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
                  <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this lead? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteLead}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activities">Activities</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                    <CardDescription>Contact and company details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Contact Information
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {lead.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${lead.email}`} className="text-sm hover:underline">
                              {lead.email}
                            </a>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                        {lead.mobile && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${lead.mobile}`} className="text-sm hover:underline">
                              {lead.mobile} (Mobile)
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Company Info */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        Company Information
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {lead.company && (
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.company}</span>
                          </div>
                        )}
                        {lead.industry && (
                          <div className="flex items-center gap-3">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.industry}</span>
                          </div>
                        )}
                        {lead.website && (
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                            >
                              {lead.website}
                            </a>
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

                    {lead.description && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Description
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">{lead.description}</p>
                        </div>
                      </>
                    )}

                    {lead.tags && lead.tags.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag) => (
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

              <TabsContent value="activities" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Activities</CardTitle>
                      <CardDescription>Calls, meetings, and tasks</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Log Activity
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Activity className="h-8 w-8 mb-2" />
                      <p>No activities yet</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Notes</CardTitle>
                      <CardDescription>Internal notes and comments</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Note
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>No notes yet</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                    <CardDescription>Complete history of interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                      <Calendar className="h-8 w-8 mb-2" />
                      <p>No timeline events yet</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Lead Score */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="8"
                        strokeDasharray={`${(lead.score / 100) * 226} 226`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold">{lead.score}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {lead.score >= 80
                        ? 'Hot Lead'
                        : lead.score >= 50
                        ? 'Warm Lead'
                        : 'Cold Lead'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Source</span>
                  <span>{lead.source || 'Unknown'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span>{lead.rating || 'Not rated'}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified</span>
                  <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  Log a Call
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Assign Owner
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
