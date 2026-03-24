import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, DollarSign, MapPin, User, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Filter, Download, Crown, Eye } from "lucide-react";
import TripPackagesModal from "@/components/admin/TripPackagesModal";
import * as XLSX from 'xlsx';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PackageData {
  id: string;
  item_description: string;
  status: string;
  estimated_price: number;
  purchase_origin: string;
  package_destination: string;
  created_at: string;
  user_id: string;
  quote: any;
  admin_assigned_tip: number;
  delivery_method: string;
  matched_trip_id: string | null;
  profiles: {
    first_name: string;
    last_name: string;
  };
  trips?: {
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

interface TripData {
  id: string;
  from_city: string;
  to_city: string;
  arrival_date: string;
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface PrimeMembershipData {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

type TableRowType = 
  | { type: 'package'; data: PackageData }
  | { type: 'prime'; data: PrimeMembershipData };

type SortField = 'created_at' | 'item_description' | 'customer' | 'traveler' | 'route' | 'status' | 'price' | 'tip' | 'favoron_income' | 'messenger' | 'discount';
type SortDirection = 'asc' | 'desc' | null;

const MonthlyPackageDetails = () => {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [primeMembers, setPrimeMembers] = useState<PrimeMembershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthName, setMonthName] = useState("");
  const [year, setYear] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState({
    item_description: '',
    customer: '',
    traveler: '',
    route: '',
    status: '',
  });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [statusFilterType, setStatusFilterType] = useState<'all' | 'paid'>('all');
  const [selectedTripForModal, setSelectedTripForModal] = useState<any>(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  
  // Paid statuses group - all states after payment has been received
  const paidStatuses = [
    'paid',
    'pending_purchase', 
    'purchased',
    'in_transit',
    'received_by_traveler',
    'pending_office_confirmation',
    'delivered_to_office',
    'ready_for_pickup',
    'ready_for_delivery',
    'out_for_delivery',
    'completed'
  ];

  const handleViewTripPackages = () => {
    if (topEarningTrip) {
      setSelectedTripForModal(topEarningTrip.trip);
      setIsTripModalOpen(true);
    }
  };

  const statusOptions = [
    { value: 'pending_approval', label: 'Pendiente aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'matched', label: 'Emparejado' },
    { value: 'quote_sent', label: 'Cotización enviada' },
    { value: 'payment_pending', label: 'Pago pendiente' },
    { value: 'paid', label: 'Pagado' },
    { value: 'pending_purchase', label: 'Pendiente compra' },
    { value: 'in_transit', label: 'En tránsito' },
    { value: 'delivered_to_office', label: 'En oficina' },
    { value: 'completed', label: 'Completado' },
    { value: 'rejected', label: 'Rechazado' },
    { value: 'quote_expired', label: 'Cotización expirada' },
  ];

  useEffect(() => {
    if (month) {
      fetchMonthPackages();
    }
  }, [month]);

  const fetchMonthPackages = async () => {
    if (!month) return;

    try {
      setLoading(true);
      
      // Parse month string (format: YYYY-MM)
      const [yearStr, monthNum] = month.split('-');
      setYear(yearStr);
      const startDate = new Date(parseInt(yearStr), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(yearStr), parseInt(monthNum), 0, 23, 59, 59);

      // Format month name
      setMonthName(format(startDate, 'MMMM yyyy', { locale: es }));

      // Fetch packages for the month
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          item_description,
          status,
          estimated_price,
          purchase_origin,
          package_destination,
          created_at,
          user_id,
          quote,
          admin_assigned_tip,
          delivery_method,
          matched_trip_id,
          profiles:user_id (
            first_name,
            last_name
          ),
          trips:matched_trip_id (
            profiles:user_id (
              first_name,
              last_name
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPackages(data || []);

      // Fetch trips for the month (based on arrival_date)
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          id,
          from_city,
          to_city,
          arrival_date,
          user_id,
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .gte('arrival_date', startDate.toISOString())
        .lte('arrival_date', endDate.toISOString())
        .order('arrival_date', { ascending: false });

      if (tripsError) throw tripsError;

      setTrips(tripsData || []);

      // Fetch prime memberships for the month
      const { data: primeData, error: primeError } = await supabase
        .from('prime_memberships')
        .select(`
          id,
          user_id,
          amount,
          status,
          created_at,
          profiles!prime_memberships_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (primeError) throw primeError;

      setPrimeMembers(primeData || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los paquetes del mes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending_approval: { label: "Pendiente aprobación", variant: "secondary" },
      approved: { label: "Aprobado", variant: "default" },
      matched: { label: "Asignado", variant: "default" },
      quote_sent: { label: "Cotización enviada", variant: "default" },
      paid: { label: "Pagado", variant: "default" },
      pending_purchase: { label: "Pendiente compra", variant: "default" },
      in_transit: { label: "En tránsito", variant: "default" },
      delivered_to_office: { label: "En oficina", variant: "default" },
      completed: { label: "Completado", variant: "default" },
      rejected: { label: "Rechazado", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getTotalPrice = (pkg: PackageData) => {
    // Sincronizado con RPC get_monthly_reports: price + serviceFee + deliveryFee - discountAmount
    const price = pkg.quote?.price || 0;
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    const validPrice = Number.isFinite(numPrice) ? numPrice : 0;
    
    const serviceFee = getFavoronIncome(pkg);
    const deliveryFee = getMessengerCost(pkg);
    const discount = getDiscountAmount(pkg);
    
    return validPrice + serviceFee + deliveryFee - discount;
  };

  const getTipAmount = (pkg: PackageData) => {
    // Usar quote.price para consistencia con la RPC (no admin_assigned_tip)
    const price = pkg.quote?.price || 0;
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return Number.isFinite(numPrice) ? numPrice : 0;
  };

  const calculateTotals = (packagesToCalculate: PackageData[] = packages) => {
    // Usar los paquetes que se le pasen (por defecto todos, pero puede ser displayedPackages)
    const totalRevenue = packagesToCalculate.reduce((sum, pkg) => {
      const price = getTotalPrice(pkg);
      return sum + price;
    }, 0);
    
    const totalTips = packagesToCalculate.reduce((sum, pkg) => {
      return sum + getTipAmount(pkg);
    }, 0);
    
    const totalFavoronIncome = packagesToCalculate.reduce((sum, pkg) => {
      return sum + getFavoronIncome(pkg);
    }, 0);

    const totalDiscounts = packagesToCalculate.reduce((sum, pkg) => {
      return sum + getDiscountAmount(pkg);
    }, 0);

    return { 
      totalRevenue: Number(totalRevenue) || 0, 
      totalTips: Number(totalTips) || 0, 
      totalFavoronIncome: Number(totalFavoronIncome) || 0,
      totalDiscounts: Number(totalDiscounts) || 0
    };
  };

  const getFavoronIncome = (pkg: PackageData) => {
    // Primero intentar usar el serviceFee del quote
    const serviceFee = pkg.quote?.serviceFee || 0;
    const numServiceFee = typeof serviceFee === 'string' ? parseFloat(serviceFee) : Number(serviceFee);
    
    if (Number.isFinite(numServiceFee) && numServiceFee > 0) {
      return numServiceFee;
    }
    
    // Si serviceFee es 0 o no existe, calcular la diferencia entre quote total y admin_assigned_tip
    const quote = pkg.quote;
    if (!quote) return 0;
    
    const total = quote.totalPrice ?? quote.price ?? 0;
    const numTotal = typeof total === 'string' ? parseFloat(total) : Number(total);
    const validTotal = Number.isFinite(numTotal) ? numTotal : 0;
    
    const tip = pkg.admin_assigned_tip || 0;
    const numTip = typeof tip === 'string' ? parseFloat(tip) : Number(tip);
    const validTip = Number.isFinite(numTip) ? numTip : 0;
    
    return validTotal - validTip;
  };

  const getMessengerCost = (pkg: PackageData) => {
    // El costo de delivery/mensajería está en quote.deliveryFee
    const deliveryFee = pkg.quote?.deliveryFee || 0;
    const numDeliveryFee = typeof deliveryFee === 'string' ? parseFloat(deliveryFee) : Number(deliveryFee);
    return Number.isFinite(numDeliveryFee) ? numDeliveryFee : 0;
  };

  const getDiscountAmount = (pkg: PackageData) => {
    // El descuento aplicado está en quote.discountAmount
    const discountAmount = pkg.quote?.discountAmount || 0;
    const numDiscount = typeof discountAmount === 'string' ? parseFloat(discountAmount) : Number(discountAmount);
    return Number.isFinite(numDiscount) ? numDiscount : 0;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAndFilteredPackages = () => {
    let filtered = [...packages];

    // Apply status filter type (Pagado or Todos)
    if (statusFilterType === 'paid') {
      filtered = filtered.filter(pkg => paidStatuses.includes(pkg.status));
    }

    // Apply additional status filter (multiple selection) - only if 'all' mode
    if (statusFilterType === 'all' && selectedStatuses.length > 0) {
      filtered = filtered.filter(pkg => selectedStatuses.includes(pkg.status));
    }

    // Apply filters
    if (filters.item_description) {
      filtered = filtered.filter(pkg => 
        pkg.item_description.toLowerCase().includes(filters.item_description.toLowerCase())
      );
    }
    if (filters.customer) {
      filtered = filtered.filter(pkg => 
        `${pkg.profiles?.first_name} ${pkg.profiles?.last_name}`.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }
    if (filters.traveler) {
      filtered = filtered.filter(pkg => 
        `${pkg.trips?.profiles?.first_name || ''} ${pkg.trips?.profiles?.last_name || ''}`.toLowerCase().includes(filters.traveler.toLowerCase())
      );
    }
    if (filters.route) {
      filtered = filtered.filter(pkg => 
        `${pkg.purchase_origin} ${pkg.package_destination}`.toLowerCase().includes(filters.route.toLowerCase())
      );
    }
    if (filters.status) {
      filtered = filtered.filter(pkg => 
        pkg.status.toLowerCase().includes(filters.status.toLowerCase())
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case 'item_description':
            aValue = a.item_description.toLowerCase();
            bValue = b.item_description.toLowerCase();
            break;
          case 'customer':
            aValue = `${a.profiles?.first_name} ${a.profiles?.last_name}`.toLowerCase();
            bValue = `${b.profiles?.first_name} ${b.profiles?.last_name}`.toLowerCase();
            break;
          case 'traveler':
            aValue = `${a.trips?.profiles?.first_name || ''} ${a.trips?.profiles?.last_name || ''}`.toLowerCase();
            bValue = `${b.trips?.profiles?.first_name || ''} ${b.trips?.profiles?.last_name || ''}`.toLowerCase();
            break;
          case 'route':
            aValue = `${a.purchase_origin} ${a.package_destination}`.toLowerCase();
            bValue = `${b.purchase_origin} ${b.package_destination}`.toLowerCase();
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'price':
            aValue = getTotalPrice(a);
            bValue = getTotalPrice(b);
            break;
          case 'tip':
            aValue = getTipAmount(a);
            bValue = getTipAmount(b);
            break;
          case 'favoron_income':
            aValue = getFavoronIncome(a);
            bValue = getFavoronIncome(b);
            break;
          case 'messenger':
            aValue = getMessengerCost(a);
            bValue = getMessengerCost(b);
            break;
          case 'discount':
            aValue = getDiscountAmount(a);
            bValue = getDiscountAmount(b);
            break;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  };

  const displayedPackages = getSortedAndFilteredPackages();

  const getTopEarningTrip = () => {
    if (trips.length === 0 || packages.length === 0) return null;

    // Calculate earnings for each trip
    const tripEarnings = trips.map(trip => {
      const tripPackages = packages.filter(pkg => pkg.matched_trip_id === trip.id);
      const paidStatuses = ['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
      const paidPackages = tripPackages.filter(pkg => paidStatuses.includes(pkg.status));
      
      const totalTips = paidPackages.reduce((sum, pkg) => {
        const tip = pkg.admin_assigned_tip || 0;
        const numTip = typeof tip === 'string' ? parseFloat(tip) : Number(tip);
        return sum + (Number.isFinite(numTip) ? numTip : 0);
      }, 0);

      return {
        trip,
        totalTips,
        packageCount: paidPackages.length
      };
    });

    // Find trip with highest earnings
    const topTrip = tripEarnings.reduce((max, current) => 
      current.totalTips > max.totalTips ? current : max
    , tripEarnings[0]);

    return topTrip.totalTips > 0 ? topTrip : null;
  };

  const topEarningTrip = getTopEarningTrip();
  
  // Calculate totals for summary cards (only paid packages)
  const paidPackages = packages.filter(pkg => paidStatuses.includes(pkg.status));
  const { totalRevenue: paidRevenue, totalTips: paidTips, totalFavoronIncome: paidFavoronIncome, totalDiscounts: paidDiscounts } = calculateTotals(paidPackages);
  const totalDeliveryFees = paidPackages.reduce((sum, pkg) => sum + getMessengerCost(pkg), 0);
  
  // Calculate Prime income (approved memberships only)
  const approvedPrimeMembers = primeMembers.filter(pm => pm.status === 'approved');
  const totalPrimeIncome = approvedPrimeMembers.reduce((sum, pm) => sum + pm.amount, 0);
  
  // Calculate totals based on displayed packages (respects filters for table)
  const { totalRevenue, totalTips, totalFavoronIncome, totalDiscounts } = calculateTotals(displayedPackages);

  const handleDownloadExcel = () => {
    const displayed = getSortedAndFilteredPackages();
    
    // Prepare data for Excel - Packages
    const packageData = displayed.map(pkg => ({
      'Tipo': 'Paquete',
      'Fecha': format(new Date(pkg.created_at), 'dd/MM/yyyy', { locale: es }),
      'Descripción': pkg.item_description,
      'Cliente': `${pkg.profiles?.first_name || ''} ${pkg.profiles?.last_name || ''}`.trim() || 'N/A',
      'Viajero': pkg.trips?.profiles 
        ? `${pkg.trips.profiles.first_name || ''} ${pkg.trips.profiles.last_name || ''}`.trim() 
        : 'Sin asignar',
      'Origen': pkg.purchase_origin,
      'Destino': pkg.package_destination,
      'Estado': getStatusBadgeText(pkg.status),
      'Precio Total': getTotalPrice(pkg),
      'Descuento': getDiscountAmount(pkg),
      'Tip Viajero': pkg.admin_assigned_tip || 0,
      'Ingreso Favorón': getFavoronIncome(pkg),
      'Costo Mensajero': getMessengerCost(pkg),
    }));

    // Prepare data for Excel - Prime Memberships
    const primeData = primeMembers.map(pm => ({
      'Tipo': 'Membresía Prime',
      'Fecha': format(new Date(pm.created_at), 'dd/MM/yyyy', { locale: es }),
      'Descripción': 'Membresía Prime',
      'Cliente': `${pm.profiles?.first_name || ''} ${pm.profiles?.last_name || ''}`.trim() || 'N/A',
      'Viajero': 'N/A',
      'Origen': 'N/A',
      'Destino': 'N/A',
      'Estado': pm.status === 'approved' ? 'Aprobada' : pm.status === 'rejected' ? 'Rechazada' : 'Pendiente',
      'Precio Total': 'N/A',
      'Descuento': 0,
      'Tip Viajero': 0,
      'Ingreso Favorón': pm.status === 'approved' ? pm.amount : 0,
      'Costo Mensajero': 0,
    }));

    // Combine both arrays
    const excelData = [...packageData, ...primeData];

    // Add totals row
    const totalMessenger = displayed.reduce((sum, pkg) => sum + getMessengerCost(pkg), 0);
    const totalPrimeIncomeForExcel = primeMembers
      .filter(pm => pm.status === 'approved')
      .reduce((sum, pm) => sum + pm.amount, 0);

    const totalDiscounts = displayed.reduce((sum, pkg) => sum + getDiscountAmount(pkg), 0);

    excelData.push({
      'Tipo': '',
      'Fecha': '',
      'Descripción': '',
      'Cliente': '',
      'Viajero': '',
      'Origen': '',
      'Destino': '',
      'Estado': 'TOTAL',
      'Precio Total': totalRevenue,
      'Descuento': totalDiscounts,
      'Tip Viajero': totalTips,
      'Ingreso Favorón': totalFavoronIncome + totalPrimeIncomeForExcel,
      'Costo Mensajero': totalMessenger,
    });

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthName);

    // Download
    XLSX.writeFile(wb, `Reporte_${monthName}_${year}.xlsx`);
    
    toast({
      title: "Descarga exitosa",
      description: `Se descargó el reporte completo de ${monthName}`,
    });
  };

  const getStatusBadgeText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending_approval': 'Pendiente Aprobación',
      'approved': 'Aprobado',
      'matched': 'Asignado',
      'quote_sent': 'Cotización Enviada',
      'payment_pending': 'Pago Pendiente',
      'pending_purchase': 'Compra Pendiente',
      'in_transit': 'En Tránsito',
      'received_by_traveler': 'Recibido',
      'delivered_to_office': 'En Oficina',
      'completed': 'Completado',
      'quote_expired': 'Cotización Expirada',
      'rejected': 'Rechazado',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold capitalize">{monthName}</h1>
          <p className="text-muted-foreground">
            {packages.length} paquetes • {primeMembers.length} membresías Prime • {displayedPackages.length + primeMembers.length} registros totales
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales (Pagados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold">Q{(paidRevenue + totalPrimeIncome).toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPackages.length} paquetes • {approvedPrimeMembers.length} Prime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tips Viajeros (Pagados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold">Q{paidTips.toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPackages.length} paquetes pagados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Favorón (Pagados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <p className="text-2xl font-bold">Q{paidFavoronIncome.toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPackages.length} paquetes pagados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos por Delivery (Pagados)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <p className="text-2xl font-bold">Q{totalDeliveryFees.toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidPackages.length} paquetes pagados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Descuentos Aplicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              <p className="text-2xl font-bold text-red-600">-Q{paidDiscounts.toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Restados del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Prime (Aprobadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <p className="text-2xl font-bold">Q{totalPrimeIncome.toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedPrimeMembers.length} membresía{approvedPrimeMembers.length !== 1 ? 's' : ''} aprobada{approvedPrimeMembers.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Earning Trip */}
      {topEarningTrip && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Viajero del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Viajero</p>
                <p className="font-semibold">
                  {topEarningTrip.trip.profiles?.first_name} {topEarningTrip.trip.profiles?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ruta</p>
                <p className="font-semibold">
                  {topEarningTrip.trip.from_city} → {topEarningTrip.trip.to_city}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Llegada a Guatemala</p>
                <p className="font-semibold">
                  {format(new Date(topEarningTrip.trip.arrival_date), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganancia Total</p>
                <p className="text-2xl font-bold text-green-600">
                  Q{topEarningTrip.totalTips.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {topEarningTrip.packageCount} paquete{topEarningTrip.packageCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewTripPackages}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver Paquetes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Paquetes del Mes</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {packages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay paquetes en este mes
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="h-9 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted"
                        onClick={() => handleSort('created_at')}
                      >
                        Fecha de solicitud
                        {sortField === 'created_at' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'created_at' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted"
                        onClick={() => handleSort('item_description')}
                      >
                        Paquete
                        {sortField === 'item_description' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'item_description' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted"
                        onClick={() => handleSort('customer')}
                      >
                        Cliente
                        {sortField === 'customer' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'customer' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted"
                        onClick={() => handleSort('traveler')}
                      >
                        Viajero
                        {sortField === 'traveler' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'traveler' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted"
                        onClick={() => handleSort('route')}
                      >
                        Ruta
                        {sortField === 'route' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'route' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-semibold hover:bg-muted"
                          onClick={() => handleSort('status')}
                        >
                          Estado
                          {sortField === 'status' && (
                            sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                          )}
                          {sortField !== 'status' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Filter className={`h-3 w-3 ${statusFilterType === 'paid' || selectedStatuses.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56" align="start">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm mb-3">Filtrar por estado</h4>
                              <Button
                                variant={statusFilterType === 'all' ? 'default' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => {
                                  setStatusFilterType('all');
                                  setSelectedStatuses([]);
                                }}
                              >
                                Todos
                              </Button>
                              <Button
                                variant={statusFilterType === 'paid' ? 'default' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => {
                                  setStatusFilterType('paid');
                                  setSelectedStatuses([]);
                                }}
                              >
                                Pagado
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                    <TableHead className="h-9 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted ml-auto"
                        onClick={() => handleSort('price')}
                      >
                        Precio ($)
                        {sortField === 'price' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'price' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted ml-auto"
                        onClick={() => handleSort('discount')}
                      >
                        Descuento (Q)
                        {sortField === 'discount' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'discount' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted ml-auto"
                        onClick={() => handleSort('tip')}
                      >
                        Tip (Q)
                        {sortField === 'tip' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'tip' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted ml-auto"
                        onClick={() => handleSort('favoron_income')}
                      >
                        Ingreso Favorón (Q)
                        {sortField === 'favoron_income' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'favoron_income' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                    <TableHead className="h-9 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs font-semibold hover:bg-muted ml-auto"
                        onClick={() => handleSort('messenger')}
                      >
                        Mensajería (Q)
                        {sortField === 'messenger' && (
                          sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                        )}
                        {sortField !== 'messenger' && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {/* Totals Row */}
                   <TableRow className="bg-muted/50 font-semibold border-b-2">
                     <TableCell className="py-2 text-xs">Total</TableCell>
                     <TableCell className="py-2 text-xs"></TableCell>
                     <TableCell className="py-2 text-xs"></TableCell>
                     <TableCell className="py-2 text-xs"></TableCell>
                     <TableCell className="py-2 text-xs"></TableCell>
                     <TableCell className="py-2 text-xs"></TableCell>
                     <TableCell className="py-2 text-xs text-right">
                       ${displayedPackages.reduce((sum, pkg) => sum + getTotalPrice(pkg), 0).toFixed(2)}
                     </TableCell>
                     <TableCell className="py-2 text-xs text-right text-red-600">
                       Q{displayedPackages.reduce((sum, pkg) => sum + getDiscountAmount(pkg), 0).toFixed(2)}
                     </TableCell>
                     <TableCell className="py-2 text-xs text-right text-blue-600">
                       Q{displayedPackages.reduce((sum, pkg) => sum + getTipAmount(pkg), 0).toFixed(2)}
                     </TableCell>
                     <TableCell className="py-2 text-xs text-right text-purple-600">
                       Q{(
                         displayedPackages.reduce((sum, pkg) => sum + getFavoronIncome(pkg), 0) +
                         primeMembers.filter(pm => pm.status === 'approved').reduce((sum, pm) => sum + pm.amount, 0)
                       ).toFixed(2)}
                     </TableCell>
                     <TableCell className="py-2 text-xs text-right text-green-600">
                       Q{displayedPackages.reduce((sum, pkg) => sum + getMessengerCost(pkg), 0).toFixed(2)}
                     </TableCell>
                   </TableRow>
                   {/* Data Rows - Packages */}
                   {displayedPackages.map((pkg) => (
                     <TableRow key={`pkg-${pkg.id}`} className="hover:bg-muted/30">
                       <TableCell className="py-2 text-xs">
                         {format(new Date(pkg.created_at), "dd/MM/yyyy")}
                       </TableCell>
                       <TableCell className="py-2 text-xs max-w-[200px] truncate">
                         {pkg.item_description}
                       </TableCell>
                       <TableCell className="py-2 text-xs">
                         {pkg.profiles?.first_name} {pkg.profiles?.last_name}
                       </TableCell>
                       <TableCell className="py-2 text-xs">
                         {pkg.trips?.profiles ?
                          `${pkg.trips.profiles.first_name} ${pkg.trips.profiles.last_name}` 
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {pkg.purchase_origin} → {pkg.package_destination}
                      </TableCell>
                      <TableCell className="py-2">
                        {getStatusBadge(pkg.status)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-medium">
                        ${getTotalPrice(pkg).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-semibold text-red-600">
                        {getDiscountAmount(pkg) > 0 ? `-Q${getDiscountAmount(pkg).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-semibold text-blue-600">
                        {getTipAmount(pkg) > 0 ? `Q${getTipAmount(pkg).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-medium text-purple-600">
                        Q{getFavoronIncome(pkg).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-medium text-green-600">
                        {getMessengerCost(pkg) > 0 ? `Q${getMessengerCost(pkg).toFixed(2)}` : "-"}
                      </TableCell>
                     </TableRow>
                   ))}
                   {/* Data Rows - Prime Memberships */}
                   {primeMembers.map((pm) => (
                     <TableRow key={`prime-${pm.id}`} className="hover:bg-muted/30 bg-amber-50/30 dark:bg-amber-950/20">
                       <TableCell className="py-2 text-xs">
                         {format(new Date(pm.created_at), "dd/MM/yyyy")}
                       </TableCell>
                       <TableCell className="py-2 text-xs">
                         <div className="flex items-center gap-2">
                           <Crown className="h-3 w-3 text-amber-500" />
                           <span>Membresía Prime</span>
                         </div>
                       </TableCell>
                       <TableCell className="py-2 text-xs">
                         {pm.profiles?.first_name} {pm.profiles?.last_name}
                       </TableCell>
                       <TableCell className="py-2 text-xs text-muted-foreground">
                         N/A
                       </TableCell>
                       <TableCell className="py-2 text-xs text-muted-foreground">
                         N/A
                       </TableCell>
                       <TableCell className="py-2">
                         <Badge variant={pm.status === 'approved' ? 'default' : pm.status === 'rejected' ? 'destructive' : 'secondary'}>
                           {pm.status === 'approved' ? 'Aprobada' : pm.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                         </Badge>
                       </TableCell>
                       <TableCell className="py-2 text-xs text-right text-muted-foreground">
                         N/A
                       </TableCell>
                       <TableCell className="py-2 text-xs text-right text-muted-foreground">
                         Q0.00
                       </TableCell>
                       <TableCell className="py-2 text-xs text-right text-muted-foreground">
                         Q0.00
                       </TableCell>
                       <TableCell className="py-2 text-xs text-right font-medium text-purple-600">
                         {pm.status === 'approved' ? `Q${pm.amount.toFixed(2)}` : 'Q0.00'}
                       </TableCell>
                       <TableCell className="py-2 text-xs text-right text-muted-foreground">
                         Q0.00
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <TripPackagesModal
        trip={selectedTripForModal}
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
      />
    </div>
  );
};

export default MonthlyPackageDetails;
