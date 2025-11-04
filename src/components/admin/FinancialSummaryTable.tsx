import React, { useState, useMemo } from "react";
import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package as PackageIcon, Calendar, Download } from "lucide-react";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/formatters";
import { calculateFavoronRevenue, calculateServiceFee, getDeliveryFee } from '@/lib/pricing';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductDetailModal from "./ProductDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { ReceiptViewerModal } from "@/components/ui/receipt-viewer-modal";

interface FinancialSummaryTableProps {
  packages: Package[];
}

interface EnrichedPackageData {
  package: Package;
  shopperName: string;
  travelerName: string;
  tripId: string | null;
  productDescription: string;
  productLink?: string | null;
  paymentDate: string;
  totalToPay: number;
  travelerTip: number;
  favoronRevenue: number;
  messengerPayment: number;
  isPrimeMembership?: boolean;
  primeAmount?: number;
  isFromPrimeShopper?: boolean;
}

const FinancialSummaryTable = ({ packages }: FinancialSummaryTableProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductData, setSelectedProductData] = useState<{
    products: any[];
    description: string;
  } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<string | null>(null);
  const [selectedReceiptFilename, setSelectedReceiptFilename] = useState<string | null>(null);
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

  // Fetch approved prime memberships
  const { data: primeMemberships } = useQuery({
    queryKey: ['prime-memberships-for-financial-table'],
    queryFn: async () => {
      const { data } = await supabase
        .from('prime_memberships')
        .select('id, user_id, amount, approved_at, created_at')
        .eq('status', 'approved')
        .order('approved_at', { ascending: true });
      
      return data || [];
    }
  });

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

      // Add prime membership user_ids
      primeMemberships?.forEach(membership => {
        if (membership.user_id) userIds.add(membership.user_id);
      });

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
    enabled: eligiblePackages.length > 0 || (primeMemberships && primeMemberships.length > 0)
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

    const packageData = eligiblePackages.map((pkg): EnrichedPackageData => {
      const quote = pkg.quote as any;
      
      // Get shopper name and trust level
      const shopperProfile = profiles[pkg.user_id];
      const shopperName = shopperProfile 
        ? `${shopperProfile.first_name} ${shopperProfile.last_name}`.trim() || 'Usuario'
        : 'Usuario';
      const shopperTrustLevel = shopperProfile?.trust_level || 'basic';

      // Get traveler name and trust level
      const travelerId = pkg.matched_trip_id ? trips[pkg.matched_trip_id] : null;
      const travelerProfile = travelerId ? profiles[travelerId] : null;
      const travelerName = travelerProfile 
        ? `${travelerProfile.first_name} ${travelerProfile.last_name}`.trim() || 'Viajero'
        : 'Sin asignar';
      const travelerTrustLevel = travelerProfile?.trust_level || 'basic';

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

      // Calculate financial metrics with correct trust levels
      const travelerTip = parseFloat(quote?.price || '0');
      
      // Use shopper's trust level for service fee and delivery fee (what shopper pays)
      const serviceFee = calculateServiceFee(travelerTip, shopperTrustLevel);
      const deliveryFee = getDeliveryFee(pkg.delivery_method, shopperTrustLevel, pkg.package_destination);
      
      // Total to pay = service fee + traveler tip + delivery fee
      const totalToPay = serviceFee + travelerTip + deliveryFee;
      
      // Favoron revenue is the service fee
      const favoronRevenue = serviceFee;
      
      // Messenger payment calculation based on destination
      const isGuatemalaCity = pkg.package_destination?.toLowerCase().includes('guatemala city') || 
                              pkg.package_destination?.toLowerCase().includes('ciudad de guatemala');
      let messengerPayment = 0;
      if (pkg.delivery_method !== 'pickup') {
        if (shopperTrustLevel === 'prime') {
          messengerPayment = isGuatemalaCity ? 0 : 35; // Q35 for Prime outside Guatemala City
        } else {
          messengerPayment = isGuatemalaCity ? 25 : 60; // Q25 for Guatemala City, Q60 outside
        }
      }

      return {
        package: pkg,
        shopperName,
        travelerName,
        tripId: pkg.matched_trip_id || null,
        productDescription,
        productLink,
        paymentDate,
        totalToPay,
        travelerTip,
        favoronRevenue,
        messengerPayment,
        isPrimeMembership: false,
        isFromPrimeShopper: shopperTrustLevel === 'prime'
      };
    });

    // Add prime memberships as separate entries
    const primeData: EnrichedPackageData[] = (primeMemberships || []).map(membership => {
      const memberProfile = profiles?.[membership.user_id];
      const memberName = memberProfile 
        ? `${memberProfile.first_name} ${memberProfile.last_name}`.trim() || 'Usuario'
        : 'Usuario';
      
      const paymentDate = membership.approved_at 
        ? new Date(membership.approved_at).toLocaleDateString('es-GT')
        : new Date(membership.created_at).toLocaleDateString('es-GT');

      return {
        package: { id: membership.id } as Package,
        shopperName: memberName,
        travelerName: '-',
        tripId: null,
        productDescription: 'Membresía Prime',
        productLink: null,
        paymentDate,
        totalToPay: membership.amount,
        travelerTip: 0,
        favoronRevenue: membership.amount,
        messengerPayment: 0,
        isPrimeMembership: true,
        primeAmount: membership.amount
      };
    });

    // Combine and sort by date
    return [...packageData, ...primeData].sort((a, b) => {
      const dateA = new Date(a.paymentDate.split('/').reverse().join('-'));
      const dateB = new Date(b.paymentDate.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [eligiblePackages, profiles, trips, primeMemberships]);

  // Generate available months from the data
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    
    enrichedData.forEach(item => {
      // Parse date from format "dd/mm/yyyy" to get month/year
      const dateParts = item.paymentDate.split('/');
      if (dateParts.length === 3) {
        const month = dateParts[1];
        const year = dateParts[2];
        monthsSet.add(`${year}-${month}`);
      }
    });
    
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [enrichedData]);

  // Filter data by selected month
  const filteredData = useMemo(() => {
    if (selectedMonth === "all") return enrichedData;
    
    return enrichedData.filter(item => {
      const dateParts = item.paymentDate.split('/');
      if (dateParts.length === 3) {
        const month = dateParts[1];
        const year = dateParts[2];
        return `${year}-${month}` === selectedMonth;
      }
      return false;
    });
  }, [enrichedData, selectedMonth]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      totalToPay: acc.totalToPay + item.totalToPay,
      travelerTip: acc.travelerTip + item.travelerTip,
      favoronRevenue: acc.favoronRevenue + item.favoronRevenue,
      messengerPayment: acc.messengerPayment + item.messengerPayment,
      primePayments: acc.primePayments + (item.isPrimeMembership ? item.primeAmount || 0 : 0)
    }), {
      totalToPay: 0,
      travelerTip: 0,
      favoronRevenue: 0,
      messengerPayment: 0,
      primePayments: 0
    });
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset to page 1 when month filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth]);

  const handleDownloadExcel = () => {
    // Prepare data for Excel
    const excelData = filteredData.map(item => ({
      'Fecha Pago': item.paymentDate,
      'Shopper': item.shopperName,
      'Viajero': item.travelerName,
      'ID Viaje': item.tripId || '-',
      'Producto': item.productDescription,
      'Tipo': item.isPrimeMembership ? 'Membresía Prime' : 'Paquete',
      'Estado': item.isPrimeMembership ? 'Aprobado' : getStatusLabel(item.package.status),
      'Total a Pagar (Q)': item.totalToPay.toFixed(2),
      'Tip Viajero (Q)': item.travelerTip.toFixed(2),
      'Ingreso Favorón (Q)': item.favoronRevenue.toFixed(2),
      'Pago Mensajero (Q)': item.messengerPayment.toFixed(2),
    }));

    // Add totals row
    excelData.push({
      'Fecha Pago': '',
      'Shopper': '',
      'Viajero': '',
      'ID Viaje': '',
      'Producto': '',
      'Tipo': '',
      'Estado': 'TOTAL',
      'Total a Pagar (Q)': totals.totalToPay.toFixed(2),
      'Tip Viajero (Q)': totals.travelerTip.toFixed(2),
      'Ingreso Favorón (Q)': totals.favoronRevenue.toFixed(2),
      'Pago Mensajero (Q)': totals.messengerPayment.toFixed(2),
    });

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    const monthLabel = selectedMonth === 'all' ? 'Todos' : (() => {
      const [year, monthNum] = selectedMonth.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${monthNames[parseInt(monthNum) - 1]}_${year}`;
    })();
    
    XLSX.utils.book_append_sheet(wb, ws, 'Resumen Financiero');

    // Download
    XLSX.writeFile(wb, `Resumen_Financiero_${monthLabel}.xlsx`);
    
    toast({
      title: "Descarga exitosa",
      description: "Se descargó el resumen financiero",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
            <div className="flex flex-col gap-2">
              <CardTitle>Tabla Resumen Financiera</CardTitle>
              <span className="text-sm font-normal text-muted-foreground">
                {filteredData.length} transacciones ({filteredData.filter(e => !e.isPrimeMembership).length} paquetes + {filteredData.filter(e => e.isPrimeMembership).length} membresías Prime)
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  const monthName = monthNames[parseInt(monthNum) - 1];
                  return (
                    <SelectItem key={month} value={month}>
                      {monthName} {year}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Totals Summary Card */}
          <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totals.totalToPay)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Tip Viajeros</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.travelerTip)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Ingreso Favoron</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totals.favoronRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Pago Mensajeros</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.messengerPayment)}</p>
              </div>
            </div>
            {selectedMonth !== "all" && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Totales del mes seleccionado
              </p>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Pago</TableHead>
                <TableHead>Shopper</TableHead>
                <TableHead>Viajero</TableHead>
                <TableHead>ID Viaje</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
                <TableHead className="text-right">Tip Viajero</TableHead>
                <TableHead className="text-right">Ingreso Favoron</TableHead>
                <TableHead className="text-right">Pago Mensajero</TableHead>
                <TableHead className="text-center">Comprobante Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.package.id} className={item.isPrimeMembership || item.isFromPrimeShopper ? 'bg-purple-50/50 hover:bg-purple-100/50' : ''}>
                  <TableCell className="text-sm">{item.paymentDate}</TableCell>
                  <TableCell className="font-medium">
                    {item.shopperName}
                    {(item.isPrimeMembership || item.isFromPrimeShopper) && (
                      <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 border-purple-300">💎 Prime</Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.travelerName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {item.tripId ? item.tripId.slice(0, 8) + '...' : '-'}
                  </TableCell>
                  <TableCell className="max-w-sm">
                    {item.isPrimeMembership ? (
                      <div className="text-sm font-medium text-purple-700">
                        💎 Membresía Prime - 1 año
                      </div>
                    ) : item.package.products_data && Array.isArray(item.package.products_data) ? (
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
                    {item.isPrimeMembership ? (
                      <Badge className="bg-purple-600">Aprobado</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {getStatusLabel(item.package.status)}
                      </Badge>
                    )}
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
                  <TableCell className="text-center">
                    {!item.isPrimeMembership && item.package.payment_receipt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const receipt = item.package.payment_receipt as any;
                          const raw = receipt?.fileUrl || receipt?.receipt_url || receipt?.filePath || receipt?.file_path || '';
                          
                          if (!raw) {
                            toast({
                              title: "Sin comprobante",
                              description: "No hay comprobante de pago disponible",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          // Normalize path: add bucket if not a full URL and bucket not already present
                          let normalized = raw;
                          if (!raw.startsWith('http') && !raw.includes('/storage/v1/object')) {
                            if (!raw.startsWith('payment-receipts/')) {
                              normalized = `payment-receipts/${raw}`;
                            }
                          }
                          
                          setSelectedPaymentReceipt(normalized);
                          setSelectedReceiptFilename(receipt?.filename || receipt?.fileName || 'comprobante.jpg');
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals row */}
              {enrichedData.length > 0 && (
              <TableRow className="border-t-2 bg-muted/50 font-semibold">
                <TableCell colSpan={5} className="text-right">
                  <strong>TOTALES {selectedMonth !== "all" ? "(Mes seleccionado)" : "(Todos)"}:</strong>
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
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Simple pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} - Mostrando {paginatedData.length} de {filteredData.length} registros
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

        <ReceiptViewerModal
          isOpen={!!selectedPaymentReceipt}
          onClose={() => {
            setSelectedPaymentReceipt(null);
            setSelectedReceiptFilename(null);
          }}
          receiptUrl={selectedPaymentReceipt || ''}
          title="Comprobante de Pago del Shopper"
          filename={selectedReceiptFilename || 'comprobante-pago-shopper'}
        />
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryTable;