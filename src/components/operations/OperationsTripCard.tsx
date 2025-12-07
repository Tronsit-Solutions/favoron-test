import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, ChevronDown, ChevronUp, Loader2, Package, Phone, Plane } from 'lucide-react';
import { formatDateUTC } from '@/lib/formatters';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

interface PackageItem {
  id: string;
  item_description: string;
  status: string;
  shopper_name: string;
  label_number?: number | null;
}

interface TripGroup {
  trip_id: string;
  traveler_name: string;
  traveler_phone: string | null;
  arrival_date: string;
  from_city: string;
  to_city: string;
  packages: PackageItem[];
}

interface OperationsTripCardProps {
  trip: TripGroup;
  onConfirmPackage: (packageId: string) => Promise<void>;
  onConfirmAll: (packageIds: string[]) => Promise<void>;
  confirmingIds: Set<string>;
}

const OperationsTripCard = ({ trip, onConfirmPackage, onConfirmAll, confirmingIds }: OperationsTripCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingAll, setConfirmingAll] = useState(false);

  const today = startOfDay(new Date());
  const arrivalDate = startOfDay(parseISO(trip.arrival_date));
  const daysUntilArrival = differenceInDays(arrivalDate, today);

  const getUrgencyBadge = () => {
    if (daysUntilArrival < 0) {
      const daysOverdue = Math.abs(daysUntilArrival);
      return (
        <Badge variant="destructive" className="font-medium">
          🔴 Llegó hace {daysOverdue} día{daysOverdue !== 1 ? 's' : ''}
        </Badge>
      );
    } else if (daysUntilArrival === 0) {
      return (
        <Badge className="bg-yellow-500 text-yellow-50 font-medium">
          🟡 Llega hoy
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700 font-medium">
          🟢 Llega en {daysUntilArrival} día{daysUntilArrival !== 1 ? 's' : ''}
        </Badge>
      );
    }
  };

  const pendingPackages = trip.packages.filter(p => 
    ['in_transit', 'received_by_traveler', 'pending_office_confirmation'].includes(p.status)
  );
  const confirmedCount = trip.packages.length - pendingPackages.length;

  const handleSelectPackage = (packageId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(packageId);
    } else {
      newSelected.delete(packageId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pendingPackages.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleConfirmAll = async () => {
    const idsToConfirm = pendingPackages.map(p => p.id);
    if (idsToConfirm.length === 0) return;
    
    setConfirmingAll(true);
    try {
      await onConfirmAll(idsToConfirm);
    } finally {
      setConfirmingAll(false);
      setSelectedIds(new Set());
    }
  };

  const handleConfirmSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setConfirmingAll(true);
    try {
      await onConfirmAll(Array.from(selectedIds));
    } finally {
      setConfirmingAll(false);
      setSelectedIds(new Set());
    }
  };

  const isAnyConfirming = confirmingIds.size > 0 || confirmingAll;

  return (
    <Card className={`transition-shadow ${daysUntilArrival < 0 ? 'border-destructive/50 shadow-md' : daysUntilArrival === 0 ? 'border-yellow-400/50' : ''}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-start justify-between cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getUrgencyBadge()}
                  <span className="font-semibold text-foreground">{trip.traveler_name || 'Viajero desconocido'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Plane className="h-3.5 w-3.5" />
                    {trip.from_city} → {trip.to_city}
                  </span>
                  <span>|</span>
                  <span>📅 {formatDateUTC(trip.arrival_date)}</span>
                  {trip.traveler_phone && (
                    <>
                      <span>|</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {trip.traveler_phone}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {confirmedCount}/{trip.packages.length} recibidos
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingPackages.length > 0 && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConfirmAll();
                    }}
                    disabled={isAnyConfirming}
                    className="shrink-0"
                  >
                    {confirmingAll ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Confirmar todos
                  </Button>
                )}
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {pendingPackages.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Todos los paquetes han sido confirmados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select all header */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.size === pendingPackages.length && pendingPackages.length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={isAnyConfirming}
                    />
                    <span className="text-sm text-muted-foreground">Seleccionar todos</span>
                  </div>
                  {selectedIds.size > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleConfirmSelected}
                      disabled={isAnyConfirming}
                    >
                      {confirmingAll ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Confirmar seleccionados ({selectedIds.size})
                    </Button>
                  )}
                </div>

                {/* Package list */}
                {pendingPackages.map((pkg) => {
                  const isConfirming = confirmingIds.has(pkg.id);
                  return (
                    <div
                      key={pkg.id}
                      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={selectedIds.has(pkg.id)}
                          onCheckedChange={(checked) => handleSelectPackage(pkg.id, !!checked)}
                          disabled={isAnyConfirming}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{pkg.item_description}</p>
                          <p className="text-sm text-muted-foreground">
                            👤 {pkg.shopper_name}
                            {pkg.label_number && <span className="ml-2">🏷️ #{pkg.label_number}</span>}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onConfirmPackage(pkg.id)}
                        disabled={isAnyConfirming}
                        className="shrink-0 ml-2"
                      >
                        {isConfirming ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmar
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default OperationsTripCard;
