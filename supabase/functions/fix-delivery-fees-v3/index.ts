import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de municipios que NO son Guatemala Ciudad (cobran Q60)
const excludedAreas = [
  'mixco',
  'villa nueva',
  'villanueva',
  'villa canales',
  'villacanales',
  'san miguel petapa',
  'petapa',
  'amatitlan',
  'amatitlán',
  'fraijanes',
  'santa catarina pinula',
  'chinautla',
  'san jose pinula',
  'san josé pinula',
  'palencia',
  'san pedro ayampuc',
  'san juan sacatepequez',
  'san juan sacatepéquez',
  'condado naranjo',
  'san cristobal',
  'san cristóbal',
  'carretera a el salvador',
  'carretera el salvador',
];

// Patrones que SÍ son Guatemala Ciudad (cobran Q25 o Q0 para prime)
const guatemalaCityPatterns = [
  /^guatemala$/i,
  /^guatemala\s*city$/i,
  /^ciudad\s*de\s*guatemala/i,
  /^guatemala\s*,?\s*guatemala$/i,
  /^guatemala\s+zona\s*\d+/i,
  /zona\s*\d+.*ciudad\s*de\s*guatemala/i,
  /^zona\s*\d+.*guatemala$/i,
  /^guate$/i,
];

function isGuatemalaCityArea(cityArea?: string): boolean {
  if (!cityArea) return false;
  const normalized = cityArea.toLowerCase().trim();
  
  if (excludedAreas.some(excluded => normalized.includes(excluded))) {
    return false;
  }
  
  return guatemalaCityPatterns.some(pattern => pattern.test(normalized));
}

// Pricing constants
const STANDARD_DELIVERY_FEE = 25;      // Q25 for Guatemala City
const OUTSIDE_CITY_DELIVERY_FEE = 60;  // Q60 for outside areas
const PRIME_DISCOUNT = 25;             // Prime discount amount

function getCorrectDeliveryFee(deliveryMethod: string, trustLevel: string | null, cityArea: string | null): number {
  if (deliveryMethod !== 'delivery') return 0;
  
  const isGuatemala = isGuatemalaCityArea(cityArea || undefined);
  
  if (trustLevel === 'prime' && isGuatemala) return 0;
  if (trustLevel === 'prime' && !isGuatemala) return OUTSIDE_CITY_DELIVERY_FEE - PRIME_DISCOUNT; // Q35
  
  return isGuatemala ? STANDARD_DELIVERY_FEE : OUTSIDE_CITY_DELIVERY_FEE;
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

    console.log(`[fix-delivery-fees-v3] Starting ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}...`);

    // Get all delivery packages with quotes
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select(`
        id,
        delivery_method,
        quote,
        confirmed_delivery_address,
        matched_trip_id,
        user_id
      `)
      .eq('delivery_method', 'delivery')
      .not('quote', 'is', null);

    if (packagesError) {
      console.error('[fix-delivery-fees-v3] Error fetching packages:', packagesError);
      throw packagesError;
    }

    console.log(`[fix-delivery-fees-v3] Found ${packages?.length || 0} delivery packages`);

    // Get shopper trust levels
    const userIds = [...new Set(packages?.map(p => p.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, trust_level')
      .in('id', userIds);
    
    const trustLevelMap = new Map(profiles?.map(p => [p.id, p.trust_level]) || []);

    // Get trips with completed payments to skip
    const tripIds = [...new Set(packages?.filter(p => p.matched_trip_id).map(p => p.matched_trip_id) || [])];
    
    const { data: completedPayments } = await supabase
      .from('payment_orders')
      .select('trip_id')
      .in('trip_id', tripIds)
      .eq('status', 'completed');
    
    const completedTripIds = new Set(completedPayments?.map(p => p.trip_id) || []);

    const { data: completedAccumulators } = await supabase
      .from('trip_payment_accumulator')
      .select('trip_id')
      .in('trip_id', tripIds)
      .not('payment_completed_at', 'is', null);
    
    completedAccumulators?.forEach(a => completedTripIds.add(a.trip_id));

    const results = {
      analyzed: 0,
      needsCorrection: 0,
      updated: 0,
      skipped: 0,
      skippedPaid: 0,
      errors: 0,
      details: [] as any[],
    };

    for (const pkg of packages || []) {
      results.analyzed++;
      
      const quote = pkg.quote as any;
      if (!quote) {
        results.skipped++;
        continue;
      }

      // Skip if trip has completed payment
      if (pkg.matched_trip_id && completedTripIds.has(pkg.matched_trip_id)) {
        results.skippedPaid++;
        continue;
      }

      const cityArea = (pkg.confirmed_delivery_address as any)?.cityArea || null;
      const trustLevel = trustLevelMap.get(pkg.user_id) || null;
      const currentDeliveryFee = quote.deliveryFee || 0;
      const correctDeliveryFee = getCorrectDeliveryFee('delivery', trustLevel, cityArea);

      if (currentDeliveryFee !== correctDeliveryFee) {
        results.needsCorrection++;
        
        const feeDiff = correctDeliveryFee - currentDeliveryFee;
        const newTotalPrice = (quote.totalPrice || 0) + feeDiff;
        const newCompletePrice = (quote.completePrice || quote.totalPrice || 0) + feeDiff;

        const detail = {
          packageId: pkg.id,
          cityArea,
          trustLevel,
          currentFee: currentDeliveryFee,
          correctFee: correctDeliveryFee,
          feeDiff,
          isGuatemalaCity: isGuatemalaCityArea(cityArea),
        };
        results.details.push(detail);

        console.log(`[fix-delivery-fees-v3] Package ${pkg.id}: ${cityArea} | current: Q${currentDeliveryFee} → correct: Q${correctDeliveryFee} | isGuatemalaCity: ${detail.isGuatemalaCity}`);

        if (!dryRun) {
          const updatedQuote = {
            ...quote,
            deliveryFee: correctDeliveryFee,
            totalPrice: newTotalPrice,
            completePrice: newCompletePrice,
          };

          const { error: updateError } = await supabase
            .from('packages')
            .update({ quote: updatedQuote })
            .eq('id', pkg.id);

          if (updateError) {
            console.error(`[fix-delivery-fees-v3] Error updating package ${pkg.id}:`, updateError);
            results.errors++;
          } else {
            results.updated++;
          }
        }
      }
    }

    console.log(`[fix-delivery-fees-v3] Results:`, {
      analyzed: results.analyzed,
      needsCorrection: results.needsCorrection,
      updated: results.updated,
      skipped: results.skipped,
      skippedPaid: results.skippedPaid,
      errors: results.errors,
    });

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      results: {
        analyzed: results.analyzed,
        needsCorrection: results.needsCorrection,
        updated: results.updated,
        skipped: results.skipped,
        skippedPaid: results.skippedPaid,
        errors: results.errors,
      },
      details: results.details.slice(0, 50), // Limit details in response
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[fix-delivery-fees-v3] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
