import { Badge } from '@/components/ui/badge';
import { 
  ArrowDown, 
  Minus, 
  ArrowUp, 
  AlertTriangle 
} from 'lucide-react';

type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<TicketPriority, {
  label: string;
  icon: React.ReactNode;
  className: string;
  iconClassName: string;
}> = {
  low: {
    label: 'Baixa',
    icon: <ArrowDown className="h-3 w-3" />,
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
    iconClassName: 'text-slate-500',
  },
  medium: {
    label: 'Média',
    icon: <Minus className="h-3 w-3" />,
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
    iconClassName: 'text-blue-500',
  },
  high: {
    label: 'Alta',
    icon: <ArrowUp className="h-3 w-3" />,
    className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200',
    iconClassName: 'text-orange-500',
  },
  critical: {
    label: 'Crítica',
    icon: <AlertTriangle className="h-3 w-3" />,
    className: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200 animate-pulse',
    iconClassName: 'text-red-500',
  },
};

export function TicketPriorityBadge({ 
  priority, 
  showIcon = true,
  showLabel = true,
  size = 'sm' 
}: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  
  return (
    <Badge 
      variant="outline"
      className={`${config.className} ${size === 'sm' ? 'text-xs' : 'text-sm'} gap-1`}
    >
      {showIcon && <span className={config.iconClassName}>{config.icon}</span>}
      {showLabel && config.label}
    </Badge>
  );
}
