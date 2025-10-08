import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, DollarSign, MapPin, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const MonthlyPackageDetails = () => {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthName, setMonthName] = useState("");

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
          profiles:user_id (
            first_name,
            last_name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPackages(data || []);
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
    const totalRevenue = packages.reduce((sum, pkg) => {
      const price = getTotalPrice(pkg);
      return sum + price;
    }, 0);
    
    const totalTips = packages.reduce((sum, pkg) => {
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
            {packages.length} paquetes en total
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
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-9 text-xs font-semibold">Fecha</TableHead>
                  <TableHead className="h-9 text-xs font-semibold">Paquete</TableHead>
                  <TableHead className="h-9 text-xs font-semibold">Cliente</TableHead>
                  <TableHead className="h-9 text-xs font-semibold">Ruta</TableHead>
                  <TableHead className="h-9 text-xs font-semibold">Estado</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-right">Precio</TableHead>
                  <TableHead className="h-9 text-xs font-semibold text-right">Tip Viajero</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
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
                      {pkg.purchase_origin} → {pkg.package_destination}
                    </TableCell>
                    <TableCell className="py-2">
                      {getStatusBadge(pkg.status)}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-right font-medium">
                      Q{getTotalPrice(pkg).toFixed(2)}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-right font-semibold text-blue-600">
                      {pkg.admin_assigned_tip ? `Q${(typeof pkg.admin_assigned_tip === 'string' ? parseFloat(pkg.admin_assigned_tip) : pkg.admin_assigned_tip).toFixed(2)}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyPackageDetails;
