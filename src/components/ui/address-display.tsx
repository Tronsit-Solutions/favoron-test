import { MapPin } from "lucide-react";

interface AddressDisplayProps {
  address: {
    streetAddress: string;
    cityArea: string;
    hotelAirbnbName?: string;
    contactNumber: string;
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
        <p>{address.streetAddress}</p>
        <p>{address.cityArea}</p>
        {address.hotelAirbnbName && (
          <p className="font-medium">{address.hotelAirbnbName}</p>
        )}
        <p className="flex items-center">
          <span className="mr-1">📞</span>
          {address.contactNumber}
        </p>
      </div>
    </div>
  );
};

export default AddressDisplay;