
import { useToast } from "@/hooks/use-toast";

export const useAdminActions = (
  packages: any[],
  setPackages: (packages: any[]) => void,
  trips: any[],
  setTrips: (trips: any[]) => void
) => {
  const { toast } = useToast();

  const buildTravelerAddress = (matchedTrip: any) => {
    if (!matchedTrip) return null;
    
    const addressData = matchedTrip.packageReceivingAddress;
    if (!addressData) return null;
    
    return {
      streetAddress: addressData.streetAddress || "Dirección no disponible",
      cityArea: matchedTrip.toCity || "Ciudad no disponible", 
      hotelAirbnbName: addressData.accommodationType === 'hotel' ? addressData.hotelAirbnbName : null,
      contactNumber: addressData.contactNumber || "Teléfono no disponible"
    };
  };

  const handleConfirmPayment = (packageId: number) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    
    const matchedTrip = pkg.matchedTripId ? trips.find(trip => trip.id === pkg.matchedTripId) : null;
    const travelerAddress = buildTravelerAddress(matchedTrip);

    setPackages(packages.map(currentPkg => 
      currentPkg.id === packageId 
        ? { ...currentPkg, status: 'payment_confirmed', travelerAddress }
        : currentPkg
    ));
    
    toast({
      title: "¡Pago confirmado!",
      description: "El shopper ahora puede ver la dirección del viajero para enviar el paquete.",
    });
  };

  const handleMatchPackage = (packageId: number, tripId: number) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, status: 'matched', matchedTripId: tripId } : pkg
    ));
    
    toast({
      title: "¡Match realizado!",
      description: "Tu solicitud fue emparejada. Espera una cotización del viajero.",
    });
  };

  const handleStatusUpdate = (type: 'package' | 'trip', id: number, status: string) => {
    if (type === 'package') {
      setPackages(packages.map(pkg => 
        pkg.id === id ? { ...pkg, status } : pkg
      ));
    } else {
      setTrips(trips.map(trip => 
        trip.id === id ? { ...trip, status } : trip
      ));
    }
    
    toast({
      title: "Estado actualizado",
      description: `El estado ha sido actualizado a: ${status}`,
    });
  };

  const handleApproveReject = (type: 'package' | 'trip', id: number, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    handleStatusUpdate(type, id, newStatus);
  };

  return {
    handleConfirmPayment,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject
  };
};
