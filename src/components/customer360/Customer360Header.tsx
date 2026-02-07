import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Mail, Phone } from '@/components/icons';

interface Customer360HeaderProps {
  entityType: string;
  entityName: string;
  entity: any;
  healthScore: any;
}

export function Customer360Header({ entityType, entityName, entity, healthScore }: Customer360HeaderProps) {
  const navigate = useNavigate();

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-start gap-4">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={entity.avatar_url} />
            <AvatarFallback className="text-lg">
              {entityName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{entityName}</h1>
            <div className="flex items-center gap-4 mt-1 text-muted-foreground">
              {entity.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{entity.email}</span>
                </div>
              )}
              {entity.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{entity.phone}</span>
                </div>
              )}
              {entity.industry && (
                <Badge variant="secondary">{entity.industry}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      {healthScore && (
        <Card className="w-48">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Health Score</p>
            <div className={`text-4xl font-bold ${getHealthColor(healthScore.score || 50)}`}>
              {healthScore.score || 50}
            </div>
            <Progress value={healthScore.score || 50} className="mt-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
