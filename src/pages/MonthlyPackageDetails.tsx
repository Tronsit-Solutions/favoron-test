import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, DollarSign, MapPin, User, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
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

type SortField = 'created_at' | 'item_description' | 'customer' | 'traveler' | 'route' | 'status' | 'price' | 'tip' | 'favoron_income' | 'messenger';
type SortDirection = 'asc' | 'desc' | null;

const MonthlyPackageDetails = () => {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthName, setMonthName] = useState("");
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

  const statusOptions = [
    { value: 'pending_approval', label: 'Pendiente aprobación' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'matched', label: 'Asignado' },
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
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);

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
    const price = pkg.quote?.totalPrice || pkg.quote?.price || pkg.estimated_price || 0;
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return Number.isFinite(numPrice) ? numPrice : 0;
  };

  const calculateTotals = () => {
    // Solo considerar paquetes pagados (pending_purchase en adelante)
    const paidStatuses = ['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
    const paidPackages = packages.filter(pkg => paidStatuses.includes(pkg.status));
    
    const totalRevenue = paidPackages.reduce((sum, pkg) => {
      const price = getTotalPrice(pkg);
      return sum + price;
    }, 0);
    
    const totalTips = paidPackages.reduce((sum, pkg) => {
      const tip = pkg.admin_assigned_tip || 0;
      const numTip = typeof tip === 'string' ? parseFloat(tip) : Number(tip);
      return sum + (Number.isFinite(numTip) ? numTip : 0);
    }, 0);
    
    const totalServiceFees = totalRevenue - totalTips;

    return { 
      totalRevenue: Number(totalRevenue) || 0, 
      totalTips: Number(totalTips) || 0, 
      totalServiceFees: Number(totalServiceFees) || 0 
    };
  };

  const getFavoronIncome = (pkg: PackageData) => {
    // Ingreso de Favoron es el 40% del tip del viajero (o 20% si es prime)
    // Por ahora usamos 40% por defecto
    const tip = pkg.admin_assigned_tip || 0;
    const numTip = typeof tip === 'string' ? parseFloat(tip) : Number(tip);
    const validTip = Number.isFinite(numTip) ? numTip : 0;
    
    // Favoron se queda con 40% del tip del viajero
    return validTip * 0.40;
  };

  const getMessengerCost = (pkg: PackageData) => {
    // El costo de delivery/mensajería está en quote.deliveryFee
    const deliveryFee = pkg.quote?.deliveryFee || 0;
    const numDeliveryFee = typeof deliveryFee === 'string' ? parseFloat(deliveryFee) : Number(deliveryFee);
    return Number.isFinite(numDeliveryFee) ? numDeliveryFee : 0;
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

    // Apply status filter first (multiple selection)
    if (selectedStatuses.length > 0) {
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
            aValue = a.admin_assigned_tip || 0;
            bValue = b.admin_assigned_tip || 0;
            break;
          case 'favoron_income':
            aValue = getFavoronIncome(a);
            bValue = getFavoronIncome(b);
            break;
          case 'messenger':
            aValue = getMessengerCost(a);
            bValue = getMessengerCost(b);
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

  const { totalRevenue, totalTips, totalServiceFees } = calculateTotals();

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
            {packages.length} paquetes en total • {displayedPackages.length} mostrados
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold">Q{totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tips Viajeros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold">Q{totalTips.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Favorón
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <p className="text-2xl font-bold">Q{totalServiceFees.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Earning Trip */}
      {topEarningTrip && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Viaje con Mayor Ganancia del Mes
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
          </CardContent>
        </Card>
      )}

      {/* Packages Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Paquetes del Mes</CardTitle>
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
                        Fecha
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
                              <Filter className={`h-3 w-3 ${selectedStatuses.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64" align="start">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Filtrar por estado</h4>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (selectedStatuses.length === statusOptions.length) {
                                        setSelectedStatuses([]);
                                      } else {
                                        setSelectedStatuses(statusOptions.map(s => s.value));
                                      }
                                    }}
                                    className="h-auto p-0 text-xs"
                                  >
                                    {selectedStatuses.length === statusOptions.length ? 'Deseleccionar' : 'Seleccionar'} todas
                                  </Button>
                                  {selectedStatuses.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedStatuses([])}
                                      className="h-auto p-0 text-xs"
                                    >
                                      Limpiar
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                {statusOptions.map((status) => (
                                  <div key={status.value} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={status.value}
                                      checked={selectedStatuses.includes(status.value)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedStatuses([...selectedStatuses, status.value]);
                                        } else {
                                          setSelectedStatuses(selectedStatuses.filter(s => s !== status.value));
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={status.value}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {status.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
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
                  {displayedPackages.map((pkg) => (
                    <TableRow key={pkg.id} className="hover:bg-muted/30">
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
                      <TableCell className="py-2 text-xs text-right font-semibold text-blue-600">
                        {pkg.admin_assigned_tip ? `Q${(typeof pkg.admin_assigned_tip === 'string' ? parseFloat(pkg.admin_assigned_tip) : pkg.admin_assigned_tip).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-medium text-purple-600">
                        Q{getFavoronIncome(pkg).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-right font-medium text-green-600">
                        {getMessengerCost(pkg) > 0 ? `Q${getMessengerCost(pkg).toFixed(2)}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyPackageDetails;
