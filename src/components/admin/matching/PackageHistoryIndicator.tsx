import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, RotateCcw, X } from 'lucide-react';
import { Package } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PackageHistoryIndicatorProps {
  package: Package;
}

export const PackageHistoryIndicator = ({ package: pkg }: PackageHistoryIndicatorProps) => {
  // Check if package has quote history
  const hasRejectionReason = pkg.rejection_reason && pkg.rejection_reason.trim() !== '';
  const wantsRequote = pkg.wants_requote === true;
  const hasAdminLog = pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log) && pkg.admin_actions_log.length > 0;
  
  // Determine the type of re-quote
  let indicatorType: 'expired' | 'rejected' | 'new' = 'new';
  let tooltipContent = '';
  let badgeText = '';
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let Icon = Clock;

  if (hasRejectionReason && wantsRequote) {
    // Manual rejection with re-quote request
    indicatorType = 'rejected';
    badgeText = 'Recotización';
    badgeVariant = 'destructive';
    Icon = RotateCcw;
    tooltipContent = `Razón: ${pkg.rejection_reason}`;
  } else if (wantsRequote) {
    // Re-quote request without rejection reason
    indicatorType = 'rejected';
    badgeText = 'Recotización';
    badgeVariant = 'secondary';
    Icon = RotateCcw;
    tooltipContent = 'Solicitud de nueva cotización';
  } else if (hasAdminLog) {
    // Check admin log for expiration
    const logs = pkg.admin_actions_log as any[];
    const hasExpiration = logs.some(log => 
      log.action?.includes('expire') || 
      log.action?.includes('timeout') ||
      log.details?.includes('expired')
    );
    
    if (hasExpiration) {
      indicatorType = 'expired';
      badgeText = 'Cotización expirada';
      badgeVariant = 'secondary';
      Icon = Clock;
      tooltipContent = 'Sin respuesta del shopper en 24 horas';
    }
  }

  // If it's a new package, don't show indicator
  if (indicatorType === 'new') {
    return null;
  }

  // Get last update time if available
  const lastUpdate = pkg.updated_at ? new Date(pkg.updated_at) : null;
  const timeAgo = lastUpdate ? formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es }) : '';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className="text-xs gap-1">
            <Icon className="h-3 w-3" />
            {badgeText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {indicatorType === 'expired' 
                ? 'Cotización expirada automáticamente' 
                : 'Cotización rechazada por shopper'
              }
            </p>
            {tooltipContent && (
              <p className="text-sm text-muted-foreground">{tooltipContent}</p>
            )}
            {timeAgo && (
              <p className="text-xs text-muted-foreground">Hace {timeAgo}</p>
            )}
            <p className="text-xs">
              {indicatorType === 'expired' 
                ? 'El shopper no respondió en el tiempo límite' 
                : 'El shopper solicitó una nueva cotización'
              }
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};