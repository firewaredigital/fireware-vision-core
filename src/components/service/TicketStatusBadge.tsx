import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from '@/components/icons';

type TicketStatus = 'new' | 'open' | 'pending' | 'on_hold' | 'resolved' | 'closed';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TicketStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: React.ReactNode;
  className: string;
}> = {
  new: {
    label: 'Novo',
    variant: 'default',
    icon: <AlertCircle className="h-3 w-3" />,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  open: {
    label: 'Aberto',
    variant: 'default',
    icon: <Play className="h-3 w-3" />,
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  pending: {
    label: 'Pendente',
    variant: 'secondary',
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  on_hold: {
    label: 'Em Espera',
    variant: 'outline',
    icon: <Pause className="h-3 w-3" />,
    className: 'bg-gray-500 hover:bg-gray-600 text-white',
  },
  resolved: {
    label: 'Resolvido',
    variant: 'default',
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
  closed: {
    label: 'Fechado',
    variant: 'secondary',
    icon: <XCircle className="h-3 w-3" />,
    className: 'bg-slate-600 hover:bg-slate-700 text-white',
  },
};

export function TicketStatusBadge({ 
  status, 
  showIcon = true,
  size = 'sm' 
}: TicketStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.new;
  
  return (
    <Badge 
      className={`${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'} gap-1`}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
