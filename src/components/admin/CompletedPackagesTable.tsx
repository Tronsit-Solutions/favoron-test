import React, { useMemo } from "react";
import { Package } from "@/types";
import { formatDate, formatFullName } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletedPackagesTableProps {
  packages: Package[];
}

const CompletedPackagesTable = ({ packages }: CompletedPackagesTableProps) => {
  // Fetch profiles data for shoppers and travelers
  const { data: profiles } = useQuery({
    queryKey: ['completed-packages-profiles'],
    queryFn: async () => {
      const completedPkgs = packages.filter((pkg) => pkg.status === "completed");
      
      // Get all unique user IDs (shoppers)
      const shopperIds = [...new Set(completedPkgs.map(pkg => pkg.user_id))];
      
      // Get all trip IDs to find travelers
      const tripIds = [...new Set(completedPkgs.map(pkg => pkg.matched_trip_id).filter(Boolean))];
      
      let shopperProfiles = {};
      let travelerProfiles = {};
      let tripToUserMap = {};

      // Fetch shopper profiles
      if (shopperIds.length > 0) {
        const { data: shoppersData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username')
          .in('id', shopperIds);

        shopperProfiles = shoppersData?.reduce((acc, profile) => ({
          ...acc,
          [profile.id]: profile
        }), {}) || {};
      }

      // Fetch trips and traveler profiles
      if (tripIds.length > 0) {
        const { data: trips } = await supabase
          .from('trips')
          .select('id, user_id')
          .in('id', tripIds);

        trips?.forEach(trip => {
          tripToUserMap[trip.id] = trip.user_id;
        });

        const travelerIds = [...new Set(trips?.map(trip => trip.user_id).filter(Boolean) || [])];
        
        if (travelerIds.length > 0) {
          const { data: travelersData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, username')
            .in('id', travelerIds);

          travelerProfiles = travelersData?.reduce((acc, profile) => ({
            ...acc,
            [profile.id]: profile
          }), {}) || {};
        }
      }

      return { shopperProfiles, travelerProfiles, tripToUserMap };
    },
    enabled: packages.some(pkg => pkg.status === "completed")
  });

  const completedPackages = useMemo(() => {
    return packages
      .filter((pkg) => pkg.status === "completed")
      .map((pkg) => {
        // Extract payment date from payment_receipt
        const paymentReceipt = pkg.payment_receipt as Record<string, any> | null;
        const paymentDateStr = paymentReceipt?.paid_at || paymentReceipt?.uploadedAt;
        const paymentDate = paymentDateStr ? new Date(paymentDateStr) : null;

        // Extract office confirmation date
        const officeDelivery = pkg.office_delivery as Record<string, any> | null;
        const officeDateStr = officeDelivery?.admin_confirmation?.confirmed_at;
        const officeDate = officeDateStr ? new Date(officeDateStr) : null;

        const daysElapsed = paymentDate && officeDate
          ? Math.ceil((officeDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const completedDate = new Date(pkg.updated_at);

        // Get profile information
        const shopperProfile = profiles?.shopperProfiles?.[pkg.user_id];
        const travelerId = pkg.matched_trip_id ? profiles?.tripToUserMap?.[pkg.matched_trip_id] : null;
        const travelerProfile = travelerId ? profiles?.travelerProfiles?.[travelerId] : null;

        return {
          ...pkg,
          daysElapsed,
          completedDate,
          shopperProfile,
          travelerProfile,
        };
      })
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  }, [packages, profiles]);

  const stats = useMemo(() => {
    if (completedPackages.length === 0) return { totalCompleted: 0, avgDays: 0, countWithDays: 0 };
    
    const withDays = completedPackages.filter(pkg => pkg.daysElapsed !== null);
    const totalDays = withDays.reduce((sum, pkg) => sum + (pkg.daysElapsed as number), 0);
    const avgDays = withDays.length > 0 ? Math.round(totalDays / withDays.length) : 0;
    
    return {
      totalCompleted: completedPackages.length,
      avgDays,
      countWithDays: withDays.length,
    };
  }, [completedPackages]);

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `Q${numAmount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio de Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDays} días</div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Paquetes Completados</CardTitle>
        </CardHeader>
        <CardContent>
          {completedPackages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay paquetes completados para mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Shopper</TableHead>
                    <TableHead>Viajero</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Fecha Completado</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {formatDate(pkg.created_at)}
                      </TableCell>
                      <TableCell>
                        {pkg.shopperProfile 
                          ? formatFullName(pkg.shopperProfile.first_name, pkg.shopperProfile.last_name) || pkg.shopperProfile.username || "Usuario"
                          : "Usuario"}
                      </TableCell>
                      <TableCell>
                        {pkg.travelerProfile 
                          ? formatFullName(pkg.travelerProfile.first_name, pkg.travelerProfile.last_name) || pkg.travelerProfile.username || "Viajero"
                          : "No asignado"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {pkg.item_description}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{pkg.purchase_origin}</div>
                          <div className="text-muted-foreground">↓</div>
                          <div>{pkg.package_destination}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(pkg.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        {pkg.daysElapsed !== null ? (
                          <span className={pkg.daysElapsed > 7 ? "text-amber-600" : "text-green-600"}>
                            {pkg.daysElapsed}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletedPackagesTable;