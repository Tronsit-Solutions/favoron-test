import { supabase } from '@/integrations/supabase/client';
import { createNormalizedQuote } from '@/lib/quoteHelpers';

export interface QuoteGenerationData {
  packageId: string;
  currentPackage: any;
  trips: any[];
  adminAssignedTip: number;
  /** Dynamic rates from PlatformFeesContext - if not provided, will use fallback */
  rates?: { standard: number; prime: number };
  /** Dynamic delivery fees from PlatformFeesContext */
  fees?: {
    delivery_fee_guatemala_city: number;
    delivery_fee_guatemala_department: number;
    delivery_fee_outside_city: number;
    prime_delivery_discount: number;
  };
  /** Destination country for accurate delivery zone classification */
  destinationCountry?: string;
  /** Override trip ID for multi-assignment packages where matched_trip_id is null */
  overrideTripId?: string;
}

/**
 * Generates a quote when admin changes status from "matched" to "quote_sent"
 */
export async function generateQuoteForAdminStatusChange(data: QuoteGenerationData) {
  const { currentPackage, trips, adminAssignedTip, rates, fees, destinationCountry } = data;
  
  // Check if we have admin_assigned_tip
  if (!adminAssignedTip || adminAssignedTip <= 0) {
    throw new Error('No se puede enviar cotización sin un tip asignado por admin.');
  }

  // Fetch shopper's profile to get trust level
  const { data: shopperProfile, error: profileError } = await supabase
    .from('profiles')
    .select('trust_level')
    .eq('id', currentPackage.user_id)
    .single();

  if (profileError) {
    console.error('Error fetching shopper profile:', profileError);
    throw new Error('No se pudo obtener el perfil del comprador.');
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

  // Use cityArea from confirmed_delivery_address for accurate delivery fee calculation
  const confirmedAddress = currentPackage.confirmed_delivery_address as any;
  const cityArea = confirmedAddress?.cityArea;

  // Generate quote using admin_assigned_tip as base price, with dynamic rates
  const normalizedQuote = createNormalizedQuote(
    adminAssignedTip,
    currentPackage.delivery_method || 'pickup',
    shopperProfile.trust_level,
    undefined, // No automatic message
    true, // adminAssignedTipAccepted
    cityArea || currentPackage.package_destination, // Prioritize cityArea over package_destination
    rates, // Pass dynamic rates from DB
    fees, // Pass dynamic delivery fees from DB
    destinationCountry || currentPackage.package_destination_country // Pass destination country
  );

  console.log('📊 Quote generation details:', {
    shopperTrustLevel: shopperProfile.trust_level,
    adminAssignedTip,
    serviceFee: normalizedQuote.serviceFee,
    expectedServiceFeeRate: shopperProfile.trust_level === 'prime' ? `${(rates?.prime ?? 0.25) * 100}%` : `${(rates?.standard ?? 0.50) * 100}%`,
    deliveryMethod: currentPackage.delivery_method,
    cityArea: cityArea,
    destination: currentPackage.package_destination,
    totalPrice: normalizedQuote.totalPrice,
    usingDynamicRates: !!rates
  });

  return {
    quote: normalizedQuote,
    traveler_address: travelerAddress,
    matched_trip_dates: matchedTripDates,
    quote_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours from now
  };
}