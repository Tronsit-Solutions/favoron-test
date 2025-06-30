
import { useToast } from "@/hooks/use-toast";

export const useDashboardActions = (
  packages: any[],
  setPackages: (packages: any[]) => void,
  trips: any[],
  setTrips: (trips: any[]) => void,
  currentUser: any,
  setShowPackageForm: (show: boolean) => void,
  setShowTripForm: (show: boolean) => void,
  setShowAddressConfirmation: (show: boolean) => void,
  setSelectedPackageForAddress: (pkg: any) => void,
  setShowQuoteDialog: (show: boolean) => void,
  setSelectedPackageForQuote: (pkg: any) => void,
  setQuoteUserType: (type: 'traveler' | 'shopper') => void
) => {
  const { toast } = useToast();

  const handlePackageSubmit = (packageData: any) => {
    const newPackage = {
      id: Date.now(),
      ...packageData,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };
    setPackages([...packages, newPackage]);
    setShowPackageForm(false);
    toast({
      title: "¡Solicitud enviada!",
      description: "Tu solicitud de paquete está en revisión. Te notificaremos pronto.",
    });
  };

  const handleTripSubmit = (tripData: any) => {
    const newTrip = {
      id: Date.now(),
      ...tripData,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      userId: currentUser.id
    };
    setTrips([...trips, newTrip]);
    setShowTripForm(false);
    toast({
      title: "¡Viaje registrado!",
      description: "Tu viaje ha sido registrado exitosamente. Está en revisión.",
    });
  };

  const handleAddressConfirmation = (confirmedAddress: any) => {
    setPackages(packages.map(pkg => 
      pkg.id === currentUser.selectedPackageForAddress?.id 
        ? { ...pkg, status: 'address_confirmed', confirmedDeliveryAddress: confirmedAddress }
        : pkg
    ));
    setShowAddressConfirmation(false);
    setSelectedPackageForAddress(null);
    toast({
      title: "¡Dirección confirmada!",
      description: "El comprador ya puede proceder con la compra y envío.",
    });
  };

  const handleQuoteSubmit = (quoteData: any, selectedPackage: any, userType: 'traveler' | 'shopper') => {
    if (userType === 'traveler') {
      setPackages(packages.map(pkg => 
        pkg.id === selectedPackage.id 
          ? { ...pkg, status: 'quote_sent', quote: quoteData }
          : pkg
      ));
      toast({
        title: "¡Cotización enviada!",
        description: "Tu cotización ha sido enviada al comprador.",
      });
    } else {
      if (quoteData.message === 'accepted') {
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'quote_accepted' }
            : pkg
        ));
        toast({
          title: "¡Cotización aceptada!",
          description: "Procede a confirmar tu dirección de entrega.",
        });
      }
    }
    setShowQuoteDialog(false);
    setSelectedPackageForQuote(null);
  };

  const handleQuote = (pkg: any, userType: 'traveler' | 'shopper') => {
    setSelectedPackageForQuote(pkg);
    setQuoteUserType(userType);
    setShowQuoteDialog(true);
  };

  const handleConfirmAddress = (pkg: any) => {
    const mockTripAddress = {
      streetAddress: "5ta Avenida 12-34, Zona 10",
      cityArea: "Guatemala City, Zona 10",
      hotelAirbnbName: "Hotel Casa Santo Domingo",
      contactNumber: "+502 1234-5678"
    };
    setSelectedPackageForAddress({ ...pkg, deliveryAddress: mockTripAddress });
    setShowAddressConfirmation(true);
  };

  const handleMarkAsPaid = (packageId: number) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId ? { ...pkg, status: 'paid' } : pkg
    ));
    toast({
      title: "¡Marcado como pagado!",
      description: "Ahora puedes subir la información de seguimiento.",
    });
  };

  const handleUploadDocument = (packageId: number, type: 'confirmation' | 'tracking', data: any) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const updatedPkg = { ...pkg };
        if (type === 'confirmation') {
          updatedPkg.purchaseConfirmation = data;
          updatedPkg.status = 'purchased';
        } else if (type === 'tracking') {
          updatedPkg.trackingInfo = data;
          updatedPkg.status = 'in_transit';
        }
        return updatedPkg;
      }
      return pkg;
    }));
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
    handlePackageSubmit,
    handleTripSubmit,
    handleAddressConfirmation,
    handleQuoteSubmit,
    handleQuote,
    handleConfirmAddress,
    handleMarkAsPaid,
    handleUploadDocument,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject
  };
};
