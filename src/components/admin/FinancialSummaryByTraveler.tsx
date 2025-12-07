import React, { useState, useMemo } from "react";
import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { calculateFavoronRevenue, calculateServiceFee, getDeliveryFee } from '@/lib/pricing';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FinancialSummaryByTravelerProps {
  packages: Package[];
}

interface TravelerSummaryData {
  travelerId: string;
  travelerName: string;
  packagesDelivered: number;
  totalTips: number;
  favoronRevenue: number;
  messengerPayments: number;
  packages: Package[];
}

const FinancialSummaryByTraveler = ({ packages }: FinancialSummaryByTravelerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Filter packages to include only those in advanced payment states
  const eligiblePackages = useMemo(() => {
    const advancedStates = [
      'payment_confirmed',
      'pending_purchase', 
      'purchase_confirmed',
      'shipped',
      'in_transit',
      'received_by_traveler',
      'delivered_to_office',
      'completed'
    ];
    
    return packages.filter(pkg => 
      advancedStates.includes(pkg.status) && 
      pkg.quote &&
      typeof pkg.quote === 'object' &&
      pkg.matched_trip_id
    );
  }, [packages]);

  // Fetch profiles data for travelers
  const { data: profiles } = useQuery({
    queryKey: ['traveler-profiles-for-financial-summary'],
    queryFn: async () => {
      // Get all trip IDs and their user IDs
      const tripIds = [...new Set(eligiblePackages.map(pkg => pkg.matched_trip_id).filter(Boolean))];
      
      if (tripIds.length === 0) return {};

      const { data: trips } = await supabase
        .from('trips')
        .select('id, user_id')
        .in('id', tripIds);

      const userIds = [...new Set(trips?.map(trip => trip.user_id).filter(Boolean) || [])];
      
      if (userIds.length === 0) return {};

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, trust_level')
        .in('id', userIds);

      const profilesMap: Record<string, { first_name: string; last_name: string; trust_level: string }> = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = {
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          trust_level: profile.trust_level || 'basic'
        };
      });

      // Create trip to user mapping
      const tripToUserMap: Record<string, string> = {};
      trips?.forEach(trip => {
        tripToUserMap[trip.id] = trip.user_id;
      });

      return { profilesMap, tripToUserMap };
    },
    enabled: eligiblePackages.length > 0
  });

  // Process data by traveler
  const travelerSummaries = useMemo(() => {
    if (!profiles) return [];

    const { profilesMap, tripToUserMap } = profiles;
    const travelerData: Record<string, TravelerSummaryData> = {};

    eligiblePackages.forEach(pkg => {
      if (!pkg.matched_trip_id) return;

      const travelerId = tripToUserMap[pkg.matched_trip_id];
      if (!travelerId) return;

      const quote = pkg.quote as any;
      const travelerTip = parseFloat(quote?.price || '0');
      const serviceFee = parseFloat(quote?.serviceFee || '0');
      
      // Get traveler's trust level for correct commission calculation
      const travelerProfile = profilesMap[travelerId];
      const travelerTrustLevel = travelerProfile?.trust_level || 'basic';
      
      // Get cityArea from confirmed_delivery_address for delivery fee calculation
      const confirmedAddress = pkg.confirmed_delivery_address as any;
      const cityArea = confirmedAddress?.cityArea;
      
      const favoronRevenue = calculateFavoronRevenue(travelerTip, serviceFee, travelerTrustLevel);
      const messengerPayment = getDeliveryFee(pkg.delivery_method, travelerTrustLevel, cityArea);

      if (!travelerData[travelerId]) {
        const profile = profilesMap[travelerId];
        const travelerName = profile 
          ? `${profile.first_name} ${profile.last_name}`.trim() || 'Viajero'
          : 'Viajero';

        travelerData[travelerId] = {
          travelerId,
          travelerName,
          packagesDelivered: 0,
          totalTips: 0,
          favoronRevenue: 0,
          messengerPayments: 0,
          packages: []
        };
      }

      travelerData[travelerId].packagesDelivered += 1;
      travelerData[travelerId].totalTips += travelerTip;
      travelerData[travelerId].favoronRevenue += favoronRevenue;
      travelerData[travelerId].messengerPayments += messengerPayment;
      travelerData[travelerId].packages.push(pkg);
    });

    return Object.values(travelerData).sort((a, b) => b.totalTips - a.totalTips);
  }, [eligiblePackages, profiles]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return travelerSummaries.slice(startIndex, startIndex + itemsPerPage);
  }, [travelerSummaries, currentPage]);

  // Calculate totals
  const totals = useMemo(() => {
    return travelerSummaries.reduce((acc, traveler) => ({
      packagesDelivered: acc.packagesDelivered + traveler.packagesDelivered,
      totalTips: acc.totalTips + traveler.totalTips,
      favoronRevenue: acc.favoronRevenue + traveler.favoronRevenue,
      messengerPayments: acc.messengerPayments + traveler.messengerPayments
    }), {
      packagesDelivered: 0,
      totalTips: 0,
      favoronRevenue: 0,
      messengerPayments: 0
    });
  }, [travelerSummaries]);

  const totalPages = Math.ceil(travelerSummaries.length / itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Resumen Financiero por Viajero</span>
          <span className="text-sm font-normal text-muted-foreground">
            {travelerSummaries.length} viajeros activos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Viajero</TableHead>
                <TableHead className="text-center">Paquetes Entregados</TableHead>
                <TableHead className="text-right">Total Tips</TableHead>
                <TableHead className="text-right">Ingreso Favoron</TableHead>
                <TableHead className="text-right">Pagos Mensajero</TableHead>
                <TableHead className="text-right">Promedio por Paquete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((traveler) => (
                <TableRow key={traveler.travelerId}>
                  <TableCell className="font-medium">{traveler.travelerName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {traveler.packagesDelivered}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(traveler.totalTips)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(traveler.favoronRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(traveler.messengerPayments)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(traveler.totalTips / traveler.packagesDelivered)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals row */}
              {travelerSummaries.length > 0 && (
                <TableRow className="border-t-2 bg-muted/50 font-semibold">
                  <TableCell>
                    <strong>TOTALES:</strong>
                  </TableCell>
                  <TableCell className="text-center">
                    <strong>{totals.packagesDelivered}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.totalTips)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.favoronRevenue)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.messengerPayments)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>
                      {totals.packagesDelivered > 0 
                        ? formatCurrency(totals.totalTips / totals.packagesDelivered)
                        : formatCurrency(0)
                      }
                    </strong>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Simple pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} - Mostrando {paginatedData.length} de {travelerSummaries.length} registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryByTraveler;