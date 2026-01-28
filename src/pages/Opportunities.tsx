import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

export default function Opportunities() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Opportunities</h1>
            <p className="text-muted-foreground">Manage your sales pipeline</p>
          </div>
          <Button onClick={() => navigate('/opportunities/new')}><Plus className="mr-2 h-4 w-4" />New Opportunity</Button>
        </div>
        <Card>
          <CardHeader><CardTitle>Pipeline View</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4" />
              <p>No opportunities yet. Create your first deal!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
