import { Package as PackageType } from "@/types";
import { MapPin, Calendar, Clock, Home, AlertCircle, User } from "lucide-react";
import { formatDateUTC } from "@/lib/formatters";

interface PartialDeliveryInfoProps {
  pkg: PackageType;
}

const addBusinessDays = (dateStr: string, days: number): Date => {
  const date = new Date(dateStr);
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  let added = 0;
  while (added < days) {
    result.setUTCDate(result.getUTCDate() + 1);
    const dow = result.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
};

export const PartialDeliveryInfo = ({ pkg }: PartialDeliveryInfoProps) => {
  const tripDates = pkg.matched_trip_dates as any;
  const travelerAddress = pkg.traveler_address as any;

  if (!tripDates && !travelerAddress) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-900">
          Información de entrega aún no disponible. El viajero proporcionará estos datos pronto.
        </p>
      </div>
    );
  }

  const recipientName = travelerAddress?.recipientName || travelerAddress?.recipient_name || null;
  const addressLine1 = travelerAddress?.streetAddress || travelerAddress?.address_line_1 || travelerAddress?.street_address || travelerAddress?.direccion || null;
  const addressLine2 = travelerAddress?.streetAddress2 || travelerAddress?.address_line_2 || travelerAddress?.street_address_2 || null;
  const city = travelerAddress?.cityArea || travelerAddress?.city || travelerAddress?.ciudad || null;
  const postalCode = travelerAddress?.postalCode || travelerAddress?.postal_code || null;

  const firstDay = tripDates?.first_day_packages || tripDates?.packageReceptionStart;
  const lastDay = tripDates?.last_day_packages || tripDates?.packageReceptionEnd;
  const deliveryDate = tripDates?.delivery_date || tripDates?.officeDeliveryDate;

  const estimatedDelivery = deliveryDate ? addBusinessDays(deliveryDate, 2) : null;

  return (
    <div className="space-y-3">
      {/* Amber info alert */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-900">
          Esta es información parcial. Los detalles completos estarán disponibles después de completar el pago.
        </p>
      </div>

      {/* Inline delivery info rows */}
      <div className="space-y-2.5">
        {/* Reception window */}
        {firstDay && lastDay && (
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-600">Ventana de recepción: </span>
              <span className="font-medium text-slate-800">
                {formatDateUTC(firstDay)} - {formatDateUTC(lastDay)}
              </span>
            </div>
          </div>
        )}

        {/* Estimated delivery date */}
        {estimatedDelivery && (
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-600">Fecha estimada de entrega: </span>
              <span className="font-medium text-slate-800">
                {estimatedDelivery.toLocaleDateString('es-GT')}
              </span>
            </div>
          </div>
        )}

        {/* City */}
        {city && (
          <div className="flex items-center gap-3">
            <Home className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-600">Ciudad: </span>
              <span className="font-medium text-slate-800">{city}</span>
            </div>
          </div>
        )}

        {/* Address line 1 */}
        {addressLine1 && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-600">Dirección: </span>
              <span className="font-medium text-slate-800">{addressLine1}</span>
            </div>
          </div>
        )}

        {/* Address line 2 - blurred */}
        {addressLine2 && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-slate-400/50 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-600">Dirección 2: </span>
              <span className="blur-[4px] select-none text-slate-400">{addressLine2}</span>
            </div>
          </div>
        )}

        {/* Postal code */}
        {postalCode && (
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-slate-600">Código postal: </span>
              <span className="font-medium text-slate-800">{postalCode}</span>
            </div>
          </div>
        )}
      </div>

      {/* Important note */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-900">
          <strong>Importante:</strong> Asegúrate de que el paquete llegue dentro de la ventana de recepción para que el viajero pueda llevarlo.
        </p>
      </div>
    </div>
  );
};
