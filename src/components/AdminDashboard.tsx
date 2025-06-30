
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plane, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'secondary' as const },
      'approved': { label: 'Aprobado', variant: 'default' as const },
      'matched': { label: 'Emparejado', variant: 'default' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_accepted': { label: 'Cotización aceptada', variant: 'default' as const },
      'address_confirmed': { label: 'Dirección confirmada', variant: 'default' as const },
      'paid': { label: 'Pagado', variant: 'default' as const },
      'purchased': { label: 'Comprado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered': { label: 'Entregado', variant: 'default' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleMatch = () => {
    if (selectedPackage && matchingTrip) {
      onMatchPackage(selectedPackage.id, parseInt(matchingTrip));
      toast({
        title: "¡Emparejamiento exitoso!",
        description: `Paquete ${selectedPackage.id} emparejado con viaje ${matchingTrip}`,
      });
      setSelectedPackage(null);
      setMatchingTrip("");
    }
  };

  const availableTrips = trips.filter(trip => trip.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona solicitudes, viajes y emparejamientos</p>
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
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{packages.filter(p => p.status === 'matched').length}</p>
                <p className="text-xs text-muted-foreground">Emparejamientos activos</p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="packages">Solicitudes</TabsTrigger>
          <TabsTrigger value="trips">Viajes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes pendientes de emparejamiento</CardTitle>
              <CardDescription>Solicitudes aprobadas esperando ser emparejadas con viajeros</CardDescription>
            </CardHeader>
            <CardContent>
              {packages.filter(p => p.status === 'approved').length === 0 ? (
                <p className="text-muted-foreground">No hay solicitudes pendientes de emparejamiento</p>
              ) : (
                <div className="space-y-2">
                  {packages.filter(p => p.status === 'approved').map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{pkg.itemDescription}</p>
                        <p className="text-sm text-muted-foreground">Precio: ${pkg.estimatedPrice}</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedPackage(pkg)}>
                            Emparejar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Emparejar solicitud</DialogTitle>
                            <DialogDescription>
                              Selecciona un viaje para emparejar con esta solicitud
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p className="font-medium">{selectedPackage?.itemDescription}</p>
                              <p className="text-sm text-muted-foreground">Precio: ${selectedPackage?.estimatedPrice}</p>
                            </div>
                            <Select value={matchingTrip} onValueChange={setMatchingTrip}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar viaje" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTrips.map(trip => (
                                  <SelectItem key={trip.id} value={trip.id.toString()}>
                                    {trip.fromCity} → {trip.toCity} - {new Date(trip.arrivalDate).toLocaleDateString()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button onClick={handleMatch} className="w-full">
                              Confirmar emparejamiento
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
                      </div>
                      {getStatusBadge(pkg.status)}
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
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
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
