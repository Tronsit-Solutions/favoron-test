import { MapPin } from "lucide-react";

interface TravelerPackageInfoProps {
  pkg: any;
}

const TravelerPackageInfo = ({ pkg }: TravelerPackageInfoProps) => {
  return (
    <div className="space-y-2">
      {/* Delivery address if confirmed */}
      {pkg.confirmed_delivery_address && (
        <div className="bg-muted/30 border rounded-lg p-2">
          <div className="flex items-start space-x-1.5 mb-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
            <p className="text-xs font-medium">Dirección de entrega confirmada:</p>
          </div>
          <div className="text-xs text-muted-foreground ml-4.5">
            <p>{pkg.confirmed_delivery_address.streetAddress}</p>
            <p>{pkg.confirmed_delivery_address.cityArea}</p>
            {pkg.confirmed_delivery_address.hotelAirbnbName && (
              <p>{pkg.confirmed_delivery_address.hotelAirbnbName}</p>
            )}
            <p>📞 {pkg.confirmed_delivery_address.contactNumber}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default TravelerPackageInfo;