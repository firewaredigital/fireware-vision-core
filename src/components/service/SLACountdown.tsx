import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  XCircle 
} from 'lucide-react';
import { differenceInMinutes, differenceInHours, differenceInSeconds, isPast, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SLACountdownProps {
  dueAt: string | null;
  completedAt?: string | null;
  breached?: boolean;
  showProgress?: boolean;
  createdAt?: string;
  compact?: boolean;
}

export function SLACountdown({ 
  dueAt, 
  completedAt, 
  breached = false,
  showProgress = false,
  createdAt,
  compact = true
}: SLACountdownProps) {
  const [now, setNow] = useState(new Date());

  // Update every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!dueAt) {
    return (
      <span className="text-xs text-muted-foreground">
        Sem SLA definido
      </span>
    );
  }

  const dueDate = new Date(dueAt);
  const isCompleted = !!completedAt;
  const completedDate = completedAt ? new Date(completedAt) : null;
  const isOverdue = !isCompleted && isPast(dueDate);

  // Calculate time remaining or elapsed
  const getTimeDisplay = () => {
    const targetDate = isCompleted ? completedDate! : dueDate;
    const referenceDate = isCompleted ? dueDate : now;
    
    if (isCompleted) {
      const minutesDiff = differenceInMinutes(targetDate, dueDate);
      if (minutesDiff < 0) {
        // Completed before due
        const absMinutes = Math.abs(minutesDiff);
        if (absMinutes < 60) {
          return `${absMinutes}m antes`;
        }
        return `${Math.floor(absMinutes / 60)}h ${absMinutes % 60}m antes`;
      } else if (minutesDiff > 0) {
        // Completed after due (breached)
        if (minutesDiff < 60) {
          return `${minutesDiff}m após`;
        }
        return `${Math.floor(minutesDiff / 60)}h ${minutesDiff % 60}m após`;
      }
      return 'No prazo';
    }

    if (isOverdue) {
      const minutesOverdue = differenceInMinutes(now, dueDate);
      if (minutesOverdue < 60) {
        return `${minutesOverdue}m atrasado`;
      }
      const hours = Math.floor(minutesOverdue / 60);
      const mins = minutesOverdue % 60;
      if (hours < 24) {
        return `${hours}h ${mins}m atrasado`;
      }
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h atrasado`;
    }

    // Time remaining
    const minutesRemaining = differenceInMinutes(dueDate, now);
    const secondsRemaining = differenceInSeconds(dueDate, now) % 60;
    
    if (minutesRemaining < 0) {
      return 'Expirado';
    }
    
    if (minutesRemaining < 1) {
      return `${secondsRemaining}s`;
    }
    
    if (minutesRemaining < 60) {
      return `${minutesRemaining}m ${secondsRemaining}s`;
    }
    
    const hours = Math.floor(minutesRemaining / 60);
    const mins = minutesRemaining % 60;
    
    if (hours < 24) {
      return `${hours}h ${mins}m`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  // Calculate progress percentage if createdAt is provided
  const getProgress = () => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const totalTime = differenceInMinutes(dueDate, created);
    const elapsed = differenceInMinutes(now, created);
    
    if (totalTime <= 0) return 100;
    const progress = Math.min((elapsed / totalTime) * 100, 100);
    return Math.max(progress, 0);
  };

  const getStatusIcon = () => {
    if (isCompleted && !breached) {
      return <CheckCircle2 className="h-3 w-3 text-green-500" />;
    }
    if (breached || isOverdue) {
      return <XCircle className="h-3 w-3 text-destructive" />;
    }
    
    const minutesRemaining = differenceInMinutes(dueDate, now);
    if (minutesRemaining < 30) {
      return <AlertTriangle className="h-3 w-3 text-orange-500 animate-pulse" />;
    }
    
    return <Clock className="h-3 w-3 text-muted-foreground" />;
  };

  const getStatusColor = () => {
    if (isCompleted && !breached) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    if (breached || isOverdue) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    
    const minutesRemaining = differenceInMinutes(dueDate, now);
    if (minutesRemaining < 30) {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    if (minutesRemaining < 120) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const progress = getProgress();
  const progressColor = () => {
    if (breached || isOverdue) return 'bg-destructive';
    if (progress > 80) return 'bg-orange-500';
    if (progress > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${getStatusColor()} gap-1 text-xs cursor-help`}
          >
            {getStatusIcon()}
            {getTimeDisplay()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">
              {isCompleted ? 'Respondido em' : 'Prazo para resposta'}
            </p>
            <p>{format(dueDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
            {isCompleted && completedDate && (
              <p className="text-muted-foreground">
                Concluído em: {format(completedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge 
          variant="outline" 
          className={`${getStatusColor()} gap-1 text-xs`}
        >
          {getStatusIcon()}
          {getTimeDisplay()}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(dueDate, "dd/MM 'às' HH:mm")}
        </span>
      </div>
      {showProgress && !isCompleted && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progress)}% do tempo utilizado
          </p>
        </div>
      )}
    </div>
  );
}
