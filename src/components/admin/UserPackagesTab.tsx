import { useState } from "react";
import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Package as PackageIcon, Edit, Eye, ExternalLink, MapPin, Calendar, Loader2 } from "lucide-react";
import ProductDetailsModal from "@/components/dashboard/ProductDetailsModal";

interface UserPackagesTabProps {
  packages: Package[];
  loadingPackages?: boolean;
}

const UserPackagesTab = ({ packages, loadingPackages = false }: UserPackagesTabProps) => {
  const { getStatusBadge } = useStatusHelpers();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const handleViewDetails = (pkg: Package) => {
    setSelectedPackage(pkg);
  };

  const handleEditPackage = (pkg: Package) => {
    // Edit functionality would be implemented here
  };

  const handleViewDocument = (type: string, pkg: Package) => {
    // Document viewer would be implemented here
  };

  // Estados que se muestran con estilo especial (cancelados/rechazados)
  const cancelledStatuses = ['cancelled', 'rejected', 'quote_rejected', 'quote_expired'];
  const isCancelledStatus = (status: string) => cancelledStatuses.includes(status);

  if (loadingPackages) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>Cargando historial de pedidos...</p>
        </CardContent>
      </Card>
    );
  }

  if (packages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay pedidos registrados como comprador</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageIcon className="h-5 w-5" />
            Pedidos como Comprador ({packages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Origen → Destino</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow 
                  key={pkg.id} 
                  className={isCancelledStatus(pkg.status) ? 'opacity-60 bg-destructive/5' : ''}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {pkg.item_description || 'Sin descripción'}
                      </p>
                      {pkg.item_link && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <a href={pkg.item_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Ver producto
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(pkg.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {pkg.purchase_origin} → {pkg.package_destination}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(pkg.created_at), { addSuffix: true, locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      ${pkg.estimated_price || '--'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(pkg)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPackage && (
        <ProductDetailsModal
          isOpen={!!selectedPackage}
          onClose={() => setSelectedPackage(null)}
          pkg={selectedPackage}
        />
      )}

      {/* Document Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comprobantes de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {packages.filter(pkg => pkg.payment_receipt).length > 0 ? (
                packages.filter(pkg => pkg.payment_receipt).map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm truncate">Paquete #{pkg.id}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument('payment', pkg)}
                    >
                      Ver
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay comprobantes</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comprobantes de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {packages.filter(pkg => pkg.purchase_confirmation).length > 0 ? (
                packages.filter(pkg => pkg.purchase_confirmation).map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm truncate">Paquete #{pkg.id}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument('purchase', pkg)}
                    >
                      Ver
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay comprobantes</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información de Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {packages.filter(pkg => pkg.tracking_info).length > 0 ? (
                packages.filter(pkg => pkg.tracking_info).map(pkg => (
                  <div key={pkg.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm truncate">Paquete #{pkg.id}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument('tracking', pkg)}
                    >
                      Ver
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay tracking</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserPackagesTab;