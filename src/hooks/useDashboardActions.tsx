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
  setQuoteUserType: (type: 'user' | 'admin') => void,
  // Supabase functions
  createPackage?: (packageData: any) => Promise<any>,
  createTrip?: (tripData: any) => Promise<any>,
  updatePackage?: (id: string, updates: any) => Promise<any>,
  updateTrip?: (id: string, updates: any) => Promise<any>
) => {
  const { toast } = useToast();

  const handlePackageSubmit = async (packageData: any) => {
    try {
      if (!createPackage) {
        console.error('createPackage function not available');
        return;
      }

      // Transform form data to database format
      const dbPackageData = {
        item_description: packageData.products?.[0]?.itemDescription || packageData.itemDescription,
        item_link: packageData.products?.[0]?.itemLink || packageData.itemLink,
        estimated_price: packageData.products?.[0]?.estimatedPrice ? parseFloat(packageData.products[0].estimatedPrice) : null,
        delivery_deadline: packageData.deliveryDeadline ? packageData.deliveryDeadline.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        package_destination: packageData.packageDestination,
        purchase_origin: packageData.purchaseOrigin,
        additional_notes: packageData.additionalNotes || null,
        status: 'pending_approval'
      };

      await createPackage(dbPackageData);
      setShowPackageForm(false);
      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de paquete está en revisión. Te notificaremos pronto.",
      });
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleTripSubmit = async (tripData: any) => {
    try {
      if (!createTrip) {
        console.error('createTrip function not available');
        return;
      }

      // Validate required date fields
      if (!tripData.arrivalDate || !tripData.firstDayPackages || !tripData.lastDayPackages || !tripData.deliveryDate) {
        throw new Error('Faltan fechas requeridas para el viaje');
      }

      // Transform form data to database format
      const dbTripData = {
        from_city: tripData.fromCity,
        to_city: tripData.toCity,
        departure_date: tripData.departureDate ? tripData.departureDate.toISOString() : tripData.arrivalDate.toISOString(),
        arrival_date: tripData.arrivalDate.toISOString(),
        first_day_packages: tripData.firstDayPackages.toISOString(),
        last_day_packages: tripData.lastDayPackages.toISOString(),
        delivery_date: tripData.deliveryDate.toISOString(),
        package_receiving_address: tripData.packageReceivingAddress,
        status: 'pending_approval'
      };

      await createTrip(dbTripData);
      setShowTripForm(false);
      toast({
        title: "¡Viaje registrado!",
        description: "Tu viaje ha sido registrado exitosamente. Está en revisión.",
      });
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el viaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
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

  const handleQuoteSubmit = async (quoteData: any, selectedPackage: any, userType: 'user' | 'admin') => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      // For sending a quote (when we have price data)
      if (quoteData.price !== undefined || quoteData.message === 'rejected') {
        if (quoteData.message === 'rejected') {
          // If traveler rejects, package goes back to pending match
          await updatePackage(selectedPackage.id, {
            status: 'approved',
            matched_trip_id: null
          });
          toast({
            title: "Pedido rechazado",
            description: "El pedido ha sido rechazado y estará disponible para un nuevo match.",
          });
        } else {
          // Sending quote implies approval
          await updatePackage(selectedPackage.id, {
            status: 'quote_sent',
            quote: quoteData
          });
          toast({
            title: "¡Cotización enviada!",
            description: "Tu cotización ha sido enviada al comprador.",
          });
        }
      } else {
        if (quoteData.message === 'accepted') {
          console.log('🎯 ACCEPTING QUOTE for package:', selectedPackage.id);
          console.log('🎯 Current package status:', selectedPackage.status);
          console.log('🎯 About to update to quote_accepted');
          
          await updatePackage(selectedPackage.id, {
            status: 'quote_accepted'
          });
          
          console.log('🎯 Package updated to quote_accepted');
          
          // Force close dialog and reset selection to trigger re-render
          setShowQuoteDialog(false);
          setSelectedPackageForQuote(null);
          
          toast({
            title: "¡Cotización aceptada!",
            description: "Ahora debes hacer el pago a la cuenta bancaria de Favorón.",
          });
        } else {
          await updatePackage(selectedPackage.id, {
            status: 'quote_rejected'
          });
          
          toast({
            title: "Cotización rechazada",
            description: "Has rechazado la cotización del viajero.",
          });
        }
      }
      
      // Only close dialog here if not already closed above
      if (quoteData.message !== 'accepted') {
        setShowQuoteDialog(false);
        setSelectedPackageForQuote(null);
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la cotización. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleQuote = (pkg: any, userType: 'user' | 'admin') => {
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

  const handleUploadDocument = (packageId: string, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const updatedPkg = { ...pkg };
        if (type === 'confirmation') {
          updatedPkg.purchaseConfirmation = data;
          // Keep current status - don't automatically advance to in_transit
          // Only advance when both confirmation AND tracking are present
          if (updatedPkg.trackingInfo) {
            updatedPkg.status = 'in_transit';
          }
        } else if (type === 'tracking') {
          updatedPkg.trackingInfo = data;
          // Only move to in_transit if BOTH confirmation and tracking are present
          if (updatedPkg.purchaseConfirmation) {
            updatedPkg.status = 'in_transit';
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
    const addressData = matchedTrip.package_receiving_address;
    if (!addressData) return null;
    
    return {
      streetAddress: addressData.streetAddress || "Dirección no disponible",
      cityArea: matchedTrip.to_city || "Ciudad no disponible", 
      hotelAirbnbName: addressData.accommodationType === 'hotel' ? addressData.hotelAirbnbName : null,
      contactNumber: addressData.contactNumber || "Teléfono no disponible"
    };
  };

  const handleConfirmPayment = async (packageId: string) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      console.log('Confirming payment for package:', packageId);
      
      // Find the package and matched trip
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) {
        console.error('Package not found:', packageId);
        return;
      }
      
      const matchedTrip = pkg.matched_trip_id ? trips.find(trip => trip.id === pkg.matched_trip_id) : null;
      console.log('Found matched trip:', matchedTrip);
      
      const travelerAddress = buildTravelerAddress(matchedTrip);
      console.log('Built traveler address:', travelerAddress);

      // NEW: Include trip dates for shipping information
      const matchedTripDates = matchedTrip ? {
        first_day_packages: matchedTrip.first_day_packages,
        last_day_packages: matchedTrip.last_day_packages,
        delivery_date: matchedTrip.delivery_date,
        arrival_date: matchedTrip.arrival_date
      } : null;

      // Update package in Supabase
      await updatePackage(packageId, {
        status: 'payment_confirmed',
        traveler_address: travelerAddress,
        matched_trip_dates: matchedTripDates
      });
      
      toast({
        title: "¡Pago confirmado!",
        description: "El shopper ahora puede ver la dirección del viajero para enviar el paquete.",
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el pago. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleMatchPackage = async (packageId: string, tripId: string) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      // Update package in Supabase with match information
      await updatePackage(packageId, {
        status: 'matched',
        matched_trip_id: tripId
      });

      toast({
        title: "¡Match realizado!",
        description: "Tu solicitud fue emparejada. Espera una cotización del viajero.",
      });
    } catch (error) {
      console.error('Error matching package:', error);
      toast({
        title: "Error",
        description: "No se pudo realizar el match. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (type: 'package' | 'trip', id: string, status: string) => {
    try {
      if (type === 'package' && updatePackage) {
        await updatePackage(id, { status });
        toast({
          title: "Estado actualizado",
          description: `El estado del paquete ha sido actualizado a: ${status}`,
        });
      } else if (type === 'trip' && updateTrip) {
        await updateTrip(id, { status });
        toast({
          title: "Estado actualizado",
          description: `El estado del viaje ha sido actualizado a: ${status}`,
        });
      } else {
        console.error(`Update function not available for ${type}`);
      }
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleApproveReject = async (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    try {
      if (type === 'package' && updatePackage) {
        await updatePackage(id, { status: newStatus });
        toast({
          title: action === 'approve' ? "¡Solicitud aprobada!" : "Solicitud rechazada",
          description: `La solicitud de paquete ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}.`,
        });
      } else if (type === 'trip' && updateTrip) {
        await updateTrip(id, { status: newStatus });
        toast({
          title: action === 'approve' ? "¡Viaje aprobado!" : "Viaje rechazado",
          description: `El viaje ha sido ${action === 'approve' ? 'aprobado' : 'rechazado'}.`,
        });
      } else {
        console.error(`Update function not available for ${type}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing ${type}:`, error);
      toast({
        title: "Error",
        description: `No se pudo ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud. Inténtalo de nuevo.`,
        variant: "destructive",
      });
    }
  };

  const handleConfirmPackageReceived = async (packageId: string, photo?: string) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      await updatePackage(packageId, {
        status: 'received_by_traveler',
        traveler_confirmation: {
          confirmedAt: new Date().toISOString(),
          photo: photo || null
        }
      });
      
      toast({
        title: "¡Paquete confirmado!",
        description: "Has confirmado la recepción del paquete.",
      });
    } catch (error) {
      console.error('Error confirming package received:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la recepción del paquete. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmOfficeReception = async (packageId: string) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      await updatePackage(packageId, {
        status: 'delivered_to_office',
        office_delivery: {
          confirmedAt: new Date().toISOString()
        }
      });
      
      toast({
        title: "¡Entregado en oficina!",
        description: "Paquete confirmado como entregado en oficina Favorón.",
      });
    } catch (error) {
      console.error('Error confirming office reception:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la entrega en oficina. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
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
