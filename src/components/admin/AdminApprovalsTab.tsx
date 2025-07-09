import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye } from "lucide-react";

interface AdminApprovalsTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onApproveReject: (type: 'package' | 'trip', id: number, action: 'approve' | 'reject') => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminApprovalsTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onViewTripDetail, 
  onApproveReject, 
  getStatusBadge 
}: AdminApprovalsTabProps) => {
  const [activeTab, setActiveTab] = useState("packages");

  const pendingPackages = packages.filter(p => p.status === 'pending_approval');
  const pendingTrips = trips.filter(t => t.status === 'pending_approval');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{pendingPackages.length}</div>
              <div className="text-xs text-muted-foreground">Solicitudes Pendientes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{pendingTrips.length}</div>
              <div className="text-xs text-muted-foreground">Viajes Pendientes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages" className="relative">
            📦 Solicitudes
            {pendingPackages.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingPackages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trips" className="relative">
            ✈️ Viajes
            {pendingTrips.length > 0 && (
              <Badge variant="secondary" className="ml-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs px-1.5">
                {pendingTrips.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Pendientes de Aprobación</CardTitle>
              <CardDescription>Revisa y aprueba las nuevas solicitudes de paquetes</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPackages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">No hay solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPackages.map(pkg => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">
                            {pkg.products && pkg.products.length > 0 
                              ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                              : pkg.itemDescription
                            }
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {pkg.products && pkg.products.length > 0 
                              ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)} • Usuario: ${pkg.userId}`
                              : `Precio: ${pkg.estimatedPrice} • Usuario: ${pkg.userId}`
                            }
                          </p>
                        </div>
                        {getStatusBadge(pkg.status)}
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewPackageDetail(pkg)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => onApproveReject('package', pkg.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onApproveReject('package', pkg.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Viajes Pendientes de Aprobación</CardTitle>
              <CardDescription>Revisa y aprueba los nuevos registros de viajes</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTrips.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-muted-foreground">No hay viajes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTrips.map(trip => (
                    <div key={trip.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{trip.fromCity} → {trip.toCity}</h4>
                          <p className="text-sm text-muted-foreground">
                            Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • 
                            Espacio: {trip.availableSpace}kg • Usuario: {trip.userId}
                          </p>
                        </div>
                        {getStatusBadge(trip.status)}
                      </div>
                      
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewTripDetail(trip)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => onApproveReject('trip', trip.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => onApproveReject('trip', trip.id, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminApprovalsTab;