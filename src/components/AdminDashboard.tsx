import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useRealtimePackages } from "@/hooks/useRealtimePackages";
import PackageDetailModal from "./admin/PackageDetailModal";
import TripDetailModal from "./admin/TripDetailModal";
import AdminStatsOverview from "./admin/AdminStatsOverview";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminApprovalsTab from "./admin/AdminApprovalsTab";
import AdminPackagesTab from "./admin/AdminPackagesTab";
import AdminTripsTab from "./admin/AdminTripsTab";
import AdminPaymentsTab from "./admin/AdminPaymentsTab";
import AdminTravelerPaymentsTab from "./admin/AdminTravelerPaymentsTab";
import AdminMatchingTab from "./admin/AdminMatchingTab";
import FinancialDashboard from "./admin/FinancialDashboard";
import MonthlyReportsTab from "./admin/MonthlyReportsTab";
import AdminSupportTab from "./admin/AdminSupportTab";
import PendingOfficeConfirmationsTab from "./admin/PendingOfficeConfirmationsTab";

import AdminMatchDialog from "./admin/AdminMatchDialog";
import AdminActionsModal from "./admin/AdminActionsModal";

interface AdminDashboardProps {
  packages: any[];
  trips: any[];
  currentUser?: any;
  onMatchPackage: (packageId: string, tripId: string) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject') => void;
  onConfirmOfficeReception: (packageId: string) => void;
  onAdminConfirmOfficeDelivery: (packageId: string) => void;
  onConfirmDeliveryComplete: (packageId: string) => void;
  onConfirmShopperReceived: (packageId: string) => void;
  onDiscardPackage: (pkg: any) => void;
}

const AdminDashboard = ({ 
  packages, 
  trips, 
  currentUser,
  onMatchPackage, 
  onUpdateStatus, 
  onApproveReject,
  onConfirmOfficeReception,
  onAdminConfirmOfficeDelivery,
  onConfirmDeliveryComplete,
  onConfirmShopperReceived,
  onDiscardPackage
}: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [matchingTrip, setMatchingTrip] = useState<string>("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [selectedDetailPackage, setSelectedDetailPackage] = useState<any>(null);
  const [selectedDetailTrip, setSelectedDetailTrip] = useState<any>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedActionsPackage, setSelectedActionsPackage] = useState<any>(null);
  const { toast } = useToast();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'warning' as const },
      'approved': { label: 'Aprobado', variant: 'success' as const },
      'matched': { label: 'Match realizado', variant: 'success' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_accepted': { label: 'Cotización aceptada', variant: 'default' as const },
      'address_confirmed': { label: 'Dirección confirmada', variant: 'default' as const },
      'paid': { label: 'Pagado', variant: 'default' as const },
      'purchased': { label: 'Comprado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered': { label: 'Entregado', variant: 'success' as const },
      'received_by_traveler': { label: 'Recibido por viajero', variant: 'default' as const },
      'delivered_to_office': { label: 'Entregado en oficina Favorón', variant: 'success' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'active': { label: 'Activo', variant: 'success' as const },
      'completed_paid': { label: 'Completado y Pagado', variant: 'success' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleMatch = () => {
    if (selectedPackage && matchingTrip) {
      onMatchPackage(selectedPackage.id, matchingTrip);
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
    // Extract multiple products information if stored in additional_notes
    let products = null;
    let originalNotes = pkg.additional_notes;
    
    try {
      if (pkg.additional_notes && typeof pkg.additional_notes === 'string') {
        const parsedNotes = JSON.parse(pkg.additional_notes);
        if (parsedNotes.products && Array.isArray(parsedNotes.products)) {
          products = parsedNotes.products;
          originalNotes = parsedNotes.originalNotes;
        }
      }
    } catch (error) {
      // If parsing fails, treat as regular notes
      console.log('Notes are not JSON, treating as regular notes');
    }
    
    // Add mock user data for demo
    const packageWithUser = {
      ...pkg,
      products: products, // Add products array to the package
      additional_notes: originalNotes, // Use original notes without JSON structure
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
  
  // Set up real-time notifications for document uploads
  useRealtimePackages({
    userRole: 'admin'
  });
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona solicitudes, viajes y matches</p>
        </div>
      </div>

      <AdminStatsOverview packages={packages} trips={trips} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="relative flex items-center gap-2">
            Resumen
            {(approvalsNeeded + paymentsToConfirm) > 0 && (
              <NotificationBadge count={approvalsNeeded + paymentsToConfirm} />
            )}
          </TabsTrigger>
          <TabsTrigger value="approvals" className="relative flex items-center gap-2">
            Aprobaciones
            {approvalsNeeded > 0 && (
              <NotificationBadge count={approvalsNeeded} />
            )}
          </TabsTrigger>
          <TabsTrigger value="matching" className="relative flex items-center gap-2">
            Gestión
            {(matchingTotal + packages.filter(p => p.status === 'pending_office_confirmation').length) > 0 && (
              <NotificationBadge count={matchingTotal + packages.filter(p => p.status === 'pending_office_confirmation').length} />
            )}
          </TabsTrigger>
          <TabsTrigger value="traveler-payments" className="relative flex items-center gap-2">
            Pagos Viajeros
          </TabsTrigger>
          <TabsTrigger value="support" className="relative flex items-center gap-2">
            🔍 Soporte
            {packages.filter(p => p.incident_flag).length > 0 && (
              <NotificationBadge count={packages.filter(p => p.incident_flag).length} />
            )}
          </TabsTrigger>
          <TabsTrigger value="financial" className="relative flex items-center gap-2">
            Financiero
          </TabsTrigger>
          <TabsTrigger value="reports" className="relative flex items-center gap-2">
            Reportes
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

        <TabsContent value="approvals" className="space-y-4">
          <AdminApprovalsTab 
            packages={packages}
            trips={trips}
            onViewPackageDetail={handleViewPackageDetail}
            onViewTripDetail={handleViewTripDetail}
            onApproveReject={onApproveReject}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialDashboard packages={packages} />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <AdminMatchingTab 
            packages={packages}
            trips={trips}
            onViewPackageDetail={handleViewPackageDetail}
            onViewTripDetail={handleViewTripDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onDiscardPackage={onDiscardPackage}
            onUpdateStatus={onUpdateStatus}
            onConfirmOfficeReception={onConfirmOfficeReception}
            onConfirmDeliveryComplete={onConfirmDeliveryComplete}
            onAdminConfirmOfficeDelivery={onAdminConfirmOfficeDelivery}
            onConfirmShopperReceived={onConfirmShopperReceived}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="traveler-payments" className="space-y-4">
          <AdminTravelerPaymentsTab />
        </TabsContent>


        <TabsContent value="support" className="space-y-4">
          <AdminSupportTab 
            packages={packages}
            trips={trips}
            onViewPackageDetail={handleViewPackageDetail}
            onOpenActionsModal={(pkg) => {
              setSelectedActionsPackage(pkg);
              setShowActionsModal(true);
            }}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <MonthlyReportsTab />
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

      {/* Actions Modal */}
      <AdminActionsModal
        package={selectedActionsPackage}
        trips={trips}
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        onRefresh={() => window.location.reload()}
      />

      {/* Package Detail Modal */}
      <PackageDetailModal
        package={selectedDetailPackage}
        trips={trips}
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
