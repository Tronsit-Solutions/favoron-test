import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from 'react';
import { normalizeQuote, shouldRecalculateQuote } from '@/lib/quoteHelpers';

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
  updateTrip?: (id: string, updates: any) => Promise<any>,
  setActiveTab?: (tab: string) => void,
  refreshPackages?: () => Promise<void>,
  refreshTrips?: () => Promise<void>
) => {
  const { toast } = useToast();
  const tripSubmitInProgressRef = useRef<boolean>(false);

  const handlePackageSubmit = async (packageData: any) => {
    try {
      if (!createPackage) {
        console.error('createPackage function not available');
        return;
      }

      // Transform form data to database format
      console.log('📦 Package Data Received:', packageData);
      console.log('🚚 Delivery Method:', packageData.deliveryMethod);
      console.log('📍 Delivery Address:', packageData.deliveryAddress);
      
      // Handle multiple products format from new form
      const products = packageData.products || [];
      
      const totalEstimatedPrice = products.reduce((sum: number, product: any) => {
        const price = parseFloat(product.estimatedPrice || '0');
        const quantity = parseInt(product.quantity || '1');
        return sum + (price * quantity);
      }, 0);
      
      // Add additional notes to each product
      const productsWithNotes = products.map((product: any) => ({
        ...product,
        additionalNotes: packageData.additionalNotes || null
      }));
      
      const dbPackageData = {
        item_description: products.length > 1 
          ? `Pedido de ${products.length} productos` 
          : products[0]?.itemDescription || '',
        item_link: products[0]?.itemLink || null,
        estimated_price: totalEstimatedPrice || null,
        products_data: productsWithNotes, // Store all products with notes in the new field
        delivery_deadline: packageData.deliveryDeadline ? packageData.deliveryDeadline.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        package_destination: packageData.packageDestination,
        purchase_origin: packageData.purchaseOrigin,
        additional_notes: packageData.additionalNotes || null,
        delivery_method: packageData.deliveryMethod || 'pickup',
        confirmed_delivery_address: packageData.deliveryAddress || null,
        status: 'pending_approval'
      };
      
      console.log('💾 Database Package Data:', dbPackageData);

      // Create the package and get the result
      const newPackage = await createPackage(dbPackageData);
      console.log('✅ Package created successfully:', newPackage);
      
      // Force refresh of packages to show the new one immediately
      if (refreshPackages) {
        console.log('🔄 Force refreshing packages to show new package');
        await refreshPackages();
      }
      
      setShowPackageForm(false);
      
      // Navigate to admin tab if user is admin to see the new package
      if (currentUser.role === 'admin' && setActiveTab) {
        setActiveTab('admin');
        toast({
          title: "¡Solicitud creada exitosamente!",
          description: "Puedes verla y aprobarla en: Panel Admin → Aprobaciones → Solicitudes Pendientes",
        });
      } else {
        toast({
          title: "¡Solicitud enviada!",
          description: "Tu solicitud de paquete está en revisión. Te notificaremos pronto.",
        });
      }
    } catch (error) {
      console.error('Error creating package:', error);
      
      // Log to our centralized error tracking
      const { logFormError } = await import('@/lib/formErrorLogger');
      logFormError(error, 'dashboard-package-submit', {
        productsCount: packageData.products?.length || 0,
        hasDeliveryMethod: !!packageData.deliveryMethod,
        packageDataFields: Object.keys(packageData).length,
        isSafariIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)
      });
      
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleTripSubmit = async (tripData: any) => {
    // Prevent re-entry if already in progress
    if (tripSubmitInProgressRef.current) {
      console.log('🚫 Trip submission already in progress, ignoring');
      return;
    }

    tripSubmitInProgressRef.current = true;
    
    try {
      console.log('🚀 Starting trip submission with data:', tripData);
      
      if (!createTrip) {
        console.error('createTrip function not available');
        return;
      }

      // Validate required date fields
      if (!tripData.arrivalDate || !tripData.firstDayPackages || !tripData.lastDayPackages || !tripData.deliveryDate) {
        console.error('❌ Missing required dates:', {
          arrivalDate: tripData.arrivalDate,
          firstDayPackages: tripData.firstDayPackages,
          lastDayPackages: tripData.lastDayPackages,
          deliveryDate: tripData.deliveryDate
        });
        throw new Error('Faltan fechas requeridas para el viaje');
      }

      // Transform form data to database format with safe date conversion
      const safeToISOString = (dateValue: any) => {
        return dateValue instanceof Date ? dateValue.toISOString() : new Date(dateValue).toISOString();
      };

      const dbTripData = {
        from_city: tripData.fromCity,
        from_country: tripData.fromCountry, // Add missing fromCountry mapping
        to_city: tripData.toCity,
        departure_date: safeToISOString(tripData.arrivalDate), // Set to arrival_date for compatibility
        arrival_date: safeToISOString(tripData.arrivalDate),
        first_day_packages: safeToISOString(tripData.firstDayPackages),
        last_day_packages: safeToISOString(tripData.lastDayPackages),
        delivery_date: safeToISOString(tripData.deliveryDate),
        delivery_method: tripData.deliveryMethod || 'oficina',
        messenger_pickup_info: tripData.messengerPickupInfo || null,
        package_receiving_address: tripData.packageReceivingAddress,
        available_space: tripData.availableSpace ? parseFloat(tripData.availableSpace) : null,
        status: 'pending_approval'
      };

      console.log('📊 Transformed data for database:', dbTripData);

      await createTrip(dbTripData);
      setShowTripForm(false);
      toast({
        title: "¡Viaje registrado!",
        description: "Tu viaje ha sido registrado exitosamente. Está en revisión.",
      });
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      
      // Log to our centralized error tracking
      const { logFormError } = await import('@/lib/formErrorLogger');
      logFormError(error, 'dashboard-trip-submit', {
        hasRequiredDates: !!(tripData.arrivalDate && tripData.firstDayPackages && tripData.lastDayPackages),
        tripDataFields: Object.keys(tripData).length,
        isSafariIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)
      });
      
      toast({
        title: "Error",
        description: "No se pudo registrar el viaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      tripSubmitInProgressRef.current = false;
    }
  };

  const handleAddressConfirmation = (confirmedAddress: any) => {
    setPackages(packages.map(pkg => 
      pkg.id === currentUser.selectedPackageForAddress?.id 
        ? { ...pkg, status: 'address_confirmed', confirmedDeliveryAddress: confirmedAddress }
        : pkg
    ));
    setShowAddressConfirmation(false);
    toast({
      title: "¡Dirección confirmada!",
      description: "El comprador ya puede proceder con la compra y envío.",
    });
  };

  const handleQuoteSubmit = async (quoteData: any, selectedPackage: any, userType: 'user' | 'admin') => {
    try {
      console.log('🚀 STARTING QUOTE SUBMIT');
      console.log('📦 Selected package:', selectedPackage);
      console.log('💰 Quote data:', quoteData);
      console.log('👤 User type:', userType);
      console.log('🔧 updatePackage function available:', !!updatePackage);
      
      if (!updatePackage) {
        console.error('❌ updatePackage function not available');
        toast({
          title: "Error del sistema",
          description: "Función de actualización no disponible. Intenta refrescar la página.",
          variant: "destructive",
        });
        return;
      }

      // For sending a quote (when we have price data)
      if (quoteData.price !== undefined || quoteData.message === 'rejected') {
        console.log('📋 Processing quote submission or rejection');
        
        // Special case: traveler accepting admin-assigned tip
        const isTravelerAcceptingAssignedTip = userType === 'user' &&
                                              (selectedPackage.status === 'matched' || ['payment_confirmed', 'pending_purchase', 'purchase_confirmed', 'paid', 'shipped', 'in_transit', 'received_by_traveler', 'delivered', 'delivered_to_office'].includes(selectedPackage.status)) &&
                                              selectedPackage.admin_assigned_tip &&
                                              quoteData.adminAssignedTipAccepted;
        if (isTravelerAcceptingAssignedTip) {
          console.log('✅ Traveler accepted admin-assigned tip');
          
          // Buscar el viaje para poblar dirección del viajero y fechas
          let matchedTrip = selectedPackage.matched_trip_id ? 
            trips.find(trip => trip.id === selectedPackage.matched_trip_id) : null;
          
          if (!matchedTrip && selectedPackage.matched_trip_id) {
            console.log('🔄 Trip not found locally, fetching for address/dates...');
            try {
              const { data: tripData, error } = await supabase
                .from('trips')
                .select('*')
                .eq('id', selectedPackage.matched_trip_id)
                .single();
              if (error) throw error;
              matchedTrip = tripData;
            } catch (e) {
              console.error('❌ Failed to fetch matched trip:', e);
            }
          }

          const travelerAddress = buildTravelerAddress(matchedTrip);
          const matchedTripDates = matchedTrip ? {
            first_day_packages: matchedTrip.first_day_packages,
            last_day_packages: matchedTrip.last_day_packages,
            delivery_date: matchedTrip.delivery_date,
            arrival_date: matchedTrip.arrival_date
          } : null;
          
          // Check if package is already paid
          const isPaidPackage = ['payment_confirmed', 'pending_purchase', 'purchase_confirmed', 'paid', 'shipped', 'in_transit', 'received_by_traveler', 'delivered', 'delivered_to_office'].includes(selectedPackage.status) || !!selectedPackage.payment_receipt;
          
          if (isPaidPackage) {
            console.log('📦 Package already paid, proceeding directly and updating delivery info');
            // For paid packages, move to pending_purchase and update delivery info
            const normalizedQuoteData = normalizeQuote(quoteData, selectedPackage.delivery_method, selectedPackage.profiles?.trust_level || 'basic');
            await updatePackage(selectedPackage.id, {
              status: 'pending_purchase',
              quote: normalizedQuoteData,
              traveler_address: travelerAddress,
              matched_trip_dates: matchedTripDates
            });
            
            toast({
              title: "¡Tip aceptado!",
              description: "Datos de entrega actualizados. El shopper ya pagó, procede a recibir el paquete.",
            });
          } else {
            console.log('💰 Sending quote to shopper for payment (with delivery info)');
            // For unpaid packages, send quote to shopper and include delivery info
            const normalizedQuoteData = normalizeQuote(quoteData, selectedPackage.delivery_method, selectedPackage.profiles?.trust_level || 'basic');
            await updatePackage(selectedPackage.id, {
              status: 'quote_sent',
              quote: normalizedQuoteData,
              traveler_address: travelerAddress,
              matched_trip_dates: matchedTripDates
            });
            
            toast({
              title: "¡Tip aceptado!",
              description: "Se envió la cotización al shopper con la información de entrega.",
            });
          }
          
          // Close dialog after acceptance handled
          setShowQuoteDialog(false);
          setSelectedPackageForQuote(null);
          return;
        }
        
        if (quoteData.message === 'rejected') {
          console.log('❌ Processing rejection');

          // Check if this is a traveler rejecting an admin-assigned tip (matched status)
          const isTravelerRejectingAssignedTip = userType === 'user' && 
                                                selectedPackage.status === 'matched' && 
                                                selectedPackage.admin_assigned_tip;

          if (isTravelerRejectingAssignedTip) {
            console.log('🔧 Using RPC function for traveler rejection of admin-assigned tip');
            
            // Use the secure RPC function for traveler rejections
            const { error } = await supabase.rpc('traveler_reject_assignment', {
              _package_id: selectedPackage.id
            });

            if (error) {
              console.error('❌ RPC error:', error);
              if (error.message.includes('No tienes permisos')) {
                toast({
                  title: "Sin permisos",
                  description: "No tienes permisos para rechazar este paquete.",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Error",
                  description: "No se pudo procesar el rechazo. Intenta de nuevo.",
                  variant: "destructive",
                });
              }
              return;
            }

            // Success message for traveler rejection
            toast({
              title: "Asignación rechazada",
              description: "Has rechazado la asignación. El paquete está disponible para reasignación.",
            });

            // Force immediate refresh of packages and trips data
            await refreshPackages();
            await refreshTrips();
            
            // Switch to trips tab to refresh the view
            setActiveTab?.('trips');
            
          } else {
            // Original logic for other rejections (shoppers rejecting quotes)
            const updateData: any = {
              // Contextual JSON payload
              quote_rejection: {
                reason: quoteData.rejectionReason || null,
                wants_requote: !!quoteData.wantsRequote,
                additional_notes: quoteData.additionalNotes || null,
                rejected_at: new Date().toISOString(),
              },
              // Legacy fields for backward compatibility
              rejection_reason: quoteData.rejectionReason || null,
              wants_requote: !!quoteData.wantsRequote,
              additional_notes: quoteData.additionalNotes || null,
              // Reset match/quote context
              quote: null,
              matched_trip_id: null,
              traveler_address: null,
              matched_trip_dates: null,
            };

            // If shopper wants requote (and it's not "no_longer_want"), set to approved for reassignment
            if (quoteData.wantsRequote && quoteData.rejectionReason !== 'no_longer_want') {
              updateData.status = 'approved';
              toast({
                title: "Solicitud de nueva cotización",
                description: "Tu paquete está nuevamente disponible para que otros viajeros envíen cotizaciones.",
              });
            } else {
              // Final rejection
              updateData.status = 'quote_rejected';
              toast({
                title: "Cotización rechazada",
                description: "Has rechazado la cotización definitivamente.",
              });
            }

            await updatePackage(selectedPackage.id, updateData);
          }
        } else {
          console.log('✅ Processing quote sending');
          // Sending quote implies approval - need to set traveler address from matched trip
          console.log('🔍 Looking for matched trip with ID:', selectedPackage.matched_trip_id);
          console.log('🗂️ Available trips:', trips.map(t => ({ id: t.id, from: t.from_city, to: t.to_city })));
          
          let matchedTrip = selectedPackage.matched_trip_id ? 
            trips.find(trip => trip.id === selectedPackage.matched_trip_id) : null;
          
          // If trip not found locally, try to fetch it directly from database
          if (!matchedTrip && selectedPackage.matched_trip_id) {
            console.log('🔄 Trip not found locally, fetching from database...');
            try {
              const { data: tripData, error } = await supabase
                .from('trips')
                .select(`
                  *,
                  profiles (
                    id,
                    first_name,
                    last_name,
                    username,
                    email,
                    phone_number,
                    avatar_url,
                    trust_level,
                    created_at
                  )
                `)
                .eq('id', selectedPackage.matched_trip_id)
                .single();

              if (error) throw error;
              matchedTrip = tripData;
              console.log('✅ Trip fetched from database:', matchedTrip);
              
              // Refresh trips data to sync local state
              await refreshTrips();
            } catch (error) {
              console.error('❌ Failed to fetch trip from database:', error);
            }
          }
          
          console.log('🎯 Final matched trip:', matchedTrip);
          
          if (!matchedTrip) {
            console.error('❌ No matched trip found after all attempts for package:', selectedPackage.id);
            console.error('❌ Package matched_trip_id:', selectedPackage.matched_trip_id);
            console.error('❌ Available trip IDs:', trips.map(t => t.id));
            toast({
              title: "Error de sincronización",
              description: "No se encontró el viaje asociado. Los datos han sido actualizados, intenta nuevamente.",
              variant: "destructive",
            });
            return;
          }

          // Build traveler address from trip data
          const travelerAddress = matchedTrip.package_receiving_address ? {
            recipientName: matchedTrip.package_receiving_address.recipientName,
            streetAddress: matchedTrip.package_receiving_address.streetAddress,
            cityArea: matchedTrip.package_receiving_address.cityArea,
            postalCode: matchedTrip.package_receiving_address.postalCode,
            contactNumber: matchedTrip.package_receiving_address.contactNumber,
            hotelAirbnbName: matchedTrip.package_receiving_address.hotelAirbnbName,
            accommodationType: matchedTrip.package_receiving_address.accommodationType
          } : null;

          // Build trip dates information
          const matchedTripDates = {
            first_day_packages: matchedTrip.first_day_packages,
            last_day_packages: matchedTrip.last_day_packages,
            delivery_date: matchedTrip.delivery_date,
            arrival_date: matchedTrip.arrival_date
          };

          const normalizedQuoteData = normalizeQuote(quoteData, selectedPackage.delivery_method, selectedPackage.shopper_trust_level);
          await updatePackage(selectedPackage.id, {
            status: 'quote_sent',
            quote: normalizedQuoteData
          });
          toast({
            title: "¡Cotización enviada!",
            description: "Tu cotización ha sido enviada al comprador.",
          });
        }
      } else {
        if (quoteData.message === 'accepted') {
          console.log('✅ Accepting quote via RPC accept_quote');
          
          const { error } = await supabase.rpc('accept_quote', {
            _package_id: selectedPackage.id
          });

          if (error) {
            console.error('❌ RPC accept_quote error:', error);
            toast({
              title: "Error",
              description: error.message || "No se pudo aceptar la cotización.",
              variant: "destructive",
            });
            return;
          }

          // Opcional: refrescar paquetes para ver el cambio inmediato
          if (refreshPackages) {
            await refreshPackages();
          }

          // Cerrar diálogo y limpiar selección
          setShowQuoteDialog(false);
          setSelectedPackageForQuote(null);
          
          toast({
            title: "¡Cotización aceptada!",
            description: "Ahora sube tu comprobante de pago.",
          });
        } else {
          await updatePackage(selectedPackage.id, {
            status: 'quote_rejected',
            quote: null, // Clear the quote when rejected
            matched_trip_id: null, // Clear the match when quote is rejected
            traveler_address: null, // Clear sensitive address data
            matched_trip_dates: null, // Clear trip dates
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

  const handleUploadDocument = async (packageId: string, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) {
        console.error('Package not found:', packageId);
        return;
      }

      let updatedData: any = {};
      let newStatus = pkg.status;

      if (type === 'confirmation') {
        updatedData.purchase_confirmation = data;
        // Move to in_transit immediately when purchase confirmation is uploaded
        if (['pending_purchase','payment_confirmed','paid'].includes(pkg.status)) {
          newStatus = 'in_transit';
        }
      } else if (type === 'tracking') {
        updatedData.tracking_info = data;
        // Tracking upload doesn't change status - only confirmation does
      } else if (type === 'payment_receipt') {
        updatedData.payment_receipt = data;
        newStatus = 'payment_pending_approval';
      }

      // Update status if it changed
      if (newStatus !== pkg.status) {
        updatedData.status = newStatus;
      }

      // Update package in Supabase
      await updatePackage(packageId, updatedData);

      // Create automatic message in chat for document uploads
      if (type === 'confirmation' || type === 'tracking') {
        try {
          const messageContent = type === 'confirmation' 
            ? '📄 Comprobante de compra subido correctamente'
            : '📦 Información de seguimiento actualizada';
            
          await supabase
            .from('package_messages')
            .insert({
              package_id: packageId,
              user_id: currentUser?.id,
              message_type: 'status_update',
              content: messageContent
            });
        } catch (error) {
          console.error('Error creating chat message:', error);
        }
      }

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

      
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el documento. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const buildTravelerAddress = (matchedTrip: any) => {
    if (!matchedTrip) return null;
    
    // Extract address data properly from the nested structure
    const addressData = matchedTrip.package_receiving_address;
    if (!addressData) return null;
    
    return {
      recipientName: addressData.recipientName || "Destinatario no especificado",
      streetAddress: addressData.streetAddress || "Dirección no disponible",
      streetAddress2: addressData.streetAddress2 || null,
      cityArea: addressData.cityArea || "Ciudad no disponible",
      postalCode: addressData.postalCode || null,
      hotelAirbnbName: addressData.hotelAirbnbName || null,
      accommodationType: addressData.accommodationType || null,
      contactNumber: addressData.contactNumber || "Teléfono no disponible",
      additionalInstructions: addressData.additionalInstructions || null
    };
  };

  const handleConfirmPayment = async (packageId: string) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      console.log('Confirming payment for package:', packageId);
      
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) {
        console.error('Package not found:', packageId);
        return;
      }
      
      const matchedTrip = pkg.matched_trip_id ? trips.find(trip => trip.id === pkg.matched_trip_id) : null;
      
      const travelerAddress = buildTravelerAddress(matchedTrip);

      // NEW: Include trip dates for shipping information
      const matchedTripDates = matchedTrip ? {
        first_day_packages: matchedTrip.first_day_packages,
        last_day_packages: matchedTrip.last_day_packages,
        delivery_date: matchedTrip.delivery_date,
        arrival_date: matchedTrip.arrival_date
      } : null;

      // Update package in Supabase
      await updatePackage(packageId, {
        status: 'pending_purchase',
        traveler_address: travelerAddress,
        matched_trip_dates: matchedTripDates
      });
      
      toast({
        title: "¡Pago confirmado!",
        description: "El shopper ahora puede proceder a comprar el paquete.",
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

  const handleMatchPackage = async (packageId: string, tripId: string, adminTip?: number, productsWithTips?: any[]) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      // Require admin tip to proceed
      if (!adminTip || adminTip <= 0) {
        toast({
          title: "Tip requerido",
          description: "Debes asignar un tip al viajero para confirmar el match.",
          variant: "destructive",
        });
        return;
      }

      // Get trip information to include traveler address and dates
      const matchedTrip = trips.find(trip => trip.id === tripId);
      const travelerAddress = buildTravelerAddress(matchedTrip);

      // Include trip dates for shipping information
      const matchedTripDates = matchedTrip ? {
        first_day_packages: matchedTrip.first_day_packages,
        last_day_packages: matchedTrip.last_day_packages,
        delivery_date: matchedTrip.delivery_date,
        arrival_date: matchedTrip.arrival_date
      } : null;

      // Update package in Supabase with match information
      // Clear any previous quote data to ensure fresh start
      const updateData: any = {
        status: 'matched',
        matched_trip_id: tripId,
        quote: null, // Clear any previous quote from previous match
        admin_assigned_tip: adminTip,
        traveler_address: travelerAddress,
        matched_trip_dates: matchedTripDates
      };

      // If this is a multi-product order with individual tips, update products_data
      if (productsWithTips && productsWithTips.length > 0) {
        const currentPackage = packages.find(pkg => pkg.id === packageId);
        if (currentPackage?.products_data) {
          // Update existing products_data with assigned tips
          const updatedProductsData = currentPackage.products_data.map((product: any, index: number) => {
            const productWithTip = productsWithTips[index];
            return {
              ...product,
              adminAssignedTip: productWithTip?.adminAssignedTip || 0
            };
          });
          updateData.products_data = updatedProductsData;
        }
      } else {
        // Single-product case: ensure adminAssignedTip is saved inside products_data
        const currentPackage = packages.find(pkg => pkg.id === packageId);
        if (currentPackage) {
          let updatedProductsData: any[] | undefined;

          if (Array.isArray(currentPackage.products_data) && currentPackage.products_data.length > 0) {
            if (currentPackage.products_data.length === 1) {
              const onlyProduct = currentPackage.products_data[0];
              updatedProductsData = [{ ...onlyProduct, adminAssignedTip: adminTip }];
            }
            // If more than one product exists but no per-product tips provided, leave as is
          } else {
            // Build products_data from legacy fields
            updatedProductsData = [{
              itemDescription: currentPackage.item_description || 'Producto',
              estimatedPrice: String(currentPackage.estimated_price ?? '0'),
              itemLink: currentPackage.item_link || undefined,
              quantity: '1',
              adminAssignedTip: adminTip
            }];
          }

          if (updatedProductsData) {
            updateData.products_data = updatedProductsData;
          }
        }
      }

      await updatePackage(packageId, updateData);

      toast({
        title: "¡Match realizado!",
        description: `Tu solicitud fue emparejada. Tip asignado: Q${adminTip}.`,
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
        // Find the current package
        const currentPackage = packages.find(pkg => pkg.id === id);
        let updateData: any = { status };

        // Special handling for status change from "matched" to "quote_sent"
        if (currentPackage?.status === 'matched' && status === 'quote_sent') {
          console.log('🔄 Admin changing status from matched to quote_sent, generating quote...');
          
          // Check if we have admin_assigned_tip
          if (!currentPackage.admin_assigned_tip || currentPackage.admin_assigned_tip <= 0) {
            toast({
              title: "Error",
              description: "No se puede enviar cotización sin un tip asignado por admin.",
              variant: "destructive",
            });
            return;
          }

          try {
            // Import quote helper
            const { createNormalizedQuote } = await import('@/lib/quoteHelpers');
            const { supabase } = await import('@/integrations/supabase/client');

            // Fetch shopper's profile to get trust level
            const { data: shopperProfile, error: profileError } = await supabase
              .from('profiles')
              .select('trust_level')
              .eq('id', currentPackage.user_id)
              .single();

            if (profileError) {
              console.error('Error fetching shopper profile:', profileError);
              toast({
                title: "Error",
                description: "No se pudo obtener el perfil del comprador.",
                variant: "destructive",
              });
              return;
            }

            // Fetch matched trip details for address and dates
            let travelerAddress = null;
            let matchedTripDates = null;

            if (currentPackage.matched_trip_id) {
              const matchedTrip = trips.find(trip => trip.id === currentPackage.matched_trip_id);
              
              if (matchedTrip) {
                // Build traveler address from trip data
                travelerAddress = matchedTrip.package_receiving_address ? {
                  recipientName: matchedTrip.package_receiving_address.recipientName,
                  streetAddress: matchedTrip.package_receiving_address.streetAddress,
                  cityArea: matchedTrip.package_receiving_address.cityArea,
                  postalCode: matchedTrip.package_receiving_address.postalCode,
                  contactNumber: matchedTrip.package_receiving_address.contactNumber,
                  hotelAirbnbName: matchedTrip.package_receiving_address.hotelAirbnbName,
                  accommodationType: matchedTrip.package_receiving_address.accommodationType
                } : null;

                // Build trip dates information
                matchedTripDates = {
                  first_day_packages: matchedTrip.first_day_packages,
                  last_day_packages: matchedTrip.last_day_packages,
                  delivery_date: matchedTrip.delivery_date,
                  arrival_date: matchedTrip.arrival_date
                };
              }
            }

            // Generate quote using admin_assigned_tip as base price
            const normalizedQuote = createNormalizedQuote(
              currentPackage.admin_assigned_tip,
              currentPackage.delivery_method || 'pickup',
              shopperProfile.trust_level,
              `Cotización generada automáticamente por admin`,
              true // adminAssignedTipAccepted
            );

            // Update package with quote, address, and dates
            updateData = {
              status,
              quote: normalizedQuote,
              traveler_address: travelerAddress,
              matched_trip_dates: matchedTripDates,
              quote_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours from now
            };

            console.log('📊 Generated quote:', normalizedQuote);
          } catch (quoteError) {
            console.error('Error generating quote:', quoteError);
            toast({
              title: "Error",
              description: "No se pudo generar la cotización automáticamente.",
              variant: "destructive",
            });
            return;
          }
        }

        await updatePackage(id, updateData);
        
        toast({
          title: "Estado actualizado",
          description: currentPackage?.status === 'matched' && status === 'quote_sent' 
            ? `Cotización enviada automáticamente con $${currentPackage.admin_assigned_tip}`
            : `El estado del paquete ha sido actualizado a: ${status}`,
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

  const handleApproveReject = async (type: 'package' | 'trip', id: string, action: 'approve' | 'reject', reason?: string) => {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    try {
      if (type === 'package' && updatePackage) {
        const updateData: any = { status: newStatus };
        
        // When rejecting, persist contextual admin_rejection and keep legacy for compatibility
        if (action === 'reject' && reason) {
          updateData.admin_rejection = {
            reason,
            rejected_by: currentUser?.id || null,
            rejected_at: new Date().toISOString(),
          };
          updateData.rejection_reason = reason; // legacy fallback
        }
        
        await updatePackage(id, updateData);
        
        // Refresh packages after approval/rejection to ensure UI is updated
        if (refreshPackages) {
          await refreshPackages();
        }
        
        toast({
          title: action === 'approve' ? "¡Solicitud aprobada!" : "Solicitud rechazada",
          description: `La solicitud de paquete ha sido ${action === 'approve' ? 'aprobada' : 'rechazada'}.`,
        });
      } else if (type === 'trip' && updateTrip) {
        const updateData: any = { status: newStatus };
        
        if (action === 'reject' && reason) {
          updateData.admin_rejection = {
            reason,
            rejected_by: currentUser?.id || null,
            rejected_at: new Date().toISOString(),
          };
          updateData.rejection_reason = reason; // legacy fallback
        }
        
        await updateTrip(id, updateData);
        
        // Refresh trips after approval/rejection to ensure UI is updated
        if (refreshTrips) {
          await refreshTrips();
        }
        
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

  const handlePaymentApproval = async (packageId: string, action: 'approve' | 'reject') => {
    try {
      if (!updatePackage) return;
      
      if (action === 'approve') {
        // Encontrar el paquete para obtener la información del viaje
        const selectedPackage = packages.find(pkg => pkg.id === packageId);
        const matchedTrip = selectedPackage?.matched_trip_id ? 
          trips.find(trip => trip.id === selectedPackage.matched_trip_id) : null;

        let travelerAddress = null;
        let matchedTripDates = null;

        if (matchedTrip) {
          // Build traveler address from trip data
          travelerAddress = matchedTrip.package_receiving_address ? {
            recipientName: matchedTrip.package_receiving_address.recipientName,
            streetAddress: matchedTrip.package_receiving_address.streetAddress,
            cityArea: matchedTrip.package_receiving_address.cityArea,
            postalCode: matchedTrip.package_receiving_address.postalCode,
            contactNumber: matchedTrip.package_receiving_address.contactNumber,
            hotelAirbnbName: matchedTrip.package_receiving_address.hotelAirbnbName,
            accommodationType: matchedTrip.package_receiving_address.accommodationType
          } : null;

          // Build trip dates information
          matchedTripDates = {
            first_day_packages: matchedTrip.first_day_packages,
            last_day_packages: matchedTrip.last_day_packages,
            delivery_date: matchedTrip.delivery_date,
            arrival_date: matchedTrip.arrival_date
          };
        }

        // Aprobar el pago y guardar información de envío
        await updatePackage(packageId, { 
          status: 'pending_purchase',
          traveler_address: travelerAddress,
          matched_trip_dates: matchedTripDates
        });
        toast({
          title: "¡Pago aprobado!",
          description: "El pago ha sido aprobado y la dirección de envío se ha compartido con el shopper.",
        });
      } else {
        // Rechazar el pago y revertir a quote_accepted
        await updatePackage(packageId, { 
          status: 'quote_accepted',
          payment_receipt: null 
        });
        toast({
          title: "Pago rechazado",
          description: "El pago ha sido rechazado. El shopper deberá subir un nuevo comprobante.",
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      toast({
        title: "Error",
        description: `No se pudo ${action === 'approve' ? 'aprobar' : 'rechazar'} el pago. Inténtalo de nuevo.`,
        variant: "destructive",
      });
    }
  };

  const handleConfirmPackageReceived = async (packageId: string, photo?: string) => {
    try {
      console.log('🎯 handleConfirmPackageReceived called with:', { packageId, photo: !!photo });
      
      if (!updatePackage) {
        console.error('❌ updatePackage function not available');
        toast({
          title: "Error del sistema",
          description: "Función de actualización no disponible. Intenta refrescar la página.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Updating package status to received_by_traveler');
      
      await updatePackage(packageId, {
        status: 'received_by_traveler',
        traveler_confirmation: {
          confirmedAt: new Date().toISOString(),
          photo: photo || null
        }
      });
      
      console.log('✅ Package updated successfully');
      
      toast({
        title: "¡Paquete confirmado!",
        description: "Has confirmado la recepción del paquete.",
      });
    } catch (error) {
      console.error('❌ Error confirming package received:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la recepción del paquete. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmOfficeReception = async (packageId: string) => {
    try {
      // Check if current user is admin
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser?.id);

      if (rolesError) throw rolesError;

      const isAdmin = userRoles?.some(role => role.role === 'admin');
      
      if (isAdmin) {
        // Admin flow: Direct confirmation, bypass pending status
        console.log('🎯 Admin detected, routing to direct confirmation');
        await handleAdminConfirmOfficeDelivery(packageId);
        return;
      }

      // Traveler flow: Set to pending confirmation
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      // NUEVO FLUJO ESCROW: Solo marcar la declaración del viajero
      // El admin debe confirmar por separado para desbloquear el pago
      await updatePackage(packageId, {
        status: 'pending_office_confirmation',
        office_delivery: {
          traveler_declaration: {
            declared_by: currentUser?.id,
            declared_at: new Date().toISOString()
          }
        }
      });
      
      toast({
        title: "¡Entrega declarada!",
        description: "Has declarado la entrega en oficina. Esperando confirmación del administrador para desbloquear tu compensación.",
        duration: 6000,
      });

      // Send notification to admin about pending confirmation
      toast({
        title: "📋 Pendiente de confirmación",
        description: "El administrador debe confirmar la recepción del paquete antes de que puedas solicitar tu compensación.",
        duration: 8000,
      });
      
    } catch (error) {
      console.error('Error confirming office reception:', error);
      toast({
        title: "Error",
        description: "No se pudo declarar la entrega en oficina. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAdminConfirmOfficeDelivery = async (packageId: string) => {
    console.log('🎯 handleAdminConfirmOfficeDelivery called with packageId:', packageId);
    // Optimistic UI: update local state immediately, then confirm via RPC
    const prevPackages = [...packages];
    try {
      console.log('🏢 Admin confirming office delivery...', { packageId, currentUser });

      // Validate current local state - now accepting multiple states
      const current = packages.find(p => p.id === packageId);
      const validStates = ['in_transit', 'received_by_traveler', 'pending_office_confirmation'];
      if (!current || !validStates.includes(current.status)) {
        toast({
          title: 'Estado inválido',
          description: 'Este paquete no está en un estado válido para confirmación en oficina.',
          variant: 'destructive',
        });
        return;
      }

      // Apply optimistic update
      const hasTravelerDeclaration = !!current?.office_delivery?.traveler_declaration;
      const optimisticOfficeDelivery = {
        ...(current.office_delivery || {}),
        admin_confirmation: {
          confirmed_by: currentUser?.id,
          confirmed_at: new Date().toISOString(),
          skipped_traveler_declaration: !hasTravelerDeclaration,
        },
      };
      const optimisticPackages = packages.map(p =>
        p.id === packageId
          ? { ...p, status: 'delivered_to_office', office_delivery: optimisticOfficeDelivery, updated_at: new Date().toISOString() }
          : p
      );
      setPackages(optimisticPackages);

      // Ensure we have a valid session (prevents auth.uid() = NULL in RPC)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Auth getSession error:', sessionError);
      }
      const session = sessionData?.session ?? null;
      if (!session || !session.user) {
        // Revert optimistic update
        setPackages(prevPackages);
        toast({
          title: 'Sesión expirada',
          description: 'Vuelve a iniciar sesión e intenta de nuevo.',
          variant: 'destructive',
        });
        return;
      }

      // Try the secure RPC first (source of truth in DB)
      const { error: rpcError } = await supabase.rpc('admin_confirm_office_delivery', {
        _package_id: packageId,
        _admin_id: session.user.id,
      });

      if (rpcError) {
        console.error('RPC admin_confirm_office_delivery error:', rpcError);
        const msg = (rpcError.message || '').toLowerCase();
        const isAuthError = msg.includes('auth') || msg.includes('jwt') || msg.includes('permission') || msg.includes('only admins') || msg.includes('solo los administradores');
        const isInvalidState = msg.includes('estado inválido');

        if (isInvalidState) {
          // Revert optimistic update
          setPackages(prevPackages);
          toast({
            title: 'Estado inválido',
            description: 'No se pudo confirmar: estado inválido o falta la declaración del viajero.',
            variant: 'destructive',
          });
          return;
        }

        // Fallback only for auth-related issues: perform a direct update with RLS
        if (isAuthError) {
          console.warn('Falling back to direct update with RLS...');

          // Fetch current package to merge JSON safely
          const { data: pkg, error: fetchError } = await supabase
            .from('packages')
            .select('id,status,office_delivery,user_id,item_description')
            .eq('id', packageId)
            .maybeSingle();

          if (fetchError || !pkg) {
            console.error('Failed to fetch package before fallback:', fetchError);
            // Revert optimistic update
            setPackages(prevPackages);
            toast({ title: 'Error', description: 'No se pudo obtener el paquete para confirmar.', variant: 'destructive' });
            return;
          }

          const officeDelivery: any = (pkg.office_delivery && typeof pkg.office_delivery === 'object') ? pkg.office_delivery : {};
          if (pkg.status !== 'pending_office_confirmation' || !officeDelivery?.traveler_declaration) {
            // Revert optimistic update
            setPackages(prevPackages);
            toast({ title: 'Estado inválido', description: 'Este paquete no está listo para confirmación en oficina.', variant: 'destructive' });
            return;
          }

          const updatedOfficeDelivery = {
            ...(officeDelivery || {}),
            admin_confirmation: {
              confirmed_by: session.user.id,
              confirmed_at: new Date().toISOString(),
            },
          } as any;

          const { error: updError } = await supabase
            .from('packages')
            .update({
              status: 'delivered_to_office',
              office_delivery: updatedOfficeDelivery,
              updated_at: new Date().toISOString(),
            })
            .eq('id', packageId);

          if (updError) {
            console.error('Fallback update error:', updError);
            // Revert optimistic update
            setPackages(prevPackages);
            toast({ title: 'Error', description: 'No se pudo confirmar la entrega (fallback).', variant: 'destructive' });
            return;
          }
        } else {
          // Non-auth error: revert and surface it
          setPackages(prevPackages);
          throw rpcError;
        }
      }

      // Optional notification to shopper (keep existing behavior)
      const packageData = packages?.find(pkg => pkg.id === packageId);
      if (packageData?.user_id) {
        await supabase.from('notifications').insert({
          user_id: packageData.user_id,
          title: 'Paquete en oficina',
          message: `Tu paquete "${packageData.item_description}" ya está disponible en nuestra oficina para recoger.`,
          type: 'delivery',
          priority: 'high',
        });
      }

      // Refresh UI to ensure consistency with backend
      if (refreshPackages) {
        await refreshPackages();
      }

      toast({
        title: '¡Entrega confirmada!',
        description: 'Has confirmado la recepción del paquete en oficina.',
      });

    } catch (error: any) {
      console.error('❌ Error confirming office delivery:', error);
      // Revert optimistic update on error
      setPackages(prevPackages);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo confirmar la entrega. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };
  const handleConfirmShopperReceived = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('packages')
        .update({ status: 'completed' })
        .eq('id', packageId);

      if (error) throw error;

      toast({
        title: "✅ Confirmado",
        description: "Se confirmó que el shopper recibió su paquete.",
      });
    } catch (error) {
      console.error('Error confirming shopper received:', error);
      toast({
        title: "Error",
        description: "No se pudo confirmar la recepción del shopper.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDeliveryComplete = async (packageId: string) => {
    try {
      console.log('🚀 === INICIANDO CONFIRMACIÓN DE ENTREGA ===');
      console.log('📦 Package ID:', packageId);
      console.log('👤 Current user:', currentUser);
      console.log('🔧 updatePackage function available:', !!updatePackage);
      
      if (!updatePackage) {
        console.error('❌ updatePackage function not available');
        toast({
          title: "Error",
          description: "Función de actualización no disponible.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔄 Updating package status to completed...');
      const result = await updatePackage(packageId, {
        status: 'completed'
      });
      
      console.log('✅ Package updated successfully:', result);

      // Actualizar o crear trip payment accumulator después de marcar como completado
      const packageForAccumulator = packages?.find(pkg => pkg.id === packageId);
      if (packageForAccumulator?.matched_trip_id) {
        const { createOrUpdateTripPaymentAccumulator } = await import('@/hooks/useCreateTripPaymentAccumulator');
        const tripId = packageForAccumulator.matched_trip_id;
        const travelerId = packageForAccumulator.trips?.user_id || packageForAccumulator.trips?.profiles?.id;
        
        if (travelerId) {
          console.log('🔄 Updating trip payment accumulator for trip:', tripId);
          await createOrUpdateTripPaymentAccumulator(tripId, travelerId);
        }
      }
      
      // Find the package to get user info
      const updatedPackage = packages?.find(pkg => pkg.id === packageId);
      
      toast({
        title: "¡Entrega completada!",
        description: "El paquete ha sido marcado como entregado exitosamente.",
      });

      // Send notification to shopper and traveler
      if (updatedPackage) {
        toast({
          title: "🎉 Proceso completado",
          description: `El paquete "${updatedPackage.item_description}" ha sido entregado exitosamente al shopper.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('💥 Error confirming delivery complete:', error);
      console.error('💥 Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: `No se pudo confirmar la entrega: ${error.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    }
  };

  const handleEditTrip = async (editedTripData: any) => {
    try {
      if (!updateTrip) {
        console.error('updateTrip function not available');
        return;
      }

      // Prepare DB data with correct field mappings
      const dbTripData = {
        from_country: editedTripData.fromCountry,
        from_city: editedTripData.fromCity,
        to_city: editedTripData.toCity,
        arrival_date: editedTripData.arrivalDate,
        departure_date: editedTripData.arrivalDate, // Set to arrival_date for compatibility
        delivery_date: editedTripData.deliveryDate,
        first_day_packages: editedTripData.firstDayPackages,
        last_day_packages: editedTripData.lastDayPackages,
        available_space: parseFloat(editedTripData.availableSpace),
        package_receiving_address: editedTripData.packageReceivingAddress,
        delivery_method: editedTripData.deliveryMethod,
        messenger_pickup_info: editedTripData.deliveryMethod === 'delivery' ? 
          { location: editedTripData.messengerPickupLocation } : null,
        status: 'pending_approval' // Always reset to pending approval after edit
      };

      // Update trip in database (this automatically updates local state)
      await updateTrip(editedTripData.id, dbTripData);
      
      toast({
        title: "¡Viaje actualizado!",
        description: "Los cambios se han guardado. El viaje requiere nueva aprobación del administrador.",
      });
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditPackage = async (editedPackageData: any) => {
    try {
      if (!updatePackage) {
        console.error('updatePackage function not available');
        return;
      }

      const originalPackage = packages.find(pkg => pkg.id === editedPackageData.id);
      if (!originalPackage) {
        console.error('Original package not found');
        return;
      }

      // If package was approved, reset to pending approval for admin review
      const needsReapproval = originalPackage.status === 'approved';
      
      // Prepare update data (remove ID and set status)
      const { id, ...updateData } = editedPackageData;
      updateData.status = needsReapproval ? 'pending_approval' : originalPackage.status;
      
      // Add additional notes to products_data if it exists
      if (updateData.products_data && Array.isArray(updateData.products_data)) {
        updateData.products_data = updateData.products_data.map((product: any) => ({
          ...product,
          additionalNotes: updateData.additional_notes || null
        }));
      }

      // Update package in Supabase (this automatically updates local state)
      await updatePackage(id, updateData);

      toast({
        title: "¡Solicitud actualizada!",
        description: needsReapproval 
          ? "Los cambios se han guardado. La solicitud requiere nueva aprobación del administrador."
          : "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
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
    handlePaymentApproval,
    handleConfirmPackageReceived,
    handleConfirmOfficeReception,
    handleAdminConfirmOfficeDelivery,
    handleConfirmShopperReceived,
    handleConfirmDeliveryComplete,
    handleEditTrip,
    handleEditPackage
  };
};
