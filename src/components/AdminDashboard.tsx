import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plane, Users, CheckCircle, XCircle, AlertCircle, Eye, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PackageDetailModal from "./admin/PackageDetailModal";
import TripDetailModal from "./admin/TripDetailModal";

interface AdminDashboardProps {
  packages: any[];
  trips: any[];
  onMatchPackage: (packageId: number, tripId: number) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: number, status: string) => void;
  onApproveReject: (type: 'package' | 'trip', id: number, action: 'approve' | 'reject') => void;
}

const AdminDashboard = ({ 
  packages, 
  trips, 
  onMatchPackage, 
  onUpdateStatus, 
  onApproveReject 
}: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [matchingTrip, setMatchingTrip] = useState<string>("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [selectedDetailPackage, setSelectedDetailPackage] = useState<any>(null);
  const [selectedDetailTrip, setSelectedDetailTrip] = useState<any>(null);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Match realizado', variant: 'default' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_accepted': { label: 'Cotización aceptada', variant: 'default' as const },
      'address_confirmed': { label: 'Dirección confirmada', variant: 'default' as const },
      'paid': { label: 'Pagado', variant: 'default' as const },
      'purchased': { label: 'Comprado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered': { label: 'Entregado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'active': { label: 'Activo', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleMatch = () => {
    if (selectedPackage && matchingTrip) {
      onMatchPackage(selectedPackage.id, parseInt(matchingTrip));
      toast({
        title: "¡Match exitoso!",
        description: `Paquete ${selectedPackage.id} emparejado con viaje ${matchingTrip}`,
      });
      setSelectedPackage(null);
      setMatchingTrip("");
      setShowMatchDialog(false);
    }
  };

  const handleOpenMatchDialog = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowMatchDialog(true);
  };

  const handleViewPackageDetail = (pkg: any) => {
    // Add mock user data for demo
    const packageWithUser = {
      ...pkg,
      user: {
        id: pkg.userId,
        name: `Usuario ${pkg.userId}`,
        email: `usuario${pkg.userId}@email.com`,
        phone: `+502 ${1000 + pkg.userId}-5678`,
        totalRequests: Math.floor(Math.random() * 10) + 1,
        completedRequests: Math.floor(Math.random() * 5)
      }
    };
    setSelectedDetailPackage(packageWithUser);
    setShowPackageDetail(true);
  };

  const handleViewTripDetail = (trip: any) => {
    // Add mock user data for demo
    const tripWithUser = {
      ...trip,
      user: {
        id: trip.userId,
        name: `Viajero ${trip.userId}`,
        email: `viajero${trip.userId}@email.com`,
        phone: `+502 ${2000 + trip.userId}-1234`,
        totalTrips: Math.floor(Math.random() * 8) + 1,
        completedDeliveries: Math.floor(Math.random() * 15)
      }
    };
    setSelectedDetailTrip(tripWithUser);
    setShowTripDetail(true);
  };

  // Filter trips that are approved and active for matching
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));
  const approvedPackages = packages.filter(p => p.status === 'approved');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona solicitudes, viajes y matches</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{packages.length}</p>
                <p className="text-xs text-muted-foreground">Solicitudes totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-accent" />
              <div>
                <p className="text-2xl font-bold">{trips.length}</p>
                <p className="text-xs text-muted-foreground">Viajes registrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.status === 'matched').length}</p>
                <p className="text-xs text-muted-foreground">Matches activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.status === 'delivered').length}</p>
                <p className="text-xs text-muted-foreground">Entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="packages">Solicitudes</TabsTrigger>
          <TabsTrigger value="trips">Viajes</TabsTrigger>
          <TabsTrigger value="matching">Matching y gestión</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes listas para Match</CardTitle>
              <CardDescription>Solicitudes aprobadas esperando ser emparejadas con viajeros</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedPackages.length === 0 ? (
                <p className="text-muted-foreground">No hay solicitudes pendientes de Match</p>
              ) : (
                <div className="space-y-2">
                  {approvedPackages.map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{pkg.itemDescription}</p>
                        <p className="text-sm text-muted-foreground">
                          Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          📦 Origen: {pkg.purchaseCountry || 'No especificado'} → 🎯 Destino: {pkg.packageDestination || 'Guatemala'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewPackageDetail(pkg)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenMatchDialog(pkg)}
                          disabled={availableTrips.length === 0}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Hacer Match
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {availableTrips.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">No hay viajes activos disponibles para hacer Match. Revisa la sección de Viajes para aprobar algunos.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New section for payment confirmations */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos pendientes de confirmación</CardTitle>
              <CardDescription>Solicitudes con comprobantes de pago que requieren revisión</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.filter(pkg => pkg.status === 'payment_pending').length === 0 ? (
                <p className="text-muted-foreground">No hay pagos pendientes de confirmación</p>
              ) : (
                <div className="space-y-2">
                  {packages.filter(pkg => pkg.status === 'payment_pending').map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{pkg.itemDescription}</p>
                        <p className="text-sm text-muted-foreground">
                          Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                        </p>
                        {pkg.paymentReceipt && (
                          <p className="text-xs text-blue-600 mt-1">
                            Comprobante: {pkg.paymentReceipt.filename} • 
                            Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewPackageDetail(pkg)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar Pago
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Solicitudes</CardTitle>
              <CardDescription>Todas las solicitudes de paquetes del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {packages.map(pkg => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{pkg.itemDescription}</h4>
                        <p className="text-sm text-muted-foreground">
                          Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                        </p>
                        {pkg.paymentReceipt && (
                          <p className="text-xs text-blue-600">
                            Comprobante de pago subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(pkg.status)}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewPackageDetail(pkg)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>

                      {pkg.status === 'pending_approval' && (
                        <>
                          <Button 
                            size="sm" 
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
                        </>
                      )}

                      {pkg.status === 'payment_pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar Pago
                        </Button>
                      )}
                      
                      {(pkg.status === 'paid' || pkg.status === 'purchased') && (
                        <Button 
                          size="sm" 
                          onClick={() => onUpdateStatus('package', pkg.id, 'in_transit')}
                        >
                          Marcar en tránsito
                        </Button>
                      )}
                      
                      {pkg.status === 'in_transit' && (
                        <Button 
                          size="sm" 
                          onClick={() => onUpdateStatus('package', pkg.id, 'delivered')}
                        >
                          Marcar como entregado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Viajes</CardTitle>
              <CardDescription>Todos los viajes registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trips.map(trip => (
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
                        onClick={() => handleViewTripDetail(trip)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>

                      {trip.status === 'pending_approval' && (
                        <>
                          <Button 
                            size="sm" 
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          {/* 1. Herramienta de Matching */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>📦 Solicitudes pendientes de Match</CardTitle>
                <CardDescription>Solicitudes aprobadas sin viaje asignado</CardDescription>
              </CardHeader>
              <CardContent>
                {approvedPackages.length === 0 ? (
                  <p className="text-muted-foreground">No hay solicitudes pendientes de Match</p>
                ) : (
                  <div className="space-y-2">
                    {approvedPackages.map(pkg => (
                      <div key={pkg.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{pkg.itemDescription}</p>
                            <p className="text-xs text-muted-foreground">
                              ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              📦 {pkg.purchaseCountry || 'No especificado'} → 🎯 {pkg.packageDestination || 'Guatemala'}
                            </p>
                            {pkg.deliveryDeadline && (
                              <p className="text-xs text-orange-600 mt-1">
                                📅 Límite: {new Date(pkg.deliveryDeadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenMatchDialog(pkg)}
                            disabled={availableTrips.length === 0}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Match
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>✈️ Viajes disponibles</CardTitle>
                <CardDescription>Viajes aprobados con espacio disponible</CardDescription>
              </CardHeader>
              <CardContent>
                {availableTrips.length === 0 ? (
                  <p className="text-muted-foreground">No hay viajes disponibles</p>
                ) : (
                  <div className="space-y-2">
                    {availableTrips.map(trip => (
                      <div key={trip.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">
                              {trip.fromCountry || 'País'} ({trip.fromCity}) → {trip.toCountry || 'Guatemala'} ({trip.toCity})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • {trip.availableSpace}kg
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              📅 Primer día paquetes: {trip.firstDayPackages ? new Date(trip.firstDayPackages).toLocaleDateString() : 'No especificado'}
                            </p>
                            <p className="text-xs text-red-600">
                              📅 Último día paquetes: {trip.lastDayPackages ? new Date(trip.lastDayPackages).toLocaleDateString() : 'No especificado'}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewTripDetail(trip)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 2. Matches activos */}
          <Card>
            <CardHeader>
              <CardTitle>🔗 Matches activos</CardTitle>
              <CardDescription>Seguimiento de todos los matches realizados</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.filter(pkg => pkg.matchedTripId).length === 0 ? (
                <p className="text-muted-foreground">No hay matches activos</p>
              ) : (
                <div className="space-y-3">
                  {packages.filter(pkg => pkg.matchedTripId).map(pkg => {
                    const matchedTrip = trips.find(trip => trip.id === pkg.matchedTripId);
                    return (
                      <div key={pkg.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{pkg.itemDescription}</h4>
                              {getStatusBadge(pkg.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Precio: ${pkg.estimatedPrice} • Shopper: {pkg.userId}
                            </p>
                            {matchedTrip && (
                              <p className="text-sm text-blue-600">
                                🔗 Match con viaje: {matchedTrip.fromCity} → {matchedTrip.toCity} (Viajero: {matchedTrip.userId})
                              </p>
                            )}
                            {pkg.quote && (
                              <p className="text-xs text-green-600 mt-1">
                                💰 Cotización: ${pkg.quote.totalPrice}
                              </p>
                            )}
                            {pkg.deliveryDeadline && (
                              <p className="text-xs text-orange-600 mt-1">
                                📅 Límite entrega: {new Date(pkg.deliveryDeadline).toLocaleDateString()}
                              </p>
                            )}
                            {matchedTrip?.deliveryDate && (
                              <p className="text-xs text-purple-600 mt-1">
                                📅 Entrega viajero: {new Date(matchedTrip.deliveryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewPackageDetail(pkg)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Gestión de pagos y comprobantes */}
          <Card>
            <CardHeader>
              <CardTitle>💳 Gestión de pagos</CardTitle>
              <CardDescription>Confirmación de pagos y revisión de comprobantes</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.filter(pkg => pkg.status === 'payment_pending' || pkg.paymentReceipt).length === 0 ? (
                <p className="text-muted-foreground">No hay pagos pendientes ni comprobantes</p>
              ) : (
                <div className="space-y-3">
                  {packages.filter(pkg => pkg.status === 'payment_pending' || pkg.paymentReceipt).map(pkg => (
                    <div key={pkg.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{pkg.itemDescription}</h4>
                            {getStatusBadge(pkg.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                          </p>
                          {pkg.paymentReceipt && (
                            <div className="mt-2 p-2 bg-blue-50 rounded">
                              <p className="text-xs text-blue-800 font-medium">Comprobante de pago:</p>
                              <p className="text-xs text-blue-600">
                                📄 {pkg.paymentReceipt.filename}
                              </p>
                              <p className="text-xs text-blue-600">
                                📅 Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewPackageDetail(pkg)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Comprobante
                          </Button>
                          {pkg.status === 'payment_pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirmar Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced Match Dialog with Country Information */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Hacer Match de solicitud</DialogTitle>
            <DialogDescription>
              Selecciona un viaje compatible para hacer match con esta solicitud
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPackage && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-medium text-blue-900">Solicitud seleccionada:</h4>
                <p className="text-sm text-blue-800">{selectedPackage.itemDescription}</p>
                <p className="text-xs text-blue-700">
                  Precio: ${selectedPackage.estimatedPrice}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">📦 Compra en:</span>
                    <span className="bg-blue-100 px-2 py-1 rounded">
                      {selectedPackage.purchaseCountry || 'No especificado'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">🎯 Envío a:</span>
                    <span className="bg-green-100 px-2 py-1 rounded">
                      {selectedPackage.packageDestination || 'Guatemala'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="matchingTrip">Seleccionar viaje compatible:</Label>
              <Select value={matchingTrip} onValueChange={setMatchingTrip}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar viaje" />
                </SelectTrigger>
                <SelectContent>
                  {availableTrips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {trip.fromCountry || 'País no especificado'} ({trip.fromCity}) → {trip.toCountry || 'Guatemala'} ({trip.toCity})
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • Espacio: {trip.availableSpace}kg
                        </span>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs bg-blue-100 px-1 rounded">
                            ✈️ Desde: {trip.fromCountry || 'País no especificado'}
                          </span>
                          <span className="text-xs bg-green-100 px-1 rounded">
                            🏠 Hacia: {trip.toCountry || 'Guatemala'}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleMatch} 
                className="flex-1"
                disabled={!matchingTrip}
              >
                <Zap className="h-4 w-4 mr-1" />
                Confirmar Match
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowMatchDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Package Detail Modal */}
      <PackageDetailModal
        package={selectedDetailPackage}
        isOpen={showPackageDetail}
        onClose={() => setShowPackageDetail(false)}
        onApprove={(id) => {
          onApproveReject('package', id, 'approve');
          setShowPackageDetail(false);
        }}
        onReject={(id) => {
          onApproveReject('package', id, 'reject');
          setShowPackageDetail(false);
        }}
      />

      {/* Trip Detail Modal */}
      <TripDetailModal
        trip={selectedDetailTrip}
        isOpen={showTripDetail}
        onClose={() => setShowTripDetail(false)}
        onApprove={(id) => {
          onApproveReject('trip', id, 'approve');
          setShowTripDetail(false);
        }}
        onReject={(id) => {
          onApproveReject('trip', id, 'reject');
          setShowTripDetail(false);
        }}
      />
    </div>
  );
};

export default AdminDashboard;
