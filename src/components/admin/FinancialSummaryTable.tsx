import React, { useState, useMemo } from "react";
import { Package } from "@/types";
import { startOfMonth, endOfMonth, addMonths, parse } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Package as PackageIcon, Calendar, Download, CreditCard, Landmark, RotateCcw } from "lucide-react";
import ColumnFilter from "./ColumnFilter";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/formatters";
import { format } from "date-fns";
import { calculateFavoronRevenue, calculateServiceFee, getDeliveryFee } from '@/lib/pricing';
import { getQuoteValues } from '@/lib/quoteHelpers';
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
  discountAmount: number;
  travelerTip: number;
  favoronRevenue: number;
  messengerPayment: number;
  paymentMethod: string;
  isPrimeMembership?: boolean;
  primeAmount?: number;
  isFromPrimeShopper?: boolean;
  isRefund?: boolean;
  refundAmount?: number;
  refundReceiptUrl?: string;
  refundReceiptFilename?: string;
}

const FinancialSummaryTable = ({ packages }: FinancialSummaryTableProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProductData, setSelectedProductData] = useState<{
    products: any[];
    description: string;
  } | null>(null);
  // Default to current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedPaymentReceipt, setSelectedPaymentReceipt] = useState<string | null>(null);
  const [selectedReceiptFilename, setSelectedReceiptFilename] = useState<string | null>(null);
  const [shopperFilter, setShopperFilter] = useState<string[]>([]);
  const [travelerFilter, setTravelerFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([]);
  const itemsPerPage = 50;

  // Independent query: fetch ALL paid packages for the selected month/year directly from Supabase
  const selectedDateRange = useMemo(() => {
    if (selectedMonth === 'all') return null;
    if (selectedMonth.startsWith('year-')) {
      const year = parseInt(selectedMonth.split('-')[1]);
      return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
    }
    // selectedMonth is "YYYY-MM" format
    const d = parse(selectedMonth, 'yyyy-MM', new Date());
    return { start: startOfMonth(d), end: startOfMonth(addMonths(d, 1)) };
  }, [selectedMonth]);

  const advancedStates = [
    'pending_purchase', 
    'purchase_confirmed',
    'shipped',
    'in_transit',
    'received_by_traveler',
    'pending_office_confirmation',
    'delivered_to_office',
    'ready_for_pickup',
    'ready_for_delivery',
    'out_for_delivery',
    'completed'
  ];
  const cancelledButPaidStates = ['cancelled', 'archived_by_shopper'];
  const allEligibleStates = [...advancedStates, ...cancelledButPaidStates];

  const { data: fetchedPackages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['financial-summary-packages', selectedMonth],
    queryFn: async () => {
      let query = supabase
        .from('packages')
        .select('id, user_id, status, item_description, item_link, matched_trip_id, created_at, updated_at, quote, payment_receipt, products_data, payment_method, recurrente_checkout_id, recurrente_payment_id, delivery_method, admin_assigned_tip, estimated_price, incident_flag')
        .in('status', allEligibleStates)
        .order('created_at', { ascending: false });

      if (selectedDateRange) {
        query = query.gte('created_at', selectedDateRange.start.toISOString()).lt('created_at', selectedDateRange.end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Package[];
    },
  });

  // Filter: keep advanced-state packages + cancelled-but-paid packages (client-side check for payment evidence)
  const eligiblePackages = useMemo(() => {
    if (!fetchedPackages) return [];
    return fetchedPackages.filter(pkg => {
      if (!pkg.quote || typeof pkg.quote !== 'object') return false;
      if (advancedStates.includes(pkg.status)) return true;
      if (cancelledButPaidStates.includes(pkg.status)) {
        const receipt = pkg.payment_receipt as any;
        const hasManualReceipt = receipt && typeof receipt === 'object' && receipt.filePath;
        const hasCardPayment = !!pkg.recurrente_payment_id;
        const hasCardReceiptEvidence = receipt && typeof receipt === 'object' && 
          (receipt.method === 'card' || receipt.payment_id || receipt.provider === 'recurrente');
        return hasManualReceipt || hasCardPayment || hasCardReceiptEvidence;
      }
      return false;
    });
  }, [fetchedPackages]);

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

  // Fetch approved/completed refund orders
  const { data: refundOrders } = useQuery({
    queryKey: ['refunds-for-financial-table'],
    queryFn: async () => {
      const { data } = await supabase
        .from('refund_orders')
        .select('id, package_id, shopper_id, amount, reason, status, created_at, completed_at, cancelled_products, receipt_url, receipt_filename')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });
      return data || [];
    }
  });

  // Fetch profiles data for shoppers and travelers
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-financial-table', eligiblePackages.map(p => p.user_id), eligiblePackages.map(p => p.matched_trip_id), primeMemberships?.map(m => m.user_id), refundOrders?.map(r => r.shopper_id)],
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

      // Add refund order shopper_ids
      refundOrders?.forEach(refund => {
        if (refund.shopper_id) userIds.add(refund.shopper_id);
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
    enabled: eligiblePackages.length > 0 || (primeMemberships && primeMemberships.length > 0) || (refundOrders && refundOrders.length > 0)
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
        const paidDate = receipt.uploadedAt || receipt.paid_at;
        if (paidDate) {
          paymentDate = format(new Date(paidDate), 'dd/MM/yyyy');
        }
      } else if (['pending_purchase', 'purchase_confirmed', 'shipped', 'in_transit', 'received_by_traveler', 'delivered_to_office', 'completed'].includes(pkg.status)) {
        paymentDate = format(new Date(pkg.updated_at), 'dd/MM/yyyy');
      }

      const quoteValues = getQuoteValues(quote);
      const travelerTip = quoteValues.price;
      const serviceFee = quoteValues.serviceFee;
      const deliveryFee = quoteValues.deliveryFee;
      const totalToPay = quoteValues.finalTotalPrice;
      const favoronRevenue = serviceFee;
      const messengerPayment = deliveryFee;
      const discountAmount = quoteValues.discountAmount;

      const receipt = pkg.payment_receipt as any;
      const paymentMethod = 
        pkg.recurrente_checkout_id || pkg.payment_method === 'card' || receipt?.method === 'card'
          ? 'Tarjeta'
          : (pkg.payment_method === 'bank_transfer' || pkg.payment_receipt)
            ? 'Transferencia'
            : '-';

      return {
        package: pkg,
        shopperName,
        travelerName,
        tripId: pkg.matched_trip_id || null,
        productDescription,
        productLink,
        paymentDate,
        totalToPay,
        discountAmount,
        travelerTip,
        favoronRevenue,
        messengerPayment,
        paymentMethod,
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
        ? format(new Date(membership.approved_at), 'dd/MM/yyyy')
        : format(new Date(membership.created_at), 'dd/MM/yyyy');

      return {
        package: { id: membership.id } as Package,
        shopperName: memberName,
        travelerName: '-',
        tripId: null,
        productDescription: 'Membresía Prime',
        productLink: null,
        paymentDate,
        totalToPay: membership.amount,
        discountAmount: 0,
        travelerTip: 0,
        favoronRevenue: membership.amount,
        messengerPayment: 0,
        paymentMethod: 'Transferencia',
        isPrimeMembership: true,
        primeAmount: membership.amount
      };
    });

    // Add refund orders as negative entries
    const refundData: EnrichedPackageData[] = (refundOrders || []).map(refund => {
      const shopperProfile = profiles?.[refund.shopper_id];
      const shopperName = shopperProfile
        ? `${shopperProfile.first_name} ${shopperProfile.last_name}`.trim() || 'Usuario'
        : 'Usuario';

      const cancelledProducts = Array.isArray(refund.cancelled_products) ? refund.cancelled_products : [];
      const productNames = cancelledProducts.map((p: any) => p.itemDescription || p.item_description || '').filter(Boolean);

      // Extract tip and serviceFee breakdown from cancelled_products metadata
      let refundTips = 0;
      let refundServiceFee = 0;
      let refundDeliveryFee = 0;

      if (cancelledProducts.length > 0) {
        refundTips = (cancelledProducts as any[]).reduce((sum: number, p: any) => {
          if (p.tip !== undefined) return sum + (Number(p.tip) || 0);
          if (p.adminAssignedTip !== undefined) return sum + (Number(p.adminAssignedTip) || 0);
          return sum;
        }, 0);

        // Use serviceFee from metadata (new format) instead of calculating by subtraction
        refundServiceFee = (cancelledProducts as any[]).reduce((sum: number, p: any) => {
          if (p.serviceFee !== undefined) return sum + (Number(p.serviceFee) || 0);
          return sum;
        }, 0);

        // Extract deliveryFee from cancelled_products metadata (full package cancellations)
        refundDeliveryFee = (cancelledProducts as any[]).reduce((sum: number, p: any) => {
          if (p.deliveryFee !== undefined) return sum + (Number(p.deliveryFee) || 0);
          return sum;
        }, 0);

        // Fallback for legacy records without explicit serviceFee in metadata
        if (refundServiceFee === 0 && refundTips > 0) {
          refundServiceFee = Math.max(0, refund.amount - refundTips - refundDeliveryFee);
        }
      }
      const productDescription = productNames.length > 0
        ? `Reembolso - ${refund.reason || 'Productos cancelados'}: ${productNames.join(', ')}`
        : `Reembolso - ${refund.reason || 'Productos cancelados'}`;

      const paymentDate = refund.completed_at
        ? format(new Date(refund.completed_at), 'dd/MM/yyyy')
        : format(new Date(refund.created_at), 'dd/MM/yyyy');

      return {
        package: { id: refund.id } as Package,
        shopperName,
        travelerName: '-',
        tripId: null,
        productDescription,
        productLink: null,
        paymentDate,
        totalToPay: -refund.amount,
        discountAmount: 0,
        travelerTip: -refundTips,
        favoronRevenue: -refundServiceFee,
        messengerPayment: -refundDeliveryFee,
        paymentMethod: 'Reembolso',
        isPrimeMembership: false,
        isRefund: true,
        refundAmount: refund.amount,
        refundReceiptUrl: refund.receipt_url || undefined,
        refundReceiptFilename: refund.receipt_filename || undefined
      };
    });

    // Generate automatic cancellation counterparts for cancelled-but-paid packages without a refund_order
    const refundedPackageIds = new Set((refundOrders || []).map(r => r.package_id));
    const cancellationData: EnrichedPackageData[] = eligiblePackages
      .filter(pkg => {
        if (!cancelledButPaidStates.includes(pkg.status)) return false;
        // Already has a refund_order — skip to avoid duplication
        if (refundedPackageIds.has(pkg.id)) return false;
        return true;
      })
      .map((pkg): EnrichedPackageData => {
        const quote = pkg.quote as any;
        const quoteValues = getQuoteValues(quote);

        const shopperProfile = profiles?.[pkg.user_id];
        const shopperName = shopperProfile
          ? `${shopperProfile.first_name} ${shopperProfile.last_name}`.trim() || 'Usuario'
          : 'Usuario';

        const travelerId = pkg.matched_trip_id ? trips?.[pkg.matched_trip_id] : null;
        const travelerProfile = travelerId ? profiles?.[travelerId] : null;
        const travelerName = travelerProfile
          ? `${travelerProfile.first_name} ${travelerProfile.last_name}`.trim() || 'Viajero'
          : '-';

        let productDesc = pkg.item_description || 'Sin descripción';
        if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
          const names = (pkg.products_data as any[]).map((p: any) => p.itemDescription).filter(Boolean);
          if (names.length > 0) productDesc = names.join(', ');
        }

        return {
          package: pkg,
          shopperName,
          travelerName,
          tripId: pkg.matched_trip_id || null,
          productDescription: `Cancelación - ${productDesc}`,
          productLink: null,
          paymentDate: format(new Date(pkg.updated_at), 'dd/MM/yyyy'),
          totalToPay: -quoteValues.finalTotalPrice,
          discountAmount: 0,
          travelerTip: -quoteValues.price,
          favoronRevenue: -quoteValues.serviceFee,
          messengerPayment: -quoteValues.deliveryFee,
          paymentMethod: 'Cancelación',
          isPrimeMembership: false,
          isRefund: true,
          refundAmount: quoteValues.finalTotalPrice
        };
      });

    // Combine and sort by date
    return [...packageData, ...primeData, ...refundData, ...cancellationData].sort((a, b) => {
      const dateA = new Date(a.paymentDate.split('/').reverse().join('-'));
      const dateB = new Date(b.paymentDate.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  }, [eligiblePackages, profiles, trips, primeMemberships, refundOrders]);

  // Generate available months from the data
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    
    enrichedData.forEach(item => {
      const dateParts = item.paymentDate.split('/');
      if (dateParts.length === 3) {
        const month = dateParts[1];
        const year = dateParts[2];
        monthsSet.add(`${year}-${month}`);
      }
    });
    
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [enrichedData]);

  // Filter data by selected month + column filters
  const filteredData = useMemo(() => {
    let data = enrichedData;

    if (selectedMonth !== "all") {
      data = data.filter(item => {
        const dateParts = item.paymentDate.split('/');
        if (dateParts.length === 3) {
          const month = dateParts[1];
          const year = dateParts[2];
          return `${year}-${month}` === selectedMonth;
        }
        return false;
      });
    }

    if (shopperFilter.length > 0) {
      data = data.filter(item => shopperFilter.includes(item.shopperName));
    }
    if (travelerFilter.length > 0) {
      data = data.filter(item => travelerFilter.includes(item.travelerName));
    }
    if (statusFilter.length > 0) {
      data = data.filter(item => {
        const label = item.isRefund ? 'Reembolso' : item.isPrimeMembership ? 'Aprobado' : getStatusLabel(item.package.status);
        return statusFilter.includes(label);
      });
    }
    if (paymentMethodFilter.length > 0) {
      data = data.filter(item => paymentMethodFilter.includes(item.paymentMethod));
    }

    return data;
  }, [enrichedData, selectedMonth, shopperFilter, travelerFilter, statusFilter, paymentMethodFilter]);

  // Unique values for column filters (computed from month-filtered data, not column-filtered)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === "all") return enrichedData;
    return enrichedData.filter(item => {
      const dateParts = item.paymentDate.split('/');
      if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}` === selectedMonth;
      }
      return false;
    });
  }, [enrichedData, selectedMonth]);

  const uniqueShoppers = useMemo(() => [...new Set(monthFilteredData.map(i => i.shopperName))].sort(), [monthFilteredData]);
  const uniqueTravelers = useMemo(() => [...new Set(monthFilteredData.map(i => i.travelerName))].sort(), [monthFilteredData]);
  const uniqueStatuses = useMemo(() => {
    return [...new Set(monthFilteredData.map(i => 
      i.isRefund ? 'Reembolso' : i.isPrimeMembership ? 'Aprobado' : getStatusLabel(i.package.status)
    ))].sort();
  }, [monthFilteredData]);
  const uniquePaymentMethods = useMemo(() => [...new Set(monthFilteredData.map(i => i.paymentMethod).filter(m => m !== '-'))].sort(), [monthFilteredData]);

  // Paginate filtered data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      totalToPay: acc.totalToPay + item.totalToPay,
      discountAmount: acc.discountAmount + item.discountAmount,
      travelerTip: acc.travelerTip + item.travelerTip,
      favoronRevenue: acc.favoronRevenue + item.favoronRevenue,
      messengerPayment: acc.messengerPayment + item.messengerPayment,
      primePayments: acc.primePayments + (item.isPrimeMembership ? item.primeAmount || 0 : 0),
      totalRefunds: acc.totalRefunds + (item.isRefund ? item.refundAmount || 0 : 0)
    }), {
      totalToPay: 0,
      discountAmount: 0,
      travelerTip: 0,
      favoronRevenue: 0,
      messengerPayment: 0,
      primePayments: 0,
      totalRefunds: 0
    });
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset to page 1 when month filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, shopperFilter, travelerFilter, statusFilter, paymentMethodFilter]);

  const packageCount = filteredData.filter(e => !e.isPrimeMembership && !e.isRefund).length;
  const primeCount = filteredData.filter(e => e.isPrimeMembership).length;
  const refundCount = filteredData.filter(e => e.isRefund).length;

  const handleDownloadExcel = () => {
    const excelData = filteredData.map(item => ({
      'Fecha Pago': item.paymentDate,
      'ID Pedido': item.package.id,
      'Shopper': item.shopperName,
      'Viajero': item.travelerName,
      'ID Viaje': item.tripId || '-',
      'Producto': item.productDescription,
      'Tipo': item.isRefund ? 'Reembolso' : item.isPrimeMembership ? 'Membresía Prime' : 'Paquete',
      'Estado': item.isRefund ? 'Reembolso' : item.isPrimeMembership ? 'Aprobado' : getStatusLabel(item.package.status),
      'Método Pago': item.paymentMethod,
      'Total a Pagar (Q)': item.totalToPay.toFixed(2),
      'Descuento (Q)': item.discountAmount > 0 ? `-${item.discountAmount.toFixed(2)}` : '0.00',
      'Tip Viajero (Q)': item.travelerTip.toFixed(2),
      'Ingreso Favorón (Q)': item.favoronRevenue.toFixed(2),
      'Pago Mensajero (Q)': item.messengerPayment.toFixed(2),
    }));

    // Add totals row
    excelData.push({
      'Fecha Pago': '',
      'ID Pedido': '',
      'Shopper': '',
      'Viajero': '',
      'ID Viaje': '',
      'Producto': '',
      'Tipo': '',
      'Estado': 'TOTAL',
      'Método Pago': '',
      'Total a Pagar (Q)': totals.totalToPay.toFixed(2),
      'Descuento (Q)': totals.discountAmount > 0 ? `-${totals.discountAmount.toFixed(2)}` : '0.00',
      'Tip Viajero (Q)': totals.travelerTip.toFixed(2),
      'Ingreso Favorón (Q)': totals.favoronRevenue.toFixed(2),
      'Pago Mensajero (Q)': totals.messengerPayment.toFixed(2),
    });

    // Add total refunds row if any
    if (totals.totalRefunds > 0) {
      excelData.push({
        'Fecha Pago': '',
        'ID Pedido': '',
        'Shopper': '',
        'Viajero': '',
        'ID Viaje': '',
        'Producto': '',
        'Tipo': '',
        'Estado': 'TOTAL REEMBOLSOS',
        'Método Pago': '',
        'Total a Pagar (Q)': `-${totals.totalRefunds.toFixed(2)}`,
        'Descuento (Q)': '0.00',
        'Tip Viajero (Q)': '0.00',
        'Ingreso Favorón (Q)': `-${totals.totalRefunds.toFixed(2)}`,
        'Pago Mensajero (Q)': '0.00',
      });
    }

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
                {filteredData.length} transacciones ({packageCount} paquetes + {primeCount} membresías Prime{refundCount > 0 ? ` + ${refundCount} reembolsos` : ''})
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
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total a Pagar</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(totals.totalToPay)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Descuentos</p>
                <p className="text-lg font-bold text-green-600">
                  {totals.discountAmount > 0 ? `-${formatCurrency(totals.discountAmount)}` : formatCurrency(0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Tip Viajeros</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.travelerTip)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Ingreso Favoron</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(totals.favoronRevenue)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Pago Mensajeros</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.messengerPayment)}</p>
              </div>
              {totals.totalRefunds > 0 && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Reembolsos</p>
                  <p className="text-lg font-bold text-red-600">-{formatCurrency(totals.totalRefunds)}</p>
                </div>
              )}
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
                <TableHead>ID Pedido</TableHead>
                <TableHead>
                  <ColumnFilter title="Shopper" options={uniqueShoppers} selectedValues={shopperFilter} onSelectionChange={setShopperFilter} showSearch />
                </TableHead>
                <TableHead>
                  <ColumnFilter title="Viajero" options={uniqueTravelers} selectedValues={travelerFilter} onSelectionChange={setTravelerFilter} showSearch />
                </TableHead>
                <TableHead>ID Viaje</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>
                  <ColumnFilter title="Estado" options={uniqueStatuses} selectedValues={statusFilter} onSelectionChange={setStatusFilter} />
                </TableHead>
                <TableHead>
                  <ColumnFilter title="Método Pago" options={uniquePaymentMethods} selectedValues={paymentMethodFilter} onSelectionChange={setPaymentMethodFilter} />
                </TableHead>
                <TableHead>Recurrente ID</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Tip Viajero</TableHead>
                <TableHead className="text-right">Ingreso Favoron</TableHead>
                <TableHead className="text-right">Pago Mensajero</TableHead>
                <TableHead className="text-center">Comprobante Pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow 
                  key={item.package.id} 
                  className={
                    item.isRefund 
                      ? 'bg-red-50/50 hover:bg-red-100/50' 
                      : item.isPrimeMembership || item.isFromPrimeShopper 
                        ? 'bg-purple-50/50 hover:bg-purple-100/50' 
                        : ''
                  }
                >
                  <TableCell className="text-sm">{item.paymentDate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {item.package.id.slice(0, 8)}...
                  </TableCell>
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
                    {item.isRefund ? (
                      <div className="text-sm text-red-700">
                        <RotateCcw className="h-3 w-3 inline mr-1" />
                        {item.productDescription}
                      </div>
                    ) : item.isPrimeMembership ? (
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
                    {item.isRefund ? (
                      <Badge className="bg-red-600">Reembolso</Badge>
                    ) : item.isPrimeMembership ? (
                      <Badge className="bg-purple-600">Aprobado</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {getStatusLabel(item.package.status)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.isRefund ? (
                      <Badge variant="outline" className="gap-1 border-red-300 text-red-700">
                        <RotateCcw className="h-3 w-3" />
                        Reembolso
                      </Badge>
                    ) : item.paymentMethod !== '-' ? (
                      <Badge variant="outline" className="gap-1">
                        {item.paymentMethod === 'Tarjeta' ? (
                          <CreditCard className="h-3 w-3" />
                        ) : (
                          <Landmark className="h-3 w-3" />
                        )}
                        {item.paymentMethod}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {item.package?.recurrente_checkout_id 
                      ? item.package.recurrente_checkout_id.slice(0, 12) + '...' 
                      : '-'}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${item.isRefund ? 'text-red-600' : ''}`}>
                    {item.isRefund ? `-${formatCurrency(item.refundAmount || 0)}` : formatCurrency(item.totalToPay)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.travelerTip)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${item.isRefund ? 'text-red-600' : ''}`}>
                    {formatCurrency(item.favoronRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.messengerPayment)}
                  </TableCell>
                  <TableCell className="text-center">
                    {!item.isPrimeMembership && !item.isRefund && item.package.payment_receipt && (
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
                    {item.isRefund && (
                      item.refundReceiptUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            let normalized = item.refundReceiptUrl!;
                            if (!normalized.startsWith('http') && !normalized.includes('/storage/v1/object')) {
                              // Refund receipts live inside payment-receipts bucket
                              if (!normalized.startsWith('payment-receipts/')) {
                                normalized = `payment-receipts/${normalized}`;
                              }
                            }
                            setSelectedPaymentReceipt(normalized);
                            setSelectedReceiptFilename(item.refundReceiptFilename || 'comprobante-reembolso.jpg');
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendiente</span>
                      )
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
                <TableCell></TableCell>
                  <TableCell className="text-right font-mono">
                    <strong>{formatCurrency(totals.totalToPay)}</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    <strong>{totals.discountAmount > 0 ? `-${formatCurrency(totals.discountAmount)}` : '-'}</strong>
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
