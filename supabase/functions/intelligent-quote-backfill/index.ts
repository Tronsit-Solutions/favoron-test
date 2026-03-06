import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Municipalities in Dept. Guatemala that are NOT Guatemala City
const GUATEMALA_DEPT_MUNICIPALITIES = [
  'mixco', 'villa nueva', 'villanueva', 'villa canales', 'villacanales',
  'san miguel petapa', 'petapa', 'amatitlan', 'amatitlán', 'fraijanes',
  'santa catarina pinula', 'chinautla', 'san jose pinula', 'san josé pinula',
  'palencia', 'san pedro ayampuc', 'san juan sacatepequez', 'san juan sacatepéquez',
  'condado naranjo', 'san cristobal', 'san cristóbal',
  'carretera a el salvador', 'carretera el salvador',
];

const GUATEMALA_CITY_NAMES = ['guatemala', 'guatemala city', 'ciudad de guatemala', 'guate'];

type DeliveryZone = 'guatemala_city' | 'guatemala_department' | 'outside';

function getDeliveryZone(cityArea?: string, destinationCountry?: string): DeliveryZone {
  if (!cityArea && !destinationCountry) return 'outside';
  const normalized = (cityArea || '').toLowerCase().trim();
  
  if (normalized && GUATEMALA_DEPT_MUNICIPALITIES.some(m => normalized.includes(m))) return 'guatemala_department';
  if (normalized && GUATEMALA_CITY_NAMES.some(name => normalized === name || normalized.startsWith(name + ','))) return 'guatemala_city';
  // If destination country is Guatemala, classify as guatemala_department (Q45) instead of outside
  if (destinationCountry && destinationCountry.toLowerCase().trim() === 'guatemala') return 'guatemala_department';
  return 'outside';
}

function getDeliveryFee(
  deliveryMethod: string,
  trustLevel: string | undefined,
  cityArea: string | undefined,
  fees: { city: number; dept: number; outside: number; discount: number },
  destinationCountry?: string
): number {
  if (deliveryMethod === 'pickup') return 0;
  const zone = getDeliveryZone(cityArea, destinationCountry);
  
  if (zone === 'guatemala_city') return trustLevel === 'prime' ? 0 : fees.city;
  if (zone === 'guatemala_department') return trustLevel === 'prime' ? Math.max(0, fees.dept - fees.discount) : fees.dept;
  return trustLevel === 'prime' ? Math.max(0, fees.outside - fees.discount) : fees.outside;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🚀 Starting intelligent quote backfill...')

    // Fetch platform fees from DB
    let serviceFeeRatePrime = 0.25;
    let serviceFeeRateStandard = 0.50;
    let deliveryFeeCity = 25;
    let deliveryFeeDept = 45;
    let deliveryFeeOutside = 60;
    let primeDiscount = 25;
    
    const { data: feesData, error: feesError } = await supabaseClient
      .from('favoron_company_information')
      .select('service_fee_rate_prime, service_fee_rate_standard, delivery_fee_guatemala_city, delivery_fee_guatemala_department, delivery_fee_outside_city, prime_delivery_discount')
      .eq('is_active', true)
      .maybeSingle();
    
    if (!feesError && feesData) {
      serviceFeeRatePrime = feesData.service_fee_rate_prime ?? 0.25;
      serviceFeeRateStandard = feesData.service_fee_rate_standard ?? 0.50;
      deliveryFeeCity = feesData.delivery_fee_guatemala_city ?? 25;
      deliveryFeeDept = (feesData as any).delivery_fee_guatemala_department ?? 45;
      deliveryFeeOutside = feesData.delivery_fee_outside_city ?? 60;
      primeDiscount = feesData.prime_delivery_discount ?? 25;
      console.log(`📊 Using DB rates and fees`);
    }

    const deliveryFees = { city: deliveryFeeCity, dept: deliveryFeeDept, outside: deliveryFeeOutside, discount: primeDiscount };

    // Get Prime membership start dates
    const { data: primeData, error: primeError } = await supabaseClient
      .from('prime_memberships')
      .select('user_id, approved_at')
      .eq('status', 'approved')
      .order('approved_at', { ascending: true })

    if (primeError) throw new Error(`Failed to get Prime data: ${primeError.message}`)

    const primeStartDates = new Map()
    primeData.forEach(pm => {
      if (!primeStartDates.has(pm.user_id) || new Date(pm.approved_at) < new Date(primeStartDates.get(pm.user_id))) {
        primeStartDates.set(pm.user_id, pm.approved_at)
      }
    })

    // Get ALL packages with quotes
    const { data: packages, error: packagesError } = await supabaseClient
      .from('packages')
      .select(`id, user_id, created_at, quote, delivery_method, confirmed_delivery_address, package_destination_country, profiles!packages_user_id_fkey(trust_level)`)
      .not('quote', 'is', null)

    if (packagesError) throw new Error(`Failed to get packages: ${packagesError.message}`)

    console.log(`📦 Found ${packages.length} packages to analyze`)

    let updatedCount = 0
    let skippedCount = 0
    const updateResults: any[] = []

    for (const pkg of packages) {
      const quote = pkg.quote as any
      if (!quote || !quote.price) { skippedCount++; continue; }

      const currentTrustLevel = pkg.profiles?.trust_level || 'basic'
      const basePrice = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price)
      const currentServiceFee = typeof quote.serviceFee === 'string' ? parseFloat(quote.serviceFee) : Number(quote.serviceFee || 0)
      const currentDeliveryFee = typeof quote.deliveryFee === 'string' ? parseFloat(quote.deliveryFee) : Number(quote.deliveryFee || 0)
      const currentTotalPrice = typeof quote.totalPrice === 'string' ? parseFloat(quote.totalPrice) : Number(quote.totalPrice || 0)

      const cityArea = (pkg.confirmed_delivery_address as any)?.cityArea
      const destinationCountry = (pkg as any).package_destination_country

      const correctServiceFee = currentTrustLevel === 'prime'
        ? basePrice * serviceFeeRatePrime
        : basePrice * serviceFeeRateStandard;
      
      const correctDeliveryFee = getDeliveryFee(pkg.delivery_method || 'pickup', currentTrustLevel, cityArea, deliveryFees, destinationCountry);
      const correctTotalPrice = basePrice + correctServiceFee + correctDeliveryFee;

      const needsUpdate = Math.abs(currentServiceFee - correctServiceFee) > 0.01 ||
        Math.abs(currentDeliveryFee - correctDeliveryFee) > 0.01 ||
        Math.abs(currentTotalPrice - correctTotalPrice) > 0.01;

      if (needsUpdate) {
        const updatedQuote = { ...quote, serviceFee: correctServiceFee, deliveryFee: correctDeliveryFee, totalPrice: correctTotalPrice };
        const { error: updateError } = await supabaseClient.from('packages').update({ quote: updatedQuote }).eq('id', pkg.id);

        if (updateError) {
          updateResults.push({ packageId: pkg.id, status: 'error', error: updateError.message });
        } else {
          updatedCount++;
          updateResults.push({ packageId: pkg.id, status: 'updated', zone: getDeliveryZone(cityArea, destinationCountry) });
        }
      } else {
        skippedCount++;
      }
    }

    const summary = { totalPackagesAnalyzed: packages.length, packagesUpdated: updatedCount, packagesSkipped: skippedCount, primeUsersFound: primeStartDates.size, updateResults: updateResults.slice(0, 10) };
    console.log('📊 Backfill Summary:', summary);

    return new Response(JSON.stringify({ success: true, message: 'Intelligent quote backfill completed', summary }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('❌ Backfill error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})
