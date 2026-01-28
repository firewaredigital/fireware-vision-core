import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

export default function QuoteForm() {
  const { id } = useParams(); const navigate = useNavigate(); const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);
  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}><ArrowLeft className="h-4 w-4" /></Button><h1 className="text-2xl font-bold">{id ? 'Edit Quote' : 'New Quote'}</h1></div>
        <Card><CardHeader><CardTitle>Quote Builder</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Form coming soon...</p></CardContent></Card>
      </div>
    </AppLayout>
  );
}
