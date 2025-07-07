import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { usePendingActions } from "@/hooks/usePendingActions";
import PackageDetailModal from "./admin/PackageDetailModal";
import TripDetailModal from "./admin/TripDetailModal";
import AdminStatsOverview from "./admin/AdminStatsOverview";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminPackagesTab from "./admin/AdminPackagesTab";
import AdminTripsTab from "./admin/AdminTripsTab";
import AdminMatchingTab from "./admin/AdminMatchingTab";
import FinancialDashboard from "./admin/FinancialDashboard";

import AdminMatchDialog from "./admin/AdminMatchDialog";

interface AdminDashboardProps {
  packages: any[];
  trips: any[];
  currentUser?: any;
  onMatchPackage: (packageId: number, tripId: number) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: number, status: string) => void;
  onApproveReject: (type: 'package' | 'trip', id: number, action: 'approve' | 'reject') => void;
  onConfirmOfficeReception: (packageId: number) => void;
  onLoadTestData?: () => void;
}

const AdminDashboard = ({ 
  packages, 
  trips, 
  currentUser,
  onMatchPackage, 
  onUpdateStatus, 
  onApproveReject,
  onConfirmOfficeReception,
  onLoadTestData
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
      'received_by_traveler': { label: 'Recibido por viajero', variant: 'default' as const },
      'delivered_to_office': { label: 'Entregado en oficina Favorón', variant: 'default' as const },
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

  // Use centralized pending actions hook for consistent notification badges
  const pendingActions = usePendingActions(packages, trips, currentUser);
  const { paymentsToConfirm, approvalsNeeded, packageApprovalsNeeded, tripApprovalsNeeded, unmatchedPackages } = pendingActions;
  const matchingTotal = paymentsToConfirm + unmatchedPackages;
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona solicitudes, viajes y matches</p>
        </div>
        {onLoadTestData && (
          <button
            onClick={onLoadTestData}
            className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            title="Cargar datos de prueba"
          >
            🧪 Test Data
          </button>
        )}
      </div>

      <AdminStatsOverview packages={packages} trips={trips} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="relative flex items-center gap-2">
            Resumen
            {(approvalsNeeded + paymentsToConfirm) > 0 && (
              <NotificationBadge count={approvalsNeeded + paymentsToConfirm} />
            )}
          </TabsTrigger>
          <TabsTrigger value="packages" className="relative flex items-center gap-2">
            Solicitudes
            {packageApprovalsNeeded > 0 && (
              <NotificationBadge count={packageApprovalsNeeded} />
            )}
          </TabsTrigger>
          <TabsTrigger value="trips" className="relative flex items-center gap-2">
            Viajes
            {tripApprovalsNeeded > 0 && (
              <NotificationBadge count={tripApprovalsNeeded} />
            )}
          </TabsTrigger>
          <TabsTrigger value="matching" className="relative flex items-center gap-2">
            Matching y gestión
            {matchingTotal > 0 && (
              <NotificationBadge count={matchingTotal} />
            )}
          </TabsTrigger>
          <TabsTrigger value="financial" className="relative flex items-center gap-2">
            💰 Financiero
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AdminOverviewTab 
            packages={packages}
            trips={trips}
            onViewPackageDetail={handleViewPackageDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onUpdateStatus={onUpdateStatus}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialDashboard packages={packages} />
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <AdminPackagesTab 
            packages={packages}
            onViewPackageDetail={handleViewPackageDetail}
            onApproveReject={onApproveReject}
            onUpdateStatus={onUpdateStatus}
            onConfirmOfficeReception={onConfirmOfficeReception}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <AdminTripsTab 
            trips={trips}
            onViewTripDetail={handleViewTripDetail}
            onApproveReject={onApproveReject}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <AdminMatchingTab 
            packages={packages}
            trips={trips}
            onViewPackageDetail={handleViewPackageDetail}
            onViewTripDetail={handleViewTripDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onUpdateStatus={onUpdateStatus}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

      </Tabs>

      <AdminMatchDialog 
        showMatchDialog={showMatchDialog}
        setShowMatchDialog={setShowMatchDialog}
        selectedPackage={selectedPackage}
        matchingTrip={matchingTrip}
        setMatchingTrip={setMatchingTrip}
        availableTrips={availableTrips}
        onMatch={handleMatch}
      />

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
