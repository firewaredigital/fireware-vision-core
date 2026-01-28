import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

export default function Quotes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);
  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold">Quotes</h1><p className="text-muted-foreground">Manage proposals and quotes</p></div>
          <Button onClick={() => navigate('/quotes/new')}><Plus className="mr-2 h-4 w-4" />New Quote</Button>
        </div>
        <Card><CardHeader><CardTitle>Quotes List</CardTitle></CardHeader><CardContent className="flex items-center justify-center h-64"><div className="text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4" /><p>No quotes yet</p></div></CardContent></Card>
      </div>
    </AppLayout>
  );
}
