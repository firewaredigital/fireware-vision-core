import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user, loading } = useAuth(); const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);
  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Configure your CRM</p></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Pipeline Stages</CardTitle><CardDescription>Configure opportunity stages</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">Coming soon...</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Lead Sources</CardTitle><CardDescription>Manage lead source options</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">Coming soon...</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Win/Loss Reasons</CardTitle><CardDescription>Track deal outcomes</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">Coming soon...</p></CardContent></Card>
          <Card><CardHeader><CardTitle>Team Management</CardTitle><CardDescription>Manage users and teams</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">Coming soon...</p></CardContent></Card>
        </div>
      </div>
    </AppLayout>
  );
}
