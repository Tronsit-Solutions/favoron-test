import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Lock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDeliveryFee } from "@/lib/pricing";
import { useGuatemalaCityDeliveryBackfill } from "@/hooks/useGuatemalaCityDeliveryBackfill";

interface PackageWithDiscrepancy {
  id: string;
  package_destination: string;
  delivery_method: string;
  status: string;
  stored_delivery_fee: number;
  expected_delivery_fee: number;
  difference: number;
  trust_level: string;
  is_paid: boolean;
  matched_trip_id: string | null;
}

const DeliveryFeeAuditTable = () => {
  const [packages, setPackages] = useState<PackageWithDiscrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [trustLevelFilter, setTrustLevelFilter] = useState<string>("all");
  const { executeBackfill, loading: backfillLoading, result } = useGuatemalaCityDeliveryBackfill();

  useEffect(() => {
    fetchPackagesWithDiscrepancies();
  }, []);

  const fetchPackagesWithDiscrepancies = async () => {
    setLoading(true);
    try {
      // Fetch packages with delivery method and quote data
      const { data: packagesData, error } = await supabase
        .from('packages')
        .select(`
          id,
          package_destination,
          delivery_method,
          status,
          quote,
          matched_trip_id,
          profiles!inner(trust_level)
        `)
        .eq('delivery_method', 'delivery')
        .not('quote', 'is', null);

      if (error) throw error;

      // Check payment status for each package
      const packagesWithPaymentCheck = await Promise.all(
        (packagesData || []).map(async (pkg: any) => {
          let isPaid = false;

          if (pkg.matched_trip_id) {
            // Check payment_orders
            const { data: paymentOrders } = await supabase
              .from('payment_orders')
              .select('status')
              .eq('trip_id', pkg.matched_trip_id)
              .eq('status', 'completed');

            if (paymentOrders && paymentOrders.length > 0) {
              isPaid = true;
            }

            // Check trip_payment_accumulator
            if (!isPaid) {
              const { data: accumulator } = await supabase
                .from('trip_payment_accumulator')
                .select('payment_completed_at, payment_order_created')
                .eq('trip_id', pkg.matched_trip_id)
                .maybeSingle();

              if (accumulator?.payment_completed_at || accumulator?.payment_order_created) {
                isPaid = true;
              }
            }
          }

          const trustLevel = pkg.profiles?.trust_level || 'basic';
          const storedDeliveryFee = parseFloat(pkg.quote?.deliveryFee || '0');
          const expectedDeliveryFee = getDeliveryFee(
            pkg.delivery_method,
            trustLevel,
            pkg.package_destination
          );
          const difference = storedDeliveryFee - expectedDeliveryFee;

          return {
            id: pkg.id,
            package_destination: pkg.package_destination,
            delivery_method: pkg.delivery_method,
            status: pkg.status,
            stored_delivery_fee: storedDeliveryFee,
            expected_delivery_fee: expectedDeliveryFee,
            difference,
            trust_level: trustLevel,
            is_paid: isPaid,
            matched_trip_id: pkg.matched_trip_id
          };
        })
      );

      // Filter only packages with discrepancies
      const discrepancies = packagesWithPaymentCheck.filter(
        pkg => Math.abs(pkg.difference) > 0.01
      );

      setPackages(discrepancies);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (trustLevelFilter === "all") return true;
    return pkg.trust_level === trustLevelFilter;
  });

  const handleRefresh = () => {
    fetchPackagesWithDiscrepancies();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Auditoría de Delivery Fees
            </CardTitle>
            <CardDescription>
              Paquetes con tarifas de delivery que no coinciden con las esperadas
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={executeBackfill} 
              disabled={backfillLoading}
              variant="outline"
            >
              {backfillLoading ? "Corrigiendo..." : "Corregir Fees"}
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4 items-center">
          <Select value={trustLevelFilter} onValueChange={setTrustLevelFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por Trust Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="prime">Prime</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {filteredPackages.length} paquetes con discrepancias
            {filteredPackages.filter(p => p.is_paid).length > 0 && (
              <span className="ml-2 text-orange-600">
                ({filteredPackages.filter(p => p.is_paid).length} ya pagados 🔒)
              </span>
            )}
          </div>
        </div>

        {result && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Corrección completada: {result.stats?.updated} paquetes actualizados, 
              {result.stats?.skipped_paid} protegidos (ya pagados)
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando auditoría...
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            ✅ No se encontraron discrepancias en delivery fees
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paquete ID</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Trust Level</TableHead>
                  <TableHead>Fee Almacenado</TableHead>
                  <TableHead>Fee Esperado</TableHead>
                  <TableHead>Diferencia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estado Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map(pkg => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-mono text-xs">
                      {pkg.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{pkg.package_destination}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.trust_level === 'prime' ? 'default' : 'secondary'}>
                        {pkg.trust_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      Q{pkg.stored_delivery_fee.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      Q{pkg.expected_delivery_fee.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.difference > 0 ? 'destructive' : 'default'}>
                        {pkg.difference > 0 ? '+' : ''}Q{pkg.difference.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pkg.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {pkg.is_paid ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Pagado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
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
  );
};

export default DeliveryFeeAuditTable;
