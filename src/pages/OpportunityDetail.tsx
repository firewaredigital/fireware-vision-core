import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/opportunities')}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">Opportunity Details</h1>
        </div>
        <Card><CardHeader><CardTitle>Opportunity: {id}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Details coming soon...</p></CardContent></Card>
      </div>
    </AppLayout>
  );
}
