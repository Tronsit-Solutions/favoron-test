import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, ChevronDown, ChevronUp, ExternalLink, Loader2, Package, Phone, Plane } from 'lucide-react';
import { formatDateUTC } from '@/lib/formatters';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { TripGroup, TripGroupPackage } from '@/hooks/useOperationsData';

interface OperationsTripCardProps {
  trip: TripGroup;
  onConfirmPackage: (packageId: string) => Promise<void>;
  onConfirmAll: (packageIds: string[]) => Promise<void>;
  confirmingIds: Set<string>;
}

// Helper to format currency
const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return '';
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '';
  return `$${numPrice.toFixed(2)}`;
};

// Helper to get package status badge
const getPackageStatusBadge = (status: string) => {
  switch (status) {
    case 'in_transit':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
          📦 En tránsito
        </Badge>
      );
    case 'received_by_traveler':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
          ✅ Recibido
        </Badge>
      );
    case 'pending_office_confirmation':
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
          🏢 Pendiente oficina
        </Badge>
      );
    case 'delivered_to_office':
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
          📍 En oficina
        </Badge>
      );
    case 'ready_for_pickup':
      return (
        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
          🏠 Para recoger
        </Badge>
      );
    case 'ready_for_delivery':
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
          🚚 Para envío
        </Badge>
      );
    case 'out_for_delivery':
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
          🚴 En reparto
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
};

// Package list item component with detailed product info
const PackageListItem = ({
  pkg,
  isConfirming,
  isSelected,
  isAnyConfirming,
  onSelect,
  onConfirm,
}: {
  pkg: TripGroupPackage;
  isConfirming: boolean;
  isSelected: boolean;
  isAnyConfirming: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
}) => {
  const products = pkg.products_data;
  const isMultiProduct = products && Array.isArray(products) && products.length > 1;

  // Get total estimated price
  const totalPrice = products && Array.isArray(products) && products.length > 0
    ? products.reduce((sum, p) => {
        const price = parseFloat(String(p.estimatedPrice || 0));
        const qty = parseInt(String(p.quantity || 1), 10);
        return sum + (isNaN(price) ? 0 : price * (isNaN(qty) ? 1 : qty));
      }, 0)
    : pkg.estimated_price || 0;

  // Get total quantity
  const totalQuantity = products && Array.isArray(products) && products.length > 0
    ? products.reduce((sum, p) => sum + (parseInt(String(p.quantity || 1), 10) || 1), 0)
    : 1;

  return (
    <div className="py-3 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      {/* Header row with checkbox, description, and confirm button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Checkbox
            className="mt-1"
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(pkg.id, !!checked)}
            disabled={isAnyConfirming}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-medium text-foreground">
              {isMultiProduct ? `${products.length} productos` : pkg.item_description}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>👤 {pkg.shopper_name}</span>
              {getPackageStatusBadge(pkg.status)}
              {pkg.label_number && <span>🏷️ #{pkg.label_number}</span>}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onConfirm(pkg.id)}
          disabled={isAnyConfirming}
          className="shrink-0"
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

      {/* Product details section */}
      <div className="mt-2 ml-8 space-y-1.5">
        {isMultiProduct ? (
          // Multi-product display
          <>
            {products.map((product, index) => {
              const productPrice = parseFloat(String(product.estimatedPrice || 0));
              const productQty = parseInt(String(product.quantity || 1), 10) || 1;
              const productLink = product.itemLink;

              return (
                <div key={index} className="flex items-center gap-2 text-sm py-1 px-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">📦</span>
                  <span className="font-medium truncate flex-1">{product.itemDescription || `Producto ${index + 1}`}</span>
                  {!isNaN(productPrice) && productPrice > 0 && (
                    <span className="text-muted-foreground">{formatPrice(productPrice)}</span>
                  )}
                  {productQty > 1 && (
                    <span className="text-muted-foreground">x{productQty}</span>
                  )}
                  {productLink && (
                    <a
                      href={productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
            <div className="flex items-center gap-3 text-sm pt-1 border-t mt-2">
              <span className="font-medium text-foreground">💰 Total: {formatPrice(totalPrice)}</span>
              <span className="text-muted-foreground">📦 {totalQuantity} unidad{totalQuantity !== 1 ? 'es' : ''}</span>
            </div>
          </>
        ) : (
          // Single product display
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {totalPrice > 0 && (
              <span className="text-foreground font-medium">💰 {formatPrice(totalPrice)}</span>
            )}
            {totalQuantity > 1 && (
              <span className="text-muted-foreground">📦 x{totalQuantity} unidades</span>
            )}
            {products?.[0]?.itemLink && (
              <a
                href={products[0].itemLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver producto
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
                {pendingPackages.map((pkg) => (
                  <PackageListItem
                    key={pkg.id}
                    pkg={pkg}
                    isConfirming={confirmingIds.has(pkg.id)}
                    isSelected={selectedIds.has(pkg.id)}
                    isAnyConfirming={isAnyConfirming}
                    onSelect={handleSelectPackage}
                    onConfirm={onConfirmPackage}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default OperationsTripCard;
