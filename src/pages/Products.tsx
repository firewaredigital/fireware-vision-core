import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

export default function Products() {
  const { user, loading } = useAuth(); const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);
  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold">Products</h1><p className="text-muted-foreground">Manage your product catalog</p></div>
        <Card><CardHeader><CardTitle>Product Catalog</CardTitle></CardHeader><CardContent className="flex items-center justify-center h-64"><div className="text-center text-muted-foreground"><Package className="h-12 w-12 mx-auto mb-4" /><p>No products yet</p></div></CardContent></Card>
      </div>
    </AppLayout>
  );
}
