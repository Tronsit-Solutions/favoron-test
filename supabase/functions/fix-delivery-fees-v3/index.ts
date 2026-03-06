import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Municipalities in Dept. Guatemala that are NOT Guatemala City
const GUATEMALA_DEPT_MUNICIPALITIES = [
  'mixco', 'villa nueva', 'villanueva', 'villa canales', 'villacanales',
  'san miguel petapa', 'petapa', 'amatitlan', 'amatitlán', 'fraijanes',
  'santa catarina pinula', 'chinautla', 'san jose pinula', 'san josé pinula',
  'palencia', 'san pedro ayampuc', 'san juan sacatepequez', 'san juan sacatepéquez',
  'condado naranjo', 'san cristobal', 'san cristóbal',
  'carretera a el salvador', 'carretera el salvador',
];

const guatemalaCityPatterns = [
  /^guatemala$/i, /^guatemala\s*city$/i, /^ciudad\s*de\s*guatemala/i,
  /^guatemala\s*,?\s*guatemala$/i, /^guatemala\s+zona\s*\d+/i,
  /zona\s*\d+.*ciudad\s*de\s*guatemala/i, /^zona\s*\d+.*guatemala$/i, /^guate$/i,
];

type DeliveryZone = 'guatemala_city' | 'guatemala_department' | 'outside';

function getDeliveryZone(cityArea?: string, destinationCountry?: string): DeliveryZone {
  if (!cityArea && !destinationCountry) return 'outside';
  const normalized = (cityArea || '').toLowerCase().trim();
  if (normalized && GUATEMALA_DEPT_MUNICIPALITIES.some(m => normalized.includes(m))) return 'guatemala_department';
  if (normalized && guatemalaCityPatterns.some(p => p.test(normalized))) return 'guatemala_city';
  // If destination country is Guatemala, classify as guatemala_department (Q45) instead of outside
  if (destinationCountry && destinationCountry.toLowerCase().trim() === 'guatemala') return 'guatemala_department';
  return 'outside';
}

function getCorrectDeliveryFee(
  deliveryMethod: string, trustLevel: string | null, cityArea: string | null,
  fees: { city: number; dept: number; outside: number; discount: number },
  destinationCountry?: string | null
): number {
  if (deliveryMethod !== 'delivery') return 0;
  const zone = getDeliveryZone(cityArea || undefined, destinationCountry || undefined);
  
  if (zone === 'guatemala_city') return trustLevel === 'prime' ? 0 : fees.city;
  if (zone === 'guatemala_department') return trustLevel === 'prime' ? Math.max(0, fees.dept - fees.discount) : fees.dept;
  return trustLevel === 'prime' ? Math.max(0, fees.outside - fees.discount) : fees.outside;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { dryRun = true } = await req.json().catch(() => ({ dryRun: true }));

    // Fetch delivery fees from DB
    let deliveryFees = { city: 25, dept: 45, outside: 60, discount: 25 };
    const { data: feesData } = await supabase
      .from('favoron_company_information')
      .select('delivery_fee_guatemala_city, delivery_fee_guatemala_department, delivery_fee_outside_city, prime_delivery_discount')
      .eq('is_active', true)
      .maybeSingle();
    
    if (feesData) {
      deliveryFees = {
        city: feesData.delivery_fee_guatemala_city ?? 25,
        dept: (feesData as any).delivery_fee_guatemala_department ?? 45,
        outside: feesData.delivery_fee_outside_city ?? 60,
        discount: feesData.prime_delivery_discount ?? 25,
      };
    }

    console.log(`[fix-delivery-fees-v3] Starting ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'} with fees:`, deliveryFees);

    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('id, delivery_method, quote, confirmed_delivery_address, matched_trip_id, user_id, package_destination_country')
      .eq('delivery_method', 'delivery')
      .not('quote', 'is', null);

    if (packagesError) throw packagesError;

    const userIds = [...new Set(packages?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase.from('profiles').select('id, trust_level').in('id', userIds);
    const trustLevelMap = new Map(profiles?.map(p => [p.id, p.trust_level]) || []);

    const tripIds = [...new Set(packages?.filter(p => p.matched_trip_id).map(p => p.matched_trip_id) || [])];
    const { data: completedPayments } = await supabase.from('payment_orders').select('trip_id').in('trip_id', tripIds).eq('status', 'completed');
    const completedTripIds = new Set(completedPayments?.map(p => p.trip_id) || []);
    const { data: completedAccumulators } = await supabase.from('trip_payment_accumulator').select('trip_id').in('trip_id', tripIds).not('payment_completed_at', 'is', null);
    completedAccumulators?.forEach(a => completedTripIds.add(a.trip_id));

    const results = { analyzed: 0, needsCorrection: 0, updated: 0, skipped: 0, skippedPaid: 0, errors: 0, details: [] as any[] };

    for (const pkg of packages || []) {
      results.analyzed++;
      const quote = pkg.quote as any;
      if (!quote) { results.skipped++; continue; }
      if (pkg.matched_trip_id && completedTripIds.has(pkg.matched_trip_id)) { results.skippedPaid++; continue; }

      const cityArea = (pkg.confirmed_delivery_address as any)?.cityArea || null;
      const destinationCountry = (pkg as any).package_destination_country || null;
      const trustLevel = trustLevelMap.get(pkg.user_id) || null;
      const currentDeliveryFee = quote.deliveryFee || 0;
      const correctDeliveryFee = getCorrectDeliveryFee('delivery', trustLevel, cityArea, deliveryFees, destinationCountry);

      if (currentDeliveryFee !== correctDeliveryFee) {
        results.needsCorrection++;
        const feeDiff = correctDeliveryFee - currentDeliveryFee;
        results.details.push({ packageId: pkg.id, cityArea, destinationCountry, trustLevel, currentFee: currentDeliveryFee, correctFee: correctDeliveryFee, zone: getDeliveryZone(cityArea, destinationCountry) });

        if (!dryRun) {
          const { error: updateError } = await supabase.from('packages').update({ quote: { ...quote, deliveryFee: correctDeliveryFee, totalPrice: (quote.totalPrice || 0) + feeDiff } }).eq('id', pkg.id);
          if (updateError) { results.errors++; } else { results.updated++; }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, dryRun, results: { analyzed: results.analyzed, needsCorrection: results.needsCorrection, updated: results.updated, skipped: results.skipped, skippedPaid: results.skippedPaid, errors: results.errors }, details: results.details.slice(0, 50) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[fix-delivery-fees-v3] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
