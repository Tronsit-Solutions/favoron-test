
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
      if (quoteData.message === 'rejected') {
        // If traveler rejects, package goes back to pending match
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'approved', matchedTripId: null }
            : pkg
        ));
        toast({
          title: "Pedido rechazado",
          description: "El pedido ha sido rechazado y estará disponible para un nuevo match.",
        });
      } else {
        // Sending quote implies approval
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'quote_sent', quote: quoteData }
            : pkg
        ));
        toast({
          title: "¡Cotización enviada!",
          description: "Tu cotización ha sido enviada al comprador.",
        });
      }
    } else {
      if (quoteData.message === 'accepted') {
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'quote_accepted' }
            : pkg
        ));
        toast({
          title: "¡Cotización aceptada!",
          description: "Ahora debes hacer el pago a la cuenta bancaria de Favorón.",
        });
      } else {
        setPackages(packages.map(pkg => 
          pkg.id === selectedPackage.id 
            ? { ...pkg, status: 'quote_rejected' }
            : pkg
        ));
        toast({
          title: "Cotización rechazada",
          description: "Has rechazado la cotización del viajero.",
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

  const handleUploadDocument = (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const updatedPkg = { ...pkg };
        if (type === 'confirmation') {
          updatedPkg.purchaseConfirmation = data;
          // Automatically move to in_transit when purchase confirmation is uploaded
          updatedPkg.status = 'in_transit';
        } else if (type === 'tracking') {
          updatedPkg.trackingInfo = data;
          // Check if purchase confirmation is already uploaded - if so, move to in_transit
          if (updatedPkg.purchaseConfirmation) {
            updatedPkg.status = 'in_transit';
          } else {
            updatedPkg.status = 'purchased';
          }
        } else if (type === 'payment_receipt') {
          updatedPkg.paymentReceipt = data;
          updatedPkg.status = 'payment_pending';
        }
        return updatedPkg;
      }
      return pkg;
    }));

    const messages = {
      payment_receipt: {
        title: "¡Pago registrado!",
        description: "Tu pago está en revisión. Te notificaremos cuando sea confirmado."
      },
      confirmation: {
        title: "¡Comprobante de compra subido!",
        description: "Se ha registrado tu comprobante de compra."
      },
      tracking: {
        title: "¡Información de seguimiento actualizada!",
        description: "Se ha registrado la información de envío."
      }
    };

    const message = messages[type];
    if (message) {
      toast(message);
    }
  };

  const buildTravelerAddress = (matchedTrip: any) => {
    if (!matchedTrip) return null;
    
    // Extract address data properly from the nested structure
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
    console.log('Confirming payment for package:', packageId);
    
    // Find the package and matched trip
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) {
      console.error('Package not found:', packageId);
      return;
    }
    
    const matchedTrip = pkg.matchedTripId ? trips.find(trip => trip.id === pkg.matchedTripId) : null;
    console.log('Found matched trip:', matchedTrip);
    
    const travelerAddress = buildTravelerAddress(matchedTrip);
    console.log('Built traveler address:', travelerAddress);

    // NEW: Include trip dates for shipping information
    const matchedTripDates = matchedTrip ? {
      firstDayPackages: matchedTrip.firstDayPackages,
      lastDayPackages: matchedTrip.lastDayPackages,
      deliveryDate: matchedTrip.deliveryDate,
      arrivalDate: matchedTrip.arrivalDate
    } : null;

    setPackages(packages.map(currentPkg => 
      currentPkg.id === packageId 
        ? { ...currentPkg, status: 'payment_confirmed', travelerAddress, matchedTripDates }
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

  const handleConfirmPackageReceived = (packageId: number, photo?: string) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId 
        ? { 
            ...pkg, 
            status: 'received_by_traveler',
            travelerConfirmation: {
              confirmedAt: new Date().toISOString(),
              photo: photo || null
            }
          }
        : pkg
    ));
    
    toast({
      title: "¡Paquete confirmado!",
      description: "Has confirmado la recepción del paquete.",
    });
  };

  const handleConfirmOfficeReception = (packageId: number) => {
    setPackages(packages.map(pkg => 
      pkg.id === packageId 
        ? { 
            ...pkg, 
            status: 'delivered_to_office',
            officeDelivery: {
              confirmedAt: new Date().toISOString()
            }
          }
        : pkg
    ));
    
    toast({
      title: "¡Entregado en oficina!",
      description: "Paquete confirmado como entregado en oficina Favorón.",
    });
  };

  const handleEditTrip = (editedTripData: any) => {
    setTrips(trips.map(trip => {
      if (trip.id === editedTripData.id) {
        // If trip was approved, reset to pending approval for admin review
        const newStatus = trip.status === 'approved' ? 'pending_approval' : trip.status;
        return { ...editedTripData, createdAt: trip.createdAt, status: newStatus };
      }
      return trip;
    }));
    
    const originalTrip = trips.find(trip => trip.id === editedTripData.id);
    const needsReapproval = originalTrip?.status === 'approved';
    
    toast({
      title: "¡Viaje actualizado!",
      description: needsReapproval 
        ? "Los cambios se han guardado. El viaje requiere nueva aprobación del administrador."
        : "Los cambios se han guardado correctamente.",
    });
  };

  const handleEditPackage = (editedPackageData: any) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === editedPackageData.id) {
        // If package was approved, reset to pending approval for admin review
        const newStatus = pkg.status === 'approved' ? 'pending_approval' : pkg.status;
        return { ...editedPackageData, createdAt: pkg.createdAt, userId: pkg.userId, status: newStatus };
      }
      return pkg;
    }));
    
    const originalPackage = packages.find(pkg => pkg.id === editedPackageData.id);
    const needsReapproval = originalPackage?.status === 'approved';
    
    toast({
      title: "¡Solicitud actualizada!",
      description: needsReapproval 
        ? "Los cambios se han guardado. La solicitud requiere nueva aprobación del administrador."
        : "Los cambios se han guardado correctamente.",
    });
  };

  return {
    handlePackageSubmit,
    handleTripSubmit,
    handleAddressConfirmation,
    handleQuoteSubmit,
    handleQuote,
    handleConfirmAddress,
    handleUploadDocument,
    handleConfirmPayment,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject,
    handleConfirmPackageReceived,
    handleConfirmOfficeReception,
    handleEditTrip,
    handleEditPackage
  };
};
