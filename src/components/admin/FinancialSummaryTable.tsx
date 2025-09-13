import React, { useState, useMemo } from "react";
import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package as PackageIcon } from "lucide-react";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/formatters";
import { calculateFavoronRevenue, calculateServiceFee, getDeliveryFee } from '@/lib/pricing';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductDetailModal from "./ProductDetailModal";

interface FinancialSummaryTableProps {
  packages: Package[];
}

interface EnrichedPackageData {
  package: Package;
  shopperName: string;
  travelerName: string;
  productDescription: string;
  productLink?: string | null;
  paymentDate: string;
  totalToPay: number;
  travelerTip: number;
  favoronRevenue: number;
  messengerPayment: number;
}

const FinancialSummaryTable = ({ packages }: FinancialSummaryTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductData, setSelectedProductData] = useState<{
    products: any[];
    description: string;
  } | null>(null);
  const itemsPerPage = 50;

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
      typeof pkg.quote === 'object'
    );
  }, [packages]);

  // Fetch profiles data for shoppers and travelers
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-financial-table'],
    queryFn: async () => {
      const userIds = new Set<string>();
      
      // Get all shopper user_ids
      eligiblePackages.forEach(pkg => {
        if (pkg.user_id) userIds.add(pkg.user_id);
      });

      // Get all traveler user_ids through trips
      const tripIds = eligiblePackages
        .map(pkg => pkg.matched_trip_id)
        .filter(Boolean);
      
      if (tripIds.length > 0) {
        const { data: trips } = await supabase
          .from('trips')
          .select('id, user_id')
          .in('id', tripIds);
        
        trips?.forEach(trip => {
          if (trip.user_id) userIds.add(trip.user_id);
        });
      }

      // Fetch all profiles
      if (userIds.size === 0) return {};
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, trust_level')
        .in('id', Array.from(userIds));

      const profilesMap: Record<string, { first_name: string; last_name: string; trust_level: string }> = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = {
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          trust_level: profile.trust_level || 'basic'
        };
      });

      return profilesMap;
    },
    enabled: eligiblePackages.length > 0
  });

  // Fetch trips data to get traveler IDs
  const { data: trips } = useQuery({
    queryKey: ['trips-for-financial-table', eligiblePackages.map(p => p.matched_trip_id)],
    queryFn: async () => {
      const tripIds = eligiblePackages
        .map(pkg => pkg.matched_trip_id)
        .filter(Boolean);
      
      if (tripIds.length === 0) return {};

      const { data: tripsData } = await supabase
        .from('trips')
        .select('id, user_id')
        .in('id', tripIds);

      const tripsMap: Record<string, string> = {};
      tripsData?.forEach(trip => {
        tripsMap[trip.id] = trip.user_id;
      });

      return tripsMap;
    },
    enabled: eligiblePackages.length > 0
  });

  // Process packages with enriched data
  const enrichedData = useMemo(() => {
    if (!profiles || !trips) return [];

    return eligiblePackages.map((pkg): EnrichedPackageData => {
      const quote = pkg.quote as any;
      
      // Get shopper name
      const shopperProfile = profiles[pkg.user_id];
      const shopperName = shopperProfile 
        ? `${shopperProfile.first_name} ${shopperProfile.last_name}`.trim() || 'Usuario'
        : 'Usuario';

      // Get traveler name
      const travelerId = pkg.matched_trip_id ? trips[pkg.matched_trip_id] : null;
      const travelerProfile = travelerId ? profiles[travelerId] : null;
      const travelerName = travelerProfile 
        ? `${travelerProfile.first_name} ${travelerProfile.last_name}`.trim() || 'Viajero'
        : 'Sin asignar';

      // Get product description
      let productDescription = pkg.item_description || 'Sin descripción';
      let productLink = null;
      if (pkg.products_data && Array.isArray(pkg.products_data)) {
        if (pkg.products_data.length === 1) {
          const product = pkg.products_data[0] as any;
          const qty = parseInt(product.quantity || '1');
          const unitPrice = parseFloat(product.estimatedPrice || '0');
          const totalPrice = qty * unitPrice;
          productDescription = `${product.itemDescription || pkg.item_description} | Qty: ${qty} | Total: $${totalPrice.toFixed(2)}`;
          productLink = product.itemLink || null;
        } else {
          const totalItems = pkg.products_data.reduce((sum: number, p) => {
            const product = p as any;
            return sum + parseInt(product.quantity || '1');
          }, 0);
          const totalValue = pkg.products_data.reduce((sum: number, p) => {
            const product = p as any;
            return sum + (parseFloat(product.estimatedPrice || '0') * parseInt(product.quantity || '1'));
          }, 0);
          productDescription = `${pkg.products_data.length} productos | Total items: ${totalItems} | Total: $${Number(totalValue).toFixed(2)}`;
        }
      }

      // Extract payment date
      let paymentDate = 'Pendiente';
      if (pkg.payment_receipt && typeof pkg.payment_receipt === 'object') {
        const receipt = pkg.payment_receipt as any;
        if (receipt.uploadedAt) {
          paymentDate = new Date(receipt.uploadedAt).toLocaleDateString('es-GT');
        }
      } else if (['payment_confirmed', 'pending_purchase', 'purchase_confirmed', 'shipped', 'in_transit', 'received_by_traveler', 'delivered_to_office', 'completed'].includes(pkg.status)) {
        paymentDate = new Date(pkg.updated_at).toLocaleDateString('es-GT');
      }

      // Calculate financial metrics with correct trust level
      const totalToPay = parseFloat(quote?.totalPrice || '0');
      const travelerTip = parseFloat(quote?.price || '0');
      const serviceFee = calculateServiceFee(travelerTip);
      
      // Get traveler's trust level for correct commission calculation
      const travelerTrustLevel = travelerProfile?.trust_level || 'basic';
      
      const favoronRevenue = calculateFavoronRevenue(travelerTip, serviceFee, travelerTrustLevel);
      const deliveryFee = getDeliveryFee(pkg.delivery_method, travelerTrustLevel);
      const messengerPayment = pkg.delivery_method === 'messenger' ? deliveryFee : 0;

      return {
        package: pkg,
        shopperName,
        travelerName,
        productDescription,
        productLink,
        paymentDate,
        totalToPay,
        travelerTip,
        favoronRevenue,
        messengerPayment
      };
    });
  }, [eligiblePackages, profiles, trips]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return enrichedData.slice(startIndex, startIndex + itemsPerPage);
  }, [enrichedData, currentPage]);

  // Calculate totals
  const totals = useMemo(() => {
    return enrichedData.reduce((acc, item) => ({
      totalToPay: acc.totalToPay + item.totalToPay,
      travelerTip: acc.travelerTip + item.travelerTip,
      favoronRevenue: acc.favoronRevenue + item.favoronRevenue,
      messengerPayment: acc.messengerPayment + item.messengerPayment
    }), {
      totalToPay: 0,
      travelerTip: 0,
      favoronRevenue: 0,
      messengerPayment: 0
    });
  }, [enrichedData]);

  const totalPages = Math.ceil(enrichedData.length / itemsPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Tabla Resumen Financiera</span>
          <span className="text-sm font-normal text-muted-foreground">
            {enrichedData.length} paquetes en estados avanzados
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Pago</TableHead>
                <TableHead>Shopper</TableHead>
                <TableHead>Viajero</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
                <TableHead className="text-right">Tip Viajero</TableHead>
                <TableHead className="text-right">Ingreso Favoron</TableHead>
                <TableHead className="text-right">Pago Mensajero</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.package.id}>
                  <TableCell className="text-sm">{item.paymentDate}</TableCell>
                  <TableCell className="font-medium">{item.shopperName}</TableCell>
                  <TableCell>{item.travelerName}</TableCell>
                  <TableCell className="max-w-sm">
                    {item.package.products_data && Array.isArray(item.package.products_data) ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-muted-foreground">
                          {item.package.products_data.length === 1 ? '1 producto' : `${item.package.products_data.length} productos`}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProductData({
                            products: item.package.products_data as any[],
                            description: item.package.item_description || 'Sin descripción'
                          })}
                          className="w-fit"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver detalles
                        </Button>
                        {item.productLink && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(item.productLink!, '_blank')}
                            className="w-fit"
                          >
                            <PackageIcon className="h-3 w-3 mr-1" />
                            Ver producto
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                        {item.productDescription}
                        {item.productLink && (
                          <div className="mt-1">
                            <a 
                              href={item.productLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Ver producto
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getStatusLabel(item.package.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.totalToPay)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.travelerTip)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.favoronRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.messengerPayment)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals row */}
              {enrichedData.length > 0 && (
                <TableRow className="border-t-2 bg-muted/50 font-semibold">
                  <TableCell colSpan={4} className="text-right">
                    <strong>TOTALES:</strong>
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.totalToPay)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.travelerTip)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.favoronRevenue)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.messengerPayment)}</strong>
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
              Página {currentPage} de {totalPages} - Mostrando {paginatedData.length} de {enrichedData.length} registros
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
        
        <ProductDetailModal
          isOpen={!!selectedProductData}
          onClose={() => setSelectedProductData(null)}
          products={selectedProductData?.products || []}
          packageDescription={selectedProductData?.description || ''}
        />
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryTable;