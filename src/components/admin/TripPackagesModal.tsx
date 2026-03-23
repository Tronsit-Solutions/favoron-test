import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { Package as PackageIcon, MapPin, DollarSign, Calendar, User, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Trip, Package } from "@/types";
import { formatDateUTC } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";

interface TripPackagesModalProps {
  trip: Trip | null;
  packages: Package[];
  isOpen: boolean;
  onClose: () => void;
}

const TripPackagesModal = ({ trip, packages, isOpen, onClose }: TripPackagesModalProps) => {
  const { getStatusBadge } = useStatusHelpers();
  const [assignmentPackageIds, setAssignmentPackageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!trip || !isOpen) {
      setAssignmentPackageIds([]);
      return;
    }
    const fetchAssignments = async () => {
      const { data } = await supabase
        .from('package_assignments')
        .select('package_id')
        .eq('trip_id', trip.id)
        .in('status', ['bid_pending', 'bid_submitted']);
      setAssignmentPackageIds((data || []).map(a => a.package_id));
    };
    fetchAssignments();
  }, [trip?.id, isOpen]);

  if (!trip) return null;

  const directPackages = packages.filter(pkg => pkg.matched_trip_id === trip.id);
  const biddingPackages = packages.filter(pkg =>
    assignmentPackageIds.includes(pkg.id) && pkg.matched_trip_id !== trip.id
  );
  const biddingPackageIds = new Set(biddingPackages.map(p => p.id));
  const tripPackages = [...directPackages, ...biddingPackages];

  const completedPackages = tripPackages.filter(pkg => ['delivered_to_office', 'completed'].includes(pkg.status));
  const totalValue = tripPackages.reduce((sum, pkg) => sum + (Number(pkg.estimated_price) || 0), 0);
  const totalTips = tripPackages.reduce((sum, pkg) => {
    const quote = pkg.quote as any;
    const tipAmount = quote?.price || pkg.admin_assigned_tip || 0;
    return sum + Number(tipAmount);
  }, 0);

  const getPackageProgress = (pkg: Package) => {
    const statusOrder = [
      'pending_approval', 'approved', 'matched', 'quote_sent', 'payment_pending', 
      'paid', 'pending_purchase', 'in_transit', 
      'delivered_to_office', 'completed'
    ];
    const currentIndex = statusOrder.indexOf(pkg.status);
    const progress = currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
    return Math.min(progress, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Paquetes del Viaje: {trip.from_city} → {trip.to_city}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Resumen del Viaje</CardTitle>
                <span className="text-xs text-muted-foreground/50 font-mono">
                  #{trip.id.slice(0, 8)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{tripPackages.length}</div>
                  <div className="text-sm text-muted-foreground">Total Paquetes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedPackages.length}</div>
                  <div className="text-sm text-muted-foreground">Completados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">${totalValue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">Q{totalTips.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Propinas Ganadas</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span><strong>Ruta:</strong> {trip.from_city} → {trip.to_city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span><strong>Llegada:</strong> {formatDateUTC(trip.arrival_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span><strong>Entrega:</strong> {formatDateUTC(trip.delivery_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(trip.status, { context: 'trip' })}
                  <span><strong>Estado del viaje</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Packages Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Paquetes</CardTitle>
            </CardHeader>
            <CardContent>
              {tripPackages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay paquetes asignados a este viaje</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Última Actualización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripPackages.map((pkg) => {
                      const quote = pkg.quote as any;
                      const tipAmount = quote?.price || pkg.admin_assigned_tip || 0;
                      const progress = getPackageProgress(pkg);
                      
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">
                                {pkg.item_description || 'Sin descripción'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {pkg.purchase_origin} → {pkg.package_destination}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="h-3 w-3" />
                                Shopper: #{pkg.user_id?.slice(-8)}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getStatusBadge(pkg.status)}
                              {biddingPackageIds.has(pkg.id) && (
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                                  <Zap className="h-3 w-3 mr-0.5" />
                                  Compitiendo
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">
                                ${Number(pkg.estimated_price || 0).toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-green-600 font-semibold text-xs">Q</span>
                              <span className={`font-medium ${tipAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {Number(tipAmount).toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Math.round(progress)}%
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {pkg.updated_at && !isNaN(new Date(pkg.updated_at).getTime()) ? (
                                formatDistanceToNow(new Date(pkg.updated_at), { 
                                  addSuffix: true, 
                                  locale: es 
                                })
                              ) : (
                                "Fecha no disponible"
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripPackagesModal;