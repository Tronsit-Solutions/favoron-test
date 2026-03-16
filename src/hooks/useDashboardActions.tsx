import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from 'react';
import { normalizeQuote, shouldRecalculateQuote, createNormalizedQuote } from '@/lib/quoteHelpers';
import { usePlatformFeesContext } from "@/contexts/PlatformFeesContext";
import { sendWhatsAppNotification } from '@/lib/whatsappNotifications';
import { createHistoryEntry, appendTripHistoryEntry, buildEditDiff } from '@/utils/tripHistoryHelpers';
import { inferCountryFromCity } from '@/lib/cities';
import { getCountryLabel } from '@/lib/countries';

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
  setQuoteUserType: (type: 'user' | 'admin' | 'operations') => void,
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
  const { rates, fees } = usePlatformFeesContext();
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
        delivery_deadline: packageData.deliveryDeadline 
          ? (typeof packageData.deliveryDeadline === 'string' 
              ? packageData.deliveryDeadline 
              : packageData.deliveryDeadline.toISOString())
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        package_destination: packageData.packageDestination,
        package_destination_country: packageData.packageDestinationCountry || inferCountryFromCity(packageData.packageDestination) || null,
        purchase_origin: packageData.purchaseOrigin,
        additional_notes: packageData.additionalNotes || null,
        internal_notes: (packageData.internal_notes ?? packageData.internalNotes)?.trim() || null,
        delivery_method: packageData.deliveryMethod || 'pickup',
        confirmed_delivery_address: packageData.deliveryAddress || null,
        status: 'pending_approval'
      };
      
      console.log('💾 Database Package Data:', dbPackageData);

      // Create the package and get the result
      const newPackage = await createPackage(dbPackageData);
      console.log('✅ Package created successfully:', newPackage);

      // Send confirmation email (non-blocking)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const productsList = products.map((p: any) => 
            `<li><strong>${p.itemDescription || 'Producto'}</strong> — Cantidad: ${p.quantity || 1}${p.estimatedPrice ? `, ~$${p.estimatedPrice}` : ''}</li>`
          ).join('');
          const deadlineDate = dbPackageData.delivery_deadline 
            ? new Date(dbPackageData.delivery_deadline).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' }) 
            : 'No especificada';
          const deliveryMethodLabel = dbPackageData.delivery_method === 'delivery' ? 'Entrega a domicilio' : 'Recogida en oficina';

          const emailMessage = `
            <p>¡Tu solicitud de paquete fue enviada exitosamente! Aquí tienes un resumen:</p>
            <ul>${productsList}</ul>
            <p><strong>Origen:</strong> ${dbPackageData.purchase_origin}</p>
            <p><strong>Destino:</strong> ${dbPackageData.package_destination}${dbPackageData.package_destination_country ? `, ${dbPackageData.package_destination_country}` : ''}</p>
            <p><strong>Fecha límite de entrega:</strong> ${deadlineDate}</p>
            <p><strong>Método de entrega:</strong> ${deliveryMethodLabel}</p>
            <p>Nuestro equipo revisará tu solicitud y te enviaremos una cotización pronto.</p>
          `;

          supabase.functions.invoke('send-notification-email', {
            body: {
              user_id: user.id,
              title: 'Tu solicitud de paquete fue enviada',
              message: emailMessage,
              type: 'package',
              priority: 'normal',
              action_url: 'https://favoron.app/dashboard'
            }
          }).catch(err => console.warn('📧 Email confirmation failed (non-critical):', err));
        }
      } catch (emailErr) {
        console.warn('📧 Could not send package confirmation email:', emailErr);
      }

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
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        // Normalize to midday UTC to ensure consistent date display
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        return new Date(Date.UTC(year, month, day, 12, 0, 0, 0)).toISOString();
      };

      const dbTripData = {
        from_city: tripData.fromCity,
        from_country: tripData.fromCountry,
        to_city: tripData.toCity,
        to_country: tripData.toCountry, // Fix: Map destination country to database
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

      // Send confirmation email (non-blocking)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const arrivalDateStr = new Date(dbTripData.arrival_date).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
          const firstDayStr = new Date(dbTripData.first_day_packages).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
          const lastDayStr = new Date(dbTripData.last_day_packages).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
          const deliveryMethodLabel = dbTripData.delivery_method === 'mensajero' ? 'Mensajero' : dbTripData.delivery_method === 'delivery' ? 'Entrega a domicilio' : 'Oficina';

          const emailMessage = `
            <p>¡Tu viaje fue registrado exitosamente! Aquí tienes un resumen:</p>
            <p><strong>Origen:</strong> ${dbTripData.from_city}${dbTripData.from_country ? `, ${getCountryLabel(dbTripData.from_country)}` : ''}</p>
            <p><strong>Destino:</strong> ${dbTripData.to_city}${dbTripData.to_country ? `, ${getCountryLabel(dbTripData.to_country)}` : ''}</p>
            <p><strong>Fecha de llegada:</strong> ${arrivalDateStr}</p>
            <p><strong>Ventana de recepción:</strong> ${firstDayStr} — ${lastDayStr}</p>
            <p><strong>Método de entrega:</strong> ${deliveryMethodLabel}</p>
            ${dbTripData.available_space ? `<p><strong>Espacio disponible:</strong> ${dbTripData.available_space} kg</p>` : ''}
            <p>Nuestro equipo revisará tu viaje y te asignaremos paquetes pronto.</p>
          `;

          supabase.functions.invoke('send-notification-email', {
            body: {
              user_id: user.id,
              title: 'Tu viaje fue registrado',
              message: emailMessage,
              type: 'trip',
              priority: 'normal',
              action_url: 'https://favoron.app/dashboard'
            }
          }).catch(err => console.warn('📧 Email confirmation failed (non-critical):', err));
        }
      } catch (emailErr) {
        console.warn('📧 Could not send trip confirmation email:', emailErr);
      }

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

  const handleQuoteSubmit = async (quoteData: any, selectedPackage: any, userType: 'user' | 'admin' | 'operations') => {
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
                                              (selectedPackage.status === 'matched' || ['pending_purchase', 'purchase_confirmed', 'paid', 'shipped', 'in_transit', 'received_by_traveler', 'delivered', 'delivered_to_office'].includes(selectedPackage.status)) &&
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
                .select(`
                  id, from_city, to_city, from_country, arrival_date, delivery_date,
                  first_day_packages, last_day_packages, delivery_method, messenger_pickup_info,
                  package_receiving_address, status, created_at, updated_at, user_id,
                  available_space, last_mile_delivered, rejection_reason, admin_rejection,
                  client_request_id
                `)
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
          const isPaidPackage = ['pending_purchase', 'purchase_confirmed', 'paid', 'shipped', 'in_transit', 'received_by_traveler', 'delivered', 'delivered_to_office'].includes(selectedPackage.status) || !!selectedPackage.payment_receipt;
          
          if (isPaidPackage) {
            console.log('📦 Package already paid, proceeding directly and updating delivery info');
            // For paid packages, move to pending_purchase and update delivery info
            const cityArea = (selectedPackage.confirmed_delivery_address as any)?.cityArea;
            const normalizedQuoteData = normalizeQuote(quoteData, selectedPackage.delivery_method, selectedPackage.profiles?.trust_level || 'basic', cityArea || selectedPackage.package_destination, rates, {
              delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
              delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
              delivery_fee_outside_city: fees.delivery_fee_outside_city,
              prime_delivery_discount: fees.prime_delivery_discount,
            }, selectedPackage.package_destination_country);
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
            const cityAreaUnpaid = (selectedPackage.confirmed_delivery_address as any)?.cityArea;
            const normalizedQuoteData = normalizeQuote(quoteData, selectedPackage.delivery_method, selectedPackage.profiles?.trust_level || 'basic', cityAreaUnpaid || selectedPackage.package_destination, rates, {
              delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
              delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
              delivery_fee_outside_city: fees.delivery_fee_outside_city,
              prime_delivery_discount: fees.prime_delivery_discount,
            }, selectedPackage.package_destination_country);
            await updatePackage(selectedPackage.id, {
              status: 'quote_sent',
              quote: normalizedQuoteData,
              traveler_address: travelerAddress,
              matched_trip_dates: matchedTripDates
            });
            
            // 📱 Enviar notificación WhatsApp al shopper
            if (selectedPackage.user_id) {
              const quoteTotal = normalizedQuoteData.totalPrice || 0;
              const productName = selectedPackage.products_data?.[0]?.itemDescription || selectedPackage.item_description || 'Tu pedido';
              
              sendWhatsAppNotification({
                userId: selectedPackage.user_id,
                templateId: 'quote_received_v2',
                variables: {
                  "2": `${quoteTotal.toFixed(2)}`,
                  "3": productName.substring(0, 50)
                }
              });
            }
            
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
              _package_id: selectedPackage.id,
              _rejection_reason: quoteData.rejectionReason || null,
              _additional_comments: quoteData.additionalNotes || null
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
            
            // Capture traveler info before clearing matched_trip_id
            // Use RPC function to get traveler info (bypasses RLS for shopper access)
            let rejectedTravelerInfo = null;
            if (selectedPackage.matched_trip_id) {
              // First try to find the trip in local state (may have profiles loaded)
              let matchedTrip = trips.find(trip => trip.id === selectedPackage.matched_trip_id);
              
              if (matchedTrip && matchedTrip.profiles) {
                // Use local data if available with profile info
                const profile = matchedTrip.profiles;
                rejectedTravelerInfo = {
                  trip_id: matchedTrip.id,
                  traveler_id: matchedTrip.user_id,
                  traveler_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Desconocido',
                  arrival_date: matchedTrip.arrival_date,
                  delivery_date: matchedTrip.delivery_date,
                  from_city: matchedTrip.from_city,
                  to_city: matchedTrip.to_city,
                };
              } else {
                // Use RPC function to get traveler info (SECURITY DEFINER bypasses RLS)
                try {
                  const { data: tripData, error } = await supabase
                    .rpc('get_trip_with_traveler_info', { trip_id: selectedPackage.matched_trip_id });
                  
                  if (!error && tripData && tripData.length > 0) {
                    const trip = tripData[0];
                    rejectedTravelerInfo = {
                      trip_id: trip.id,
                      traveler_id: trip.user_id,
                      traveler_name: trip.traveler_name || 'Desconocido',
                      arrival_date: trip.arrival_date,
                      delivery_date: trip.delivery_date,
                      from_city: trip.from_city,
                      to_city: trip.to_city,
                    };
                  }
                } catch (e) {
                  console.warn('Could not fetch rejected traveler info:', e);
                }
              }
            }
            
            // Build admin_actions_log entry for audit trail
            const existingLog = Array.isArray(selectedPackage.admin_actions_log) ? selectedPackage.admin_actions_log : [];
            const quoteRejectionLogEntry = {
              action_type: 'quote_rejection',
              previous_trip_id: rejectedTravelerInfo?.trip_id || selectedPackage.matched_trip_id || null,
              previous_traveler_id: rejectedTravelerInfo?.traveler_id || null,
              previous_traveler_name: rejectedTravelerInfo?.traveler_name || 'Desconocido',
              rejection_reason: quoteData.rejectionReason || null,
              wants_requote: !!quoteData.wantsRequote,
              timestamp: new Date().toISOString(),
            };

            const updateData: any = {
              // Contextual JSON payload with rejected traveler history
              quote_rejection: {
                reason: quoteData.rejectionReason || null,
                wants_requote: !!quoteData.wantsRequote,
                additional_notes: quoteData.additionalNotes || null,
                rejected_at: new Date().toISOString(),
                rejected_traveler: rejectedTravelerInfo,
              },
              // Append to admin_actions_log for permanent audit trail
              admin_actions_log: [...existingLog, quoteRejectionLogEntry],
              // Legacy fields for backward compatibility
              rejection_reason: quoteData.rejectionReason || null,
              wants_requote: !!quoteData.wantsRequote,
              internal_notes: quoteData.additionalNotes || null,
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
                  id, from_city, to_city, from_country, arrival_date, delivery_date,
                  first_day_packages, last_day_packages, delivery_method, messenger_pickup_info,
                  package_receiving_address, status, created_at, updated_at, user_id,
                  available_space, last_mile_delivered, rejection_reason, admin_rejection,
                  client_request_id,
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

          const cityAreaTraveler = (selectedPackage.confirmed_delivery_address as any)?.cityArea;
          const normalizedQuoteData = normalizeQuote(quoteData, selectedPackage.delivery_method, selectedPackage.shopper_trust_level, cityAreaTraveler || selectedPackage.package_destination, rates, {
            delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
            delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
            delivery_fee_outside_city: fees.delivery_fee_outside_city,
            prime_delivery_discount: fees.prime_delivery_discount,
          }, selectedPackage.package_destination_country);
          await updatePackage(selectedPackage.id, {
            status: 'quote_sent',
            quote: normalizedQuoteData
          });
          
          // 📱 Enviar notificación WhatsApp al shopper
          if (selectedPackage.user_id) {
            const quoteTotal = normalizedQuoteData.totalPrice || 0;
            const productName = selectedPackage.products_data?.[0]?.itemDescription || selectedPackage.item_description || 'Tu pedido';
            
            sendWhatsAppNotification({
              userId: selectedPackage.user_id,
              templateId: 'quote_received_v2',
              variables: {
                "2": `${quoteTotal.toFixed(2)}`,
                "3": productName.substring(0, 50)
              }
            });
          }
          
          toast({
            title: "¡Cotización enviada!",
            description: "Tu cotización ha sido enviada al comprador.",
          });
        }
      } else {
        if (quoteData.message === 'accepted') {
          console.log('✅ Accepting quote via RPC accept_quote');
          
          // Handle delivery method change
          if (quoteData.deliveryMethodChange) {
            console.log('🚚 Shopper changed delivery method to:', quoteData.deliveryMethodChange);
            
            // Recalculate quote with new delivery method
            const currentQuote = selectedPackage.quote || {};
            const basePrice = parseFloat(currentQuote.price || '0');
            const recalculatedQuote = createNormalizedQuote(
              basePrice,
              quoteData.deliveryMethodChange,
              selectedPackage.profiles?.trust_level || 'basic',
              currentQuote.message || '',
              true,
              (selectedPackage.confirmed_delivery_address as any)?.cityArea || selectedPackage.package_destination,
              rates,
              {
                delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
                delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
                delivery_fee_outside_city: fees.delivery_fee_outside_city,
                prime_delivery_discount: fees.prime_delivery_discount,
              },
              selectedPackage.package_destination_country
            );
            
            await updatePackage(selectedPackage.id, {
              delivery_method: quoteData.deliveryMethodChange,
              quote: recalculatedQuote
            });
          }
          
          // Handle product exclusions (when shopper removed products from quote)
          if (quoteData.updatedProducts && quoteData.recalculatedQuote) {
            console.log('📦 Shopper excluded products, updating products_data and quote');
            
            // Prepare quote with discount if applicable
            let finalQuote = quoteData.recalculatedQuote;
            if (quoteData.discountCodeId && quoteData.discountAmount > 0) {
              finalQuote = {
                ...finalQuote,
                discountCode: quoteData.discountCode,
                discountCodeId: quoteData.discountCodeId,
                discountAmount: quoteData.discountAmount,
                originalTotalPrice: quoteData.originalTotalPrice,
                finalTotalPrice: quoteData.finalTotalPrice
              };
            }
            
            // Build internal notes for removed products
            const removedProductsNote = quoteData.removedProducts?.length > 0
              ? `[${new Date().toISOString()}] Productos removidos por shopper: ${quoteData.removedProducts.join(', ')}`
              : null;
            
            const updatedInternalNotes = removedProductsNote
              ? (selectedPackage.internal_notes 
                  ? `${selectedPackage.internal_notes}\n${removedProductsNote}`
                  : removedProductsNote)
              : selectedPackage.internal_notes;
            
            // Update products_data and quote BEFORE accepting
            await updatePackage(selectedPackage.id, {
              products_data: quoteData.updatedProducts,
              quote: finalQuote,
              internal_notes: updatedInternalNotes
            });
            
            // WhatsApp notifications removed - only welcome template available
            if (quoteData.removedProducts?.length > 0 && selectedPackage.matched_trip_id) {
              console.log('📧 Products removed notification would go to traveler');
            }
          } else if (quoteData.discountCodeId && quoteData.discountAmount > 0) {
            // Discount-only logic — also recalculate delivery fee to fix any admin quote inconsistency
            console.log('💳 Discount code present, recalculating delivery fee and updating quote with discount data');
            
            const currentQuote = selectedPackage.quote || {};
            const basePrice = parseFloat(currentQuote.price || '0');
            const cityArea = (selectedPackage.confirmed_delivery_address as any)?.cityArea;
            
            let baseQuote = { ...currentQuote };
            
            // Recalculate delivery fee if we have a valid base price
            if (basePrice > 0) {
              const recalculatedQuote = createNormalizedQuote(
                basePrice,
                selectedPackage.delivery_method || 'pickup',
                selectedPackage.profiles?.trust_level || 'basic',
                currentQuote.message || '',
                true,
                cityArea || selectedPackage.package_destination,
                rates,
                {
                  delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
                  delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
                  delivery_fee_outside_city: fees.delivery_fee_outside_city,
                  prime_delivery_discount: fees.prime_delivery_discount,
                },
                selectedPackage.package_destination_country
              );
              
              console.log('🔧 Recalculated delivery fee in discount branch:', {
                oldDeliveryFee: currentQuote.deliveryFee,
                newDeliveryFee: recalculatedQuote.deliveryFee,
                cityArea,
              });
              
              baseQuote = { ...recalculatedQuote };
            }
            
            const quoteWithDiscount = {
              ...baseQuote,
              discountCode: quoteData.discountCode,
              discountCodeId: quoteData.discountCodeId,
              discountAmount: quoteData.discountAmount,
              originalTotalPrice: baseQuote.totalPrice || quoteData.originalTotalPrice,
              finalTotalPrice: (baseQuote.totalPrice || quoteData.originalTotalPrice) - quoteData.discountAmount
            };
            
            await updatePackage(selectedPackage.id, {
              quote: quoteWithDiscount
            });
          } else if (!quoteData.deliveryMethodChange && !quoteData.updatedProducts) {
            // No delivery method change or product exclusions — recalculate delivery fee
            // to fix any inconsistency from admin quote generation
            const currentQuote = selectedPackage.quote || {};
            const basePrice = parseFloat(currentQuote.price || '0');
            const cityArea = (selectedPackage.confirmed_delivery_address as any)?.cityArea;
            
            if (basePrice > 0) {
              const recalculatedQuote = createNormalizedQuote(
                basePrice,
                selectedPackage.delivery_method || 'pickup',
                selectedPackage.profiles?.trust_level || 'basic',
                currentQuote.message || '',
                true,
                cityArea || selectedPackage.package_destination,
                rates,
                {
                  delivery_fee_guatemala_city: fees.delivery_fee_guatemala_city,
                  delivery_fee_guatemala_department: fees.delivery_fee_guatemala_department,
                  delivery_fee_outside_city: fees.delivery_fee_outside_city,
                  prime_delivery_discount: fees.prime_delivery_discount,
                },
                selectedPackage.package_destination_country
              );
              
              // Preserve any existing discount data
              const finalQuote: any = { ...recalculatedQuote };
              if (currentQuote.discountCode) {
                finalQuote.discountCode = currentQuote.discountCode;
                finalQuote.discountCodeId = currentQuote.discountCodeId;
                finalQuote.discountAmount = currentQuote.discountAmount;
                finalQuote.originalTotalPrice = currentQuote.originalTotalPrice;
                finalQuote.finalTotalPrice = currentQuote.finalTotalPrice;
              }
              
              console.log('🔧 Recalculated quote on acceptance to fix delivery fee:', {
                oldDeliveryFee: currentQuote.deliveryFee,
                newDeliveryFee: recalculatedQuote.deliveryFee,
                cityArea,
                destination: selectedPackage.package_destination
              });
              
              await updatePackage(selectedPackage.id, {
                quote: finalQuote
              });
            }
          }
          
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

          // NOTE: Dialog closing is now handled by QuoteDialog's wizard flow
          // The wizard will transition to payment step and close when complete
          // Only refresh packages here - don't close dialog
          if (refreshPackages) {
            await refreshPackages();
          }

          // Toast is shown by QuoteDialog when transitioning to payment step
          // Don't show duplicate toast here
        } else {
          // Legacy rejection flow — capture traveler info before clearing
          let legacyRejectedTravelerInfo = null;
          if (selectedPackage.matched_trip_id) {
            const matchedTrip = trips.find(trip => trip.id === selectedPackage.matched_trip_id);
            if (matchedTrip && matchedTrip.profiles) {
              const profile = matchedTrip.profiles;
              legacyRejectedTravelerInfo = {
                trip_id: matchedTrip.id,
                traveler_id: matchedTrip.user_id,
                traveler_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Desconocido',
                arrival_date: matchedTrip.arrival_date,
                delivery_date: matchedTrip.delivery_date,
                from_city: matchedTrip.from_city,
                to_city: matchedTrip.to_city,
              };
            } else {
              try {
                const { data: tripData, error } = await supabase
                  .rpc('get_trip_with_traveler_info', { trip_id: selectedPackage.matched_trip_id });
                if (!error && tripData && tripData.length > 0) {
                  const trip = tripData[0];
                  legacyRejectedTravelerInfo = {
                    trip_id: trip.id,
                    traveler_id: trip.user_id,
                    traveler_name: trip.traveler_name || 'Desconocido',
                    arrival_date: trip.arrival_date,
                    delivery_date: trip.delivery_date,
                    from_city: trip.from_city,
                    to_city: trip.to_city,
                  };
                }
              } catch (e) {
                console.warn('Could not fetch rejected traveler info (legacy flow):', e);
              }
            }
          }

          // Build admin_actions_log entry
          const existingLog = Array.isArray(selectedPackage.admin_actions_log) ? selectedPackage.admin_actions_log : [];
          const legacyLogEntry = {
            action_type: 'quote_rejection',
            previous_trip_id: legacyRejectedTravelerInfo?.trip_id || selectedPackage.matched_trip_id || null,
            previous_traveler_id: legacyRejectedTravelerInfo?.traveler_id || null,
            previous_traveler_name: legacyRejectedTravelerInfo?.traveler_name || 'Desconocido',
            rejection_reason: 'legacy_rejection',
            wants_requote: false,
            timestamp: new Date().toISOString(),
          };

          await updatePackage(selectedPackage.id, {
            status: 'quote_rejected',
            quote: null,
            matched_trip_id: null,
            traveler_address: null,
            matched_trip_dates: null,
            quote_rejection: {
              reason: 'legacy_rejection',
              wants_requote: false,
              rejected_at: new Date().toISOString(),
              rejected_traveler: legacyRejectedTravelerInfo,
            },
            admin_actions_log: [...existingLog, legacyLogEntry],
          });
          
          toast({
            title: "Cotización rechazada",
            description: "Has rechazado la cotización del viajero.",
          });
        }
      }
      
      // Close dialog for rejections - acceptance is handled by QuoteDialog wizard
      if (quoteData.message === 'rejected') {
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
        // data is already the full array from PurchaseConfirmationUpload
        updatedData.purchase_confirmation = data;
        // Move to in_transit immediately when purchase confirmation is uploaded
        if (['pending_purchase','paid'].includes(pkg.status)) {
          newStatus = 'in_transit';
        }
        
        // WhatsApp notifications removed - only welcome template available
        console.log('📧 Purchase confirmation uploaded for package');
      } else if (type === 'tracking') {
        updatedData.tracking_info = data;
        // Tracking upload doesn't change status - only confirmation does
        
        // WhatsApp notifications removed - only welcome template available
        console.log('📧 Tracking info uploaded for package');
      } else if (type === 'payment_receipt') {
        updatedData.payment_receipt = data;
        // Don't set status here - let the database trigger handle it based on trust_level
        // For 'confiable' and 'prime' users: trigger sets status = 'pending_purchase'
        // For 'basic' users: trigger sets status = 'payment_pending_approval'
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
      
      // WhatsApp notifications removed - only welcome template available
      console.log('📧 Payment confirmed, traveler would be notified');
      
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

  const handleMatchPackage = async (packageId: string, tripId: string, adminTip?: number, productsWithTips?: any[], allTripIds?: string[]) => {
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

      // Determine list of trip IDs to assign
      const tripIdsToAssign = allTripIds && allTripIds.length > 0 ? allTripIds : [tripId];
      const isMultiAssignment = tripIdsToAssign.length > 1;

      // Build products_data update
      const currentPackage = packages.find(pkg => pkg.id === packageId);
      let updatedProductsData: any[] | undefined;

      if (productsWithTips && productsWithTips.length > 0) {
        if (currentPackage?.products_data) {
          updatedProductsData = currentPackage.products_data.map((product: any, index: number) => {
            const productWithTip = productsWithTips[index];
            return {
              ...product,
              adminAssignedTip: productWithTip?.adminAssignedTip || 0
            };
          });
        }
      } else {
        if (currentPackage) {
          if (Array.isArray(currentPackage.products_data) && currentPackage.products_data.length > 0) {
            if (currentPackage.products_data.length === 1) {
              const onlyProduct = currentPackage.products_data[0];
              updatedProductsData = [{
                ...onlyProduct,
                itemLink: onlyProduct.itemLink || currentPackage.item_link || null,
                adminAssignedTip: adminTip
              }];
            }
          } else {
            updatedProductsData = [{
              itemDescription: currentPackage.item_description || 'Producto',
              estimatedPrice: String(currentPackage.estimated_price ?? '0'),
              itemLink: currentPackage.item_link || null,
              quantity: '1',
              adminAssignedTip: adminTip
            }];
          }
        }
      }

      // Insert assignments into package_assignments table
      const assignmentRows = tripIdsToAssign.map(tid => {
        const matchedTrip = trips.find(trip => trip.id === tid);
        const travelerAddress = buildTravelerAddress(matchedTrip);
        const matchedTripDates = matchedTrip ? {
          first_day_packages: matchedTrip.first_day_packages,
          last_day_packages: matchedTrip.last_day_packages,
          delivery_date: matchedTrip.delivery_date,
          arrival_date: matchedTrip.arrival_date
        } : null;

        return {
          package_id: packageId,
          trip_id: tid,
          status: 'pending',
          admin_assigned_tip: adminTip,
          traveler_address: travelerAddress,
          matched_trip_dates: matchedTripDates,
          products_data: updatedProductsData || null
        };
      });

      const { error: assignError } = await supabase
        .from('package_assignments')
        .insert(assignmentRows);

      if (assignError) {
        console.error('Error inserting package_assignments:', assignError);
        throw assignError;
      }

      // For single assignment, also set matched_trip_id for backward compatibility
      // For multi-assignment, only set status to 'matched' without matched_trip_id yet
      if (isMultiAssignment) {
        // Multi-assignment: package is in "awaiting quotes" state
        const updateData: any = {
          status: 'matched',
          admin_assigned_tip: adminTip,
          traveler_dismissal: null,
          traveler_dismissed_at: null
        };
        if (updatedProductsData) {
          updateData.products_data = updatedProductsData;
        }
        await updatePackage(packageId, updateData);
      } else {
        // Single assignment: backward-compatible, set matched_trip_id directly
        const matchedTrip = trips.find(trip => trip.id === tripId);
        const travelerAddress = buildTravelerAddress(matchedTrip);
        const matchedTripDates = matchedTrip ? {
          first_day_packages: matchedTrip.first_day_packages,
          last_day_packages: matchedTrip.last_day_packages,
          delivery_date: matchedTrip.delivery_date,
          arrival_date: matchedTrip.arrival_date
        } : null;

        const updateData: any = {
          status: 'matched',
          matched_trip_id: tripId,
          quote: null,
          admin_assigned_tip: adminTip,
          traveler_address: travelerAddress,
          matched_trip_dates: matchedTripDates,
          traveler_dismissal: null,
          traveler_dismissed_at: null
        };
        if (updatedProductsData) {
          updateData.products_data = updatedProductsData;
        }
        await updatePackage(packageId, updateData);
      }

      // Log package assignment to trip history for each trip
      const adminName = currentUser?.first_name
        ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
        : 'Admin';
      const shopperProfile = currentPackage?.profiles;
      const shopperName = shopperProfile?.first_name
        ? `${shopperProfile.first_name} ${shopperProfile.last_name || ''}`.trim()
        : 'Shopper';

      for (const tid of tripIdsToAssign) {
        const historyEntry = createHistoryEntry(
          'package_assigned',
          currentUser?.id || null,
          adminName,
          {
            package_id: packageId,
            item_description: currentPackage?.item_description || '',
            shopper_name: shopperName,
            admin_tip: adminTip,
            multi_assignment: isMultiAssignment,
            total_assignments: tripIdsToAssign.length,
          }
        );
        appendTripHistoryEntry(tid, historyEntry);

        // Send WhatsApp notification to each traveler
        const matchedTrip = trips.find(trip => trip.id === tid);
        if (matchedTrip?.user_id) {
          const destination = currentPackage?.package_destination || 'Guatemala';
          sendWhatsAppNotification({
            userId: matchedTrip.user_id,
            templateId: 'package_assigned',
            variables: {
              "2": destination,
              "3": `${adminTip?.toFixed(2) || '0.00'}`
            }
          });
        }
      }
      
      toast({
        title: "¡Match realizado!",
        description: isMultiAssignment
          ? `Paquete asignado a ${tripIdsToAssign.length} viajeros. Tip: Q${adminTip}.`
          : `Paquete emparejado. Tip asignado: Q${adminTip}.`,
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

        // Special handling when moving back to "approved", "pending_approval", or "rejected" (un-matching)
        if (status === 'approved' || status === 'pending_approval' || status === 'rejected') {
          if (currentPackage?.matched_trip_id) {
            console.log('🔄 Admin un-matching package, clearing match data...');
            
            // Log package_unassigned to trip history
            const adminName = currentUser?.first_name
              ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
              : 'Admin';
            const unassignEntry = createHistoryEntry(
              'package_unassigned',
              currentUser?.id || null,
              adminName,
              {
                package_id: id,
                item_description: currentPackage?.item_description || '',
                reason: 'Cambio de estado por admin',
              }
            );
            appendTripHistoryEntry(currentPackage.matched_trip_id, unassignEntry);
          }
          
          // Clear all match-related data to allow fresh matching
          updateData = {
            status,
            matched_trip_id: null,
            admin_assigned_tip: null,
            traveler_address: null,
            matched_trip_dates: null,
            matched_assignment_expires_at: null,
            quote: null,
            quote_expires_at: null,
            quote_rejection: null
          };
          
          // Also clear adminAssignedTip from products_data if present
          if (currentPackage?.products_data && Array.isArray(currentPackage.products_data)) {
            const cleanedProducts = currentPackage.products_data.map((product: any) => {
              const { adminAssignedTip, ...productWithoutTip } = product;
              return productWithoutTip;
            });
            updateData.products_data = cleanedProducts;
          }
        }
        // Special handling for status change from "matched" to "quote_sent"
        else if (currentPackage?.status === 'matched' && status === 'quote_sent') {
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
            const confirmedAddress = currentPackage.confirmed_delivery_address as any;
            const cityArea = confirmedAddress?.cityArea;

            const normalizedQuote = createNormalizedQuote(
              currentPackage.admin_assigned_tip,
              currentPackage.delivery_method || 'pickup',
              shopperProfile.trust_level,
              `Cotización generada automáticamente por admin`,
              true, // adminAssignedTipAccepted
              cityArea || currentPackage.package_destination,
              rates,
              fees,  // pass dynamic delivery fees
              currentPackage.package_destination_country
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
        
        // 📱 Enviar notificación WhatsApp cuando admin cambia a quote_sent
        if (status === 'quote_sent' && currentPackage?.user_id && updateData.quote) {
          const quoteTotal = updateData.quote.totalPrice || 0;
          const productName = currentPackage.products_data?.[0]?.itemDescription || currentPackage.item_description || 'Tu pedido';
          
          sendWhatsAppNotification({
            userId: currentPackage.user_id,
            templateId: 'quote_received_v2',
            variables: {
              "2": `${quoteTotal.toFixed(2)}`,
              "3": productName.substring(0, 50)
            }
          });
        }
        
        toast({
          title: "Estado actualizado",
          description: (status === 'approved' || status === 'pending_approval' || status === 'rejected') && currentPackage?.matched_trip_id
            ? "Paquete desmatcheado y listo para nuevo emparejamiento"
            : currentPackage?.status === 'matched' && status === 'quote_sent' 
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
        
        // Refresh packages in background (non-blocking for speed)
        if (refreshPackages) {
          refreshPackages();
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

        // Clear edit metadata on approval
        if (action === 'approve') {
          updateData.trip_history_log = undefined; // don't clear history, just approve
        }
        
        await updateTrip(id, updateData);

        // Log approval/rejection to trip history
        const adminName = currentUser?.first_name
          ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
          : 'Admin';
        const entry = createHistoryEntry(
          action === 'approve' ? 'trip_approved' : 'trip_rejected',
          currentUser?.id || null,
          adminName,
          action === 'reject' ? { reason } : {}
        );
        appendTripHistoryEntry(id, entry);
        
        // Refresh trips in background (non-blocking for speed)
        if (refreshTrips) {
          refreshTrips();
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
      
      // WhatsApp notifications removed - only welcome template available
      console.log('📧 Package confirmed by traveler, shopper would be notified');
      
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
      
      // WhatsApp notifications removed - only welcome template available
      console.log('📧 Package ready at office, shopper would be notified');

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

      // Actualizar trip payment accumulator después de confirmar en oficina
      const packageForAccumulator = packages?.find(pkg => pkg.id === packageId);
      if (packageForAccumulator?.matched_trip_id) {
        try {
          const { createOrUpdateTripPaymentAccumulator } = await import('@/hooks/useCreateTripPaymentAccumulator');
          const tripId = packageForAccumulator.matched_trip_id;
          const travelerId = packageForAccumulator.trips?.user_id || packageForAccumulator.trips?.profiles?.id;
          
          if (travelerId) {
            console.log('🔄 Updating trip payment accumulator for trip:', tripId);
            await createOrUpdateTripPaymentAccumulator(tripId, travelerId);
          }
        } catch (accError) {
          console.error('⚠️ Error updating trip payment accumulator:', accError);
          // No bloqueamos la operación principal si falla el acumulador
        }
      }

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

      // Find original trip for diff
      const originalTrip = trips.find(t => t.id === editedTripData.id);

      // Prepare DB data with correct field mappings
      const dbTripData = {
        from_country: editedTripData.fromCountry,
        from_city: editedTripData.fromCity,
        to_city: editedTripData.toCity,
        arrival_date: editedTripData.arrivalDate,
        delivery_date: editedTripData.deliveryDate,
        first_day_packages: editedTripData.firstDayPackages,
        last_day_packages: editedTripData.lastDayPackages,
        available_space: parseFloat(editedTripData.availableSpace),
        package_receiving_address: editedTripData.packageReceivingAddress,
        delivery_method: editedTripData.deliveryMethod,
        messenger_pickup_info: editedTripData.deliveryMethod === 'mensajero' ? 
          editedTripData.messengerPickupInfo : null,
        status: 'pending_approval' // Always reset to pending approval after edit
      };

      // Update trip in database
      await updateTrip(editedTripData.id, dbTripData);

      // Log edit to trip history
      if (originalTrip) {
        const diff = buildEditDiff(originalTrip, dbTripData);
        if (diff.changed_fields.length > 0) {
          const userName = currentUser?.first_name
            ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
            : 'Usuario';
          const entry = createHistoryEntry(
            'trip_edited',
            currentUser?.id || null,
            userName,
            {
              changed_fields: diff.changed_fields,
              previous_values: diff.previous_values,
              new_values: diff.new_values,
            }
          );
          appendTripHistoryEntry(editedTripData.id, entry);
        }
      }
      
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
      
      // products_data already contains correct additionalNotes from PackageDetailModal
      // No need to overwrite - each product has its own notes

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

  // Handler for travelers to dismiss expired quotes from their view
  const handleDismissExpiredPackage = async (packageId: string) => {
    try {
      // Use the SECURITY DEFINER function to bypass RLS safely
      const { error } = await supabase.rpc('traveler_dismiss_package', {
        _package_id: packageId
      });

      if (error) throw error;

      toast({
        title: "Paquete descartado",
        description: "El paquete ha sido removido de tu lista de viajes.",
      });

      // Refresh to update the view
      if (refreshPackages) {
        await refreshPackages();
      }
    } catch (error) {
      console.error('Error dismissing expired package:', error);
      toast({
        title: "Error",
        description: "No se pudo descartar el paquete. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptMultiAssignmentQuote = async (packageId: string, assignmentId: string) => {
    try {
      console.log('🎯 Shopper accepting assignment:', { packageId, assignmentId });
      
      const { error } = await supabase.rpc('shopper_accept_assignment', {
        _package_id: packageId,
        _assignment_id: assignmentId
      });

      if (error) throw error;

      toast({
        title: "¡Cotización aceptada!",
        description: "Has seleccionado a tu viajero. Procede con el pago.",
      });

      if (refreshPackages) {
        await refreshPackages();
      }
    } catch (error: any) {
      console.error('❌ Error accepting multi-assignment quote:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la cotización. Inténtalo de nuevo.",
        variant: "destructive",
      });
      throw error;
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
    handleEditPackage,
    handleDismissExpiredPackage,
    handleAcceptMultiAssignmentQuote
  };
};
