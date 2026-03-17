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
  // Joined data
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
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const quotedAssignments = assignments.filter(a => a.status === 'bid_submitted' && a.quote);
  const pendingAssignments = assignments.filter(a => a.status === 'bid_pending');

  const handleAccept = async (assignmentId: string) => {
    setAcceptingId(assignmentId);
    try {
      await onAcceptQuote(assignmentId);
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Cotizaciones recibidas ({quotedAssignments.length})
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
        const zipCode = travelerAddr?.zipCode || travelerAddr?.codigoPostal || null;

        return (
          <Card key={assignment.id} className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-3">
              {/* Traveler info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    {assignment.traveler_avatar_url ? (
                    <AvatarImage src={assignment.traveler_avatar_url} alt={travelerFirstName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
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
                {assignment.trip_delivery_date && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(assignment.trip_delivery_date), 'dd MMM', { locale: es })}
                  </Badge>
                )}
              </div>

              {/* Traveler details: address, reception window, delivery date */}
              <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                {city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Home className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {accommodationType ? `${accommodationType} en ${city}` : city}
                    </span>
                  </div>
                )}
                {firstDay && lastDay && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Recibe paquetes: <span className="font-medium text-foreground">{formatDateUTC(firstDay)} - {formatDateUTC(lastDay)}</span>
                    </span>
                  </div>
                )}
                {deliveryDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      Entrega en oficina: <span className="font-medium text-foreground">{formatDateUTC(deliveryDate)}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Quote breakdown */}
              <div className="bg-muted/50 rounded-md p-2.5 space-y-1">
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

              {/* Accept button */}
              <Button
                variant="shopper"
                size="sm"
                className="w-full"
                onClick={() => handleAccept(assignment.id)}
                disabled={acceptingId !== null}
              >
                {acceptingId === assignment.id ? (
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
    </div>
  );
};

export default MultiQuoteSelector;
