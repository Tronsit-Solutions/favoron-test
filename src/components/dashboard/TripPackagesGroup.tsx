
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, MapPin, Calendar, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CollapsibleTravelerPackageCard from "./CollapsibleTravelerPackageCard";
import { formatDateUTC } from "@/lib/formatters";

interface TripPackagesGroupProps {
  trip: any;
  packages: any[];
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'user' | 'admin') => void;
  onConfirmReceived: (packageId: string, photo?: string) => void;
  onConfirmOfficeDelivery?: (packageId: string) => void;
  onDismissExpiredPackage?: (packageId: string) => void;
  updatePackage: (id: string, updates: any) => Promise<any>;
  defaultExpanded?: boolean;
}

const TripPackagesGroup = ({ 
  trip, 
  packages,
  getStatusBadge,
  onQuote,
  onConfirmReceived,
  onConfirmOfficeDelivery,
  onDismissExpiredPackage,
  updatePackage,
  defaultExpanded = false
}: TripPackagesGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Calculate trip-specific metrics
  const totalTips = packages.reduce((sum, pkg) => {
    if (pkg.quote?.price) {
      return sum + parseFloat(pkg.quote.price);
    }
    return sum;
  }, 0);

  const packagesWithTips = packages.filter(pkg => pkg.quote?.price).length;
  const pendingQuotes = packages.filter(pkg => pkg.status === 'matched').length;
  const hasPendingActions = packages.some(pkg => ['matched', 'in_transit'].includes(pkg.status));

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className={hasPendingActions ? "ring-1 ring-primary/30 shadow-md" : ""}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{trip.from_city} → {trip.to_city}</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 sm:p-0 rounded-md hover:bg-muted/50 transition-colors">
                    {isExpanded ? <ChevronUp className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />}
                  </div>
                </CardTitle>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Fecha de viaje: {formatDateUTC(trip.arrival_date)}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {packages.length} paquete{packages.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {hasPendingActions && (
                  <Badge variant="default" className="text-xs">
                    Acción requerida
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Trip-specific metrics */}
            {(totalTips > 0 || pendingQuotes > 0) && (
              <div className="mb-4 p-3 bg-muted/30 rounded-lg border">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="font-semibold">Q{totalTips.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Ganancia total</p>
                  </div>
                  <div>
                    <p className="font-semibold">{packagesWithTips}</p>
                    <p className="text-xs text-muted-foreground">Con cotización</p>
                  </div>
                  <div>
                    <p className="font-semibold">{pendingQuotes}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Packages for this trip */}
            <div className="space-y-3 bg-muted/10 rounded-lg p-2">
              {packages
                .sort((a, b) => {
                   const aPriority = ['matched', 'in_transit', 'pending_office_confirmation'].includes(a.status) ? 1 : 0;
                   const bPriority = ['matched', 'in_transit', 'pending_office_confirmation'].includes(b.status) ? 1 : 0;
                  if (aPriority !== bPriority) return bPriority - aPriority;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((pkg) => {
                  const hasPendingAction = ['matched', 'pending_office_confirmation'].includes(pkg.status);
                  return (
                    <CollapsibleTravelerPackageCard
                      key={pkg.id}
                      pkg={pkg}
                      getStatusBadge={getStatusBadge}
                      onQuote={onQuote}
                      onConfirmReceived={onConfirmReceived}
                      onConfirmOfficeDelivery={onConfirmOfficeDelivery}
                      onDismissExpiredPackage={onDismissExpiredPackage}
                      updatePackage={updatePackage}
                      hasPendingAction={hasPendingAction}
                      autoExpand={false}
                    />
                  );
                })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default TripPackagesGroup;
