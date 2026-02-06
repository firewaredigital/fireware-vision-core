import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login for now - would call authenticate_partner_user RPC
    toast.info('Portal do Parceiro em configuração. Contate o administrador.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary"><Flame className="h-7 w-7 text-primary-foreground" /></div>
          </div>
          <CardTitle className="text-2xl">Portal do Parceiro</CardTitle>
          <CardDescription>Acesse sua conta de parceiro Fireware CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
