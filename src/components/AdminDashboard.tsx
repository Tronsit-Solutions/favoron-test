
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PackageDetailModal from "./admin/PackageDetailModal";
import TripDetailModal from "./admin/TripDetailModal";
import AdminStats from "./admin/AdminStats";
import AdminOverview from "./admin/AdminOverview";
import AdminMatchDialog from "./admin/AdminMatchDialog";

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

  const handleConfirmPayment = (packageId: number) => {
    onUpdateStatus('package', packageId, 'payment_confirmed');
  };

  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona solicitudes, viajes y matches</p>
        </div>
      </div>

      <AdminStats packages={packages} trips={trips} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="packages">Solicitudes</TabsTrigger>
          <TabsTrigger value="trips">Viajes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AdminOverview
            packages={packages}
            trips={trips}
            onViewPackageDetail={handleViewPackageDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onConfirmPayment={handleConfirmPayment}
            availableTrips={availableTrips}
          />
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
      </Tabs>

      <AdminMatchDialog
        isOpen={showMatchDialog}
        onClose={() => setShowMatchDialog(false)}
        selectedPackage={selectedPackage}
        matchingTrip={matchingTrip}
        setMatchingTrip={setMatchingTrip}
        availableTrips={availableTrips}
        onMatch={handleMatch}
      />

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
