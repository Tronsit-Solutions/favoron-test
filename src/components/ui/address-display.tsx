import { MapPin } from "lucide-react";

interface AddressDisplayProps {
  address: {
    streetAddress: string;
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
}

const AddressDisplay = ({ address, title, variant = 'success' }: AddressDisplayProps) => {
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
          <p className="font-semibold text-foreground">{address.recipientName}</p>
        )}
        <p>{address.streetAddress}</p>
        <p>{address.cityArea}</p>
        {address.postalCode && (
          <p>Código Postal: {address.postalCode}</p>
        )}
        {address.country && (
          <p>País: {address.country}</p>
        )}
        {address.hotelAirbnbName && (
          <p className="font-medium text-primary">{address.hotelAirbnbName}</p>
        )}
        <p className="flex items-center">
          <span className="mr-1">📞</span>
          {address.contactNumber}
        </p>
        {address.additionalInstructions && (
          <div className="mt-2 p-2 bg-muted/50 rounded border-l-2 border-primary/30">
            <p className="text-xs font-medium text-muted-foreground mb-1">Instrucciones adicionales:</p>
            <p className="text-xs">{address.additionalInstructions}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressDisplay;