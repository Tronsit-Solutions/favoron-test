import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getQuoteValues } from "@/lib/quoteHelpers";
import { formatPrice } from "@/lib/formatters";
import { Clock, MapPin, DollarSign, Check, Loader2, User, Package, Truck, Home } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Assignment {
  id: string;
  trip_id: string;
  status: string;
  quote: any;
  admin_assigned_tip: number | null;
  traveler_address: any;
  matched_trip_dates: any;
  quote_expires_at: string | null;
  traveler_first_name?: string;
  traveler_last_name?: string;
  traveler_avatar_url?: string;
  trip_from_city?: string;
  trip_to_city?: string;
  trip_delivery_date?: string;
}

interface MultiQuoteSelectorProps {
  assignments: Assignment[];
  onAcceptQuote: (assignmentId: string) => Promise<void>;
}

const formatDateUTC = (dateString: string) => {
  const date = new Date(dateString);
  return format(
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    'dd MMM yyyy',
    { locale: es }
  );
};

const MultiQuoteSelector = ({ assignments, onAcceptQuote }: MultiQuoteSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const quotedAssignments = assignments.filter(a => a.status === 'bid_submitted' && a.quote);
  const pendingAssignments = assignments.filter(a => a.status === 'bid_pending');

  const handleAccept = async () => {
    if (!selectedId) return;
    setAcceptingId(selectedId);
    try {
      await onAcceptQuote(selectedId);
    } finally {
      setAcceptingId(null);
    }
  };

  if (quotedAssignments.length === 0 && pendingAssignments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No hay cotizaciones disponibles aún.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Selecciona una cotización ({quotedAssignments.length})
        </h3>
      </div>

      {quotedAssignments.map((assignment) => {
        const quoteValues = getQuoteValues(assignment.quote);
        const travelerFirstName = assignment.traveler_first_name || 'Viajero';
        const travelerLastName = assignment.traveler_last_name || '';
        const initials = (assignment.traveler_first_name?.[0] || '') + (assignment.traveler_last_name?.[0] || '');

        const tripDates = assignment.matched_trip_dates as any;
        const travelerAddr = assignment.traveler_address as any;

        const firstDay = tripDates?.first_day_packages || tripDates?.packageReceptionStart;
        const lastDay = tripDates?.last_day_packages || tripDates?.packageReceptionEnd;
        const deliveryDate = tripDates?.delivery_date || tripDates?.officeDeliveryDate;
        const city = travelerAddr?.cityArea || travelerAddr?.city || travelerAddr?.ciudad || null;
        const accommodationType = travelerAddr?.accommodationType || null;
        const streetLine = travelerAddr?.streetAddress || travelerAddr?.firstAddressLine || null;
        const zipCode = travelerAddr?.postalCode || travelerAddr?.zipCode || travelerAddr?.codigoPostal || null;

        const isSelected = selectedId === assignment.id;

        return (
          <Card
            key={assignment.id}
            className={`cursor-pointer transition-all ${
              isSelected
                ? 'ring-2 ring-primary border-primary shadow-md'
                : 'border-muted-foreground/20 hover:border-primary/40'
            }`}
            onClick={() => setSelectedId(assignment.id)}
          >
            <CardContent className="p-3 space-y-2">
              {/* Traveler info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    {assignment.traveler_avatar_url ? (
                      <AvatarImage src={assignment.traveler_avatar_url} alt={travelerFirstName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {travelerFirstName}{' '}
                    {travelerLastName && <span className="blur-[4px] select-none">{travelerLastName}</span>}
                  </p>
                  {assignment.trip_from_city && assignment.trip_to_city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {assignment.trip_from_city} → {assignment.trip_to_city}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-bold text-primary">{formatPrice(quoteValues.totalPrice)}</span>
                  {assignment.trip_delivery_date && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {format(new Date(assignment.trip_delivery_date), 'dd MMM', { locale: es })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Expandable details when selected */}
              {isSelected && (
                <>
                  {/* Traveler details */}
                  <div className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 text-xs">
                    {city && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Home className="h-3 w-3 flex-shrink-0" />
                        <span>{accommodationType ? `${accommodationType} en ${city}` : city}</span>
                      </div>
                    )}
                    {(streetLine || zipCode) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{[streetLine, zipCode ? `CP ${zipCode}` : null].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {firstDay && lastDay && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-3 w-3 flex-shrink-0" />
                        <span>
                          Recibe: <span className="font-medium text-foreground">{formatDateUTC(firstDay)} - {formatDateUTC(lastDay)}</span>
                        </span>
                      </div>
                    )}
                    {deliveryDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Truck className="h-3 w-3 flex-shrink-0" />
                        <span>
                          Entrega: <span className="font-medium text-foreground">{formatDateUTC(deliveryDate)}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quote breakdown */}
                  <div className="bg-muted/50 rounded-md p-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Propina viajero</span>
                      <span>{formatPrice(quoteValues.price)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tarifa de servicio</span>
                      <span>{formatPrice(quoteValues.serviceFee)}</span>
                    </div>
                    {quoteValues.deliveryFee > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Envío</span>
                        <span>{formatPrice(quoteValues.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="border-t border-muted pt-1 flex justify-between text-sm font-semibold">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(quoteValues.totalPrice)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Pending assignments */}
      {pendingAssignments.map((assignment) => {
        const travelerName = [assignment.traveler_first_name, assignment.traveler_last_name]
          .filter(Boolean).join(' ') || 'Viajero';

        return (
          <Card key={assignment.id} className="border-dashed border-muted-foreground/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 opacity-60">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Esperando cotización de <span className="font-medium">{travelerName}</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendiente
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Sticky confirm button */}
      {quotedAssignments.length > 0 && (
        <div className="sticky bottom-0 pt-3 pb-1 bg-background">
          <Button
            variant="shopper"
            className="w-full"
            onClick={handleAccept}
            disabled={!selectedId || acceptingId !== null}
          >
            {acceptingId ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aceptando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Aceptar esta cotización
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MultiQuoteSelector;
