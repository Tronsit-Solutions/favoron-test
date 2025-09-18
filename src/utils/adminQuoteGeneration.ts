import { supabase } from '@/integrations/supabase/client';
import { createNormalizedQuote } from '@/lib/quoteHelpers';

export interface QuoteGenerationData {
  packageId: string;
  currentPackage: any;
  trips: any[];
  adminAssignedTip: number;
}

/**
 * Generates a quote when admin changes status from "matched" to "quote_sent"
 */
export async function generateQuoteForAdminStatusChange(data: QuoteGenerationData) {
  const { currentPackage, trips, adminAssignedTip } = data;
  
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

  // Generate quote using admin_assigned_tip as base price
  const normalizedQuote = createNormalizedQuote(
    adminAssignedTip,
    currentPackage.delivery_method || 'pickup',
    shopperProfile.trust_level,
    undefined, // No automatic message
    true // adminAssignedTipAccepted
  );

  console.log('📊 Generated quote:', normalizedQuote);

  return {
    quote: normalizedQuote,
    traveler_address: travelerAddress,
    matched_trip_dates: matchedTripDates,
    quote_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
}