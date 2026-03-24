import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { Package as PackageIcon, MapPin, DollarSign, Calendar, User, Zap, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Trip, Package } from "@/types";
import { formatDateUTC } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";

interface BiddingAssignment {
  id: string;
  package_id: string;
  status: string;
  admin_assigned_tip: number | null;
  quote: any;
  packages: {
    id: string;
    item_description: string;
    estimated_price: number | null;
    purchase_origin: string;
    package_destination: string;
    user_id: string;
    status: string;
    updated_at: string;
  } | null;
}

interface TripPackagesModalProps {
  trip: Trip | null;
  packages: Package[];
  isOpen: boolean;
  onClose: () => void;
}

const TripPackagesModal = ({ trip, packages, isOpen, onClose }: TripPackagesModalProps) => {
  const { getStatusBadge } = useStatusHelpers();
  const [biddingAssignments, setBiddingAssignments] = useState<BiddingAssignment[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  // Confirmed packages from local data (instant)
  const directPackages = trip ? packages.filter(pkg => pkg.matched_trip_id === trip?.id) : [];

  useEffect(() => {
    if (!trip || !isOpen) {
      setBiddingAssignments([]);
      return;
    }
    const fetchBiddingAssignments = async () => {
      setLoadingBids(true);
      const { data } = await supabase
        .from('package_assignments')
        .select(`
          id, package_id, status, admin_assigned_tip, quote,
          packages:package_id (id, item_description, estimated_price, purchase_origin, package_destination, user_id, status, updated_at)
        `)
        .eq('trip_id', trip.id)
        .in('status', ['bid_pending', 'bid_submitted']);
      setBiddingAssignments((data as any) || []);
      setLoadingBids(false);
    };
    fetchBiddingAssignments();
  }, [trip?.id, isOpen]);

  if (!trip) return null;

  const completedPackages = directPackages.filter(pkg => ['delivered_to_office', 'completed'].includes(pkg.status));
  const totalConfirmedValue = directPackages.reduce((sum, pkg) => sum + (Number(pkg.estimated_price) || 0), 0);
  const totalConfirmedTips = directPackages.reduce((sum, pkg) => {
    const quote = pkg.quote as any;
    return sum + Number(quote?.price || pkg.admin_assigned_tip || 0);
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
                  <div className="text-2xl font-bold text-primary">{directPackages.length}</div>
                  <div className="text-sm text-muted-foreground">Confirmados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{biddingAssignments.length}</div>
                  <div className="text-sm text-muted-foreground">En Competencia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedPackages.length}</div>
                  <div className="text-sm text-muted-foreground">Completados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">Q{totalConfirmedTips.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Tips Confirmados</div>
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

          {/* Section 1: Confirmed Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4" />
                Paquetes Confirmados
                <Badge variant="default" className="ml-1">{directPackages.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {directPackages.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <PackageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No hay paquetes confirmados en este viaje</p>
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
                    {directPackages.map((pkg) => {
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
                          <TableCell>{getStatusBadge(pkg.status)}</TableCell>
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

          {/* Section 2: Bidding Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                Paquetes en Competencia
                <Badge variant="warning" className="ml-1">{biddingAssignments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBids ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
                  <p>Cargando asignaciones...</p>
                </div>
              ) : biddingAssignments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No hay paquetes en competencia</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Estado Bid</TableHead>
                      <TableHead>Valor Est.</TableHead>
                      <TableHead>Tip Asignado</TableHead>
                      <TableHead>Última Actualización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {biddingAssignments.map((assignment) => {
                      const pkg = assignment.packages;
                      if (!pkg) return null;
                      const tipAmount = assignment.quote?.price || assignment.admin_assigned_tip || 0;

                      return (
                        <TableRow key={assignment.id}>
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
                            <Badge variant="warning" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              {assignment.status === 'bid_pending' ? 'Pendiente' : 'Enviado'}
                            </Badge>
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
