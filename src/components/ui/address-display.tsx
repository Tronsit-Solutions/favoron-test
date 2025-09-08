import { MapPin } from "lucide-react";

interface AddressDisplayProps {
  address: {
    streetAddress: string;
    streetAddress2?: string;
    cityArea: string;
    hotelAirbnbName?: string;
    contactNumber: string;
    recipientName?: string;
    additionalInstructions?: string;
    country?: string;
    postalCode?: string;
  };
  title: string;
  variant?: 'success' | 'info' | 'warning';
  tripDates?: {
    firstDayPackages?: string;
    lastDayPackages?: string;
    deliveryDate?: string;
  };
}

const AddressDisplay = ({ address, title, variant = 'success', tripDates }: AddressDisplayProps) => {
  const variantStyles = {
    success: 'bg-success-muted border-success-border text-foreground',
    info: 'bg-info-muted border-info-border text-foreground', 
    warning: 'bg-warning-muted border-warning-border text-foreground'
  };

  const iconColor = {
    success: 'text-success',
    info: 'text-info',
    warning: 'text-warning'
  };

  return (
    <div className={`${variantStyles[variant]} border rounded-lg p-4`}>
      <div className="flex items-start space-x-3 mb-3">
        <MapPin className={`h-4 w-4 ${iconColor[variant]} mt-0.5 flex-shrink-0`} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="text-sm ml-7 space-y-1">
        {address.recipientName && (
          <p><span className="font-medium text-muted-foreground">Destinatario:</span> <span className="font-semibold text-foreground">{address.recipientName}</span></p>
        )}
        <p><span className="font-medium text-muted-foreground">Dirección #1:</span> {address.streetAddress}</p>
        {address.streetAddress2 && (
          <p><span className="font-medium text-muted-foreground">Dirección #2:</span> {address.streetAddress2}</p>
        )}
        <p><span className="font-medium text-muted-foreground">Ciudad:</span> {address.cityArea}</p>
        {address.postalCode && (
          <p><span className="font-medium text-muted-foreground">Código Postal:</span> {address.postalCode}</p>
        )}
        {address.country && (
          <p><span className="font-medium text-muted-foreground">País:</span> {address.country}</p>
        )}
        {address.hotelAirbnbName && (
          <p><span className="font-medium text-muted-foreground">Hotel/Airbnb:</span> <span className="font-medium text-primary">{address.hotelAirbnbName}</span></p>
        )}
        <p><span className="font-medium text-muted-foreground">Teléfono de contacto entregas:</span> {address.contactNumber}</p>
        {address.additionalInstructions && (
          <div className="mt-2 p-2 bg-muted/50 rounded border-l-2 border-primary/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">Instrucciones adicionales:</p>
            <p className="text-xs">{address.additionalInstructions}</p>
          </div>
        )}
        
        {/* Fechas importantes */}
        {tripDates && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Fechas importantes:</p>
            <div className="space-y-1">
              {tripDates.firstDayPackages && (
                <p className="text-xs">
                  <span className="font-medium text-muted-foreground">Primer día para recibir paquetes:</span> {new Date(tripDates.firstDayPackages).toLocaleDateString('es-GT')}
                </p>
              )}
              {tripDates.lastDayPackages && (
                <p className="text-xs">
                  <span className="font-medium text-muted-foreground">Último día para recibir paquetes:</span> {new Date(tripDates.lastDayPackages).toLocaleDateString('es-GT')}
                </p>
              )}
              {tripDates.deliveryDate && (
                <p className="text-xs">
                  <span className="font-medium text-muted-foreground">Fecha de entrega en oficina de Favoron:</span> <span className="font-semibold text-primary">{new Date(tripDates.deliveryDate).toLocaleDateString('es-GT')}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressDisplay;