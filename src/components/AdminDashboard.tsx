import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useConsolidatedRealtimeAdmin } from "@/hooks/useConsolidatedRealtimeAdmin";
import { useRefreshTracker } from "@/hooks/useRefreshTracker";
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalProtection } from "@/hooks/useModalProtection";
import { useModalState } from "@/contexts/ModalStateContext";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import PackageDetailModal from "./admin/PackageDetailModal";
import TripDetailModal from "./admin/TripDetailModal";
import AdminStatsOverview from "./admin/AdminStatsOverview";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminApprovalsTab from "./admin/AdminApprovalsTab";
import AdminPackagesTab from "./admin/AdminPackagesTab";
import AdminTripsTab from "./admin/AdminTripsTab";

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
  onMatchPackage: (packageId: string, tripId: string, adminTip?: number, productsWithTips?: any[]) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject', reason?: string) => void;
  onPaymentApproval: (packageId: string, action: 'approve' | 'reject') => void;
  onConfirmOfficeReception: (packageId: string) => void;
  onAdminConfirmOfficeDelivery: (packageId: string) => void;
  onConfirmDeliveryComplete: (packageId: string) => void;
  onConfirmShopperReceived: (packageId: string) => void;
  onDiscardPackage: (pkg: any) => void;
  onUpdatePackage: (id: string, updates: any) => void;
  onRefreshPackages?: () => void;
  refreshAdminData?: () => Promise<void>;
}

const AdminDashboard = ({ 
  packages, 
  trips, 
  currentUser,
  onMatchPackage, 
  onUpdateStatus, 
  onApproveReject,
  onPaymentApproval,
  onConfirmOfficeReception,
  onAdminConfirmOfficeDelivery,
  onConfirmDeliveryComplete,
  onConfirmShopperReceived,
  onDiscardPackage,
  onUpdatePackage,
  onRefreshPackages,
  refreshAdminData,
  matchingTab,
  onMatchingTabChange,
  unreadCounts = {},
  markPackageMessagesAsRead
}: AdminDashboardProps & { 
  matchingTab?: string; 
  onMatchingTabChange?: (tab: string) => void;
  unreadCounts?: { [packageId: string]: number };
  markPackageMessagesAsRead?: (packageId: string) => Promise<void>;
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [matchingTrip, setMatchingTrip] = useState<string>("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [localPackages, setLocalPackages] = useState(packages);
  const [localTrips, setLocalTrips] = useState(trips);
  const [modalDataCache, setModalDataCache] = useState<{ selectedPackage: any; matchedTrip: any } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { openModal } = useModalState();
  const { hasOpenModals } = useModalProtection();
  
  
  // Snapshot mechanism for modal protection
  const pendingSnapshotRef = useRef<{ packages: any[]; trips: any[] } | null>(null);
  const modalStateRef = useRef(false);

  // Improved snapshot synchronization to prevent emptying
  useEffect(() => {
    const hasModalsOpen = hasOpenModals();
    
    // Detect modal state changes
    if (modalStateRef.current !== hasModalsOpen) {
      modalStateRef.current = hasModalsOpen;
      
      if (!hasModalsOpen && pendingSnapshotRef.current) {
        // Modal closed - apply pending snapshot
        console.log('🔓 Modals closed - applying pending snapshot:', {
          pendingPackages: pendingSnapshotRef.current.packages.length,
          pendingTrips: pendingSnapshotRef.current.trips.length
        });
        
        setLocalPackages(pendingSnapshotRef.current.packages);
        setLocalTrips(pendingSnapshotRef.current.trips);
        pendingSnapshotRef.current = null;
        
        // Process any queued realtime updates after a short delay
        setTimeout(() => {
          console.log('⏰ Processing queued updates after snapshot flush');
          processQueuedUpdates();
        }, 200);
        
        return;
      }
    }

    // Prevent emptying during refresh - only update if new data is meaningful
    if (!hasModalsOpen) {
      // No modals open - apply updates directly but protect against emptying
      if (packages.length > 0 || localPackages.length === 0) {
        console.log('🔄 Direct update - packages:', packages.length, 'local:', localPackages.length);
        setLocalPackages(packages);
      }
      if (trips.length > 0 || localTrips.length === 0) {
        console.log('🔄 Direct update - trips:', trips.length, 'local:', localTrips.length);
        setLocalTrips(trips);
      }
    } else {
      // Modals open - save to pending snapshot only if data is meaningful
      if (packages.length > 0 || trips.length > 0) {
        console.log('💾 Modals open - saving to pending snapshot:', {
          packages: packages.length,
          trips: trips.length
        });
        pendingSnapshotRef.current = { packages, trips };
      }
    }
  }, [packages, trips, hasOpenModals, localPackages.length, localTrips.length]);

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
    
    const config = statusMap[status as keyof typeof statusMap] || { label: getStatusLabel(status), variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleMatch = async (adminTip?: number, productsWithTips?: any[]) => {
    if (selectedPackage && matchingTrip) {
      if (!adminTip || adminTip <= 0) {
        toast({
          title: "Tip requerido",
          description: "Debes asignar un tip al viajero para confirmar el match.",
          variant: "destructive",
        });
        return;
      }

      // Show loading toast
      toast({
        title: "Procesando match...",
        description: "Actualizando los datos del paquete y viaje.",
      });

      try {
        // Apply optimistic update first for immediate UI feedback
        console.log('🚀 Applying optimistic match update...');
        setLocalPackages(prevPackages => 
          prevPackages.map(pkg => 
            pkg.id === selectedPackage.id ? {
              ...pkg,
              status: 'matched',
              matched_trip_id: matchingTrip,
              admin_assigned_tip: adminTip,
              matched_assignment_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString()
            } : pkg
          )
        );

        // Execute the match in the background
        await onMatchPackage(selectedPackage.id, matchingTrip, adminTip, productsWithTips);
        
        // Force refresh admin data to ensure consistency
        console.log('🔄 Forcing admin data refresh after match...');
        if (refreshAdminData) {
          setTimeout(async () => {
            await refreshAdminData();
          }, 500);
        }
        
        const isMultiProduct = productsWithTips && productsWithTips.length > 1;
        toast({
          title: "¡Match exitoso!",
          description: isMultiProduct 
            ? `Paquete ${selectedPackage.id} emparejado con viaje ${matchingTrip} con tips por producto (Total: Q${adminTip})`
            : `Paquete ${selectedPackage.id} emparejado con viaje ${matchingTrip} con tip de Q${adminTip}`,
        });
        
        setSelectedPackage(null);
        setMatchingTrip("");
        setShowMatchDialog(false);
      } catch (error) {
        console.error('Error during match:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al procesar el match. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenMatchDialog = (pkg: any) => {
    // Cache modal data when opening
    const matchedTrip = pkg.matched_trip_id ? localTrips.find(t => t.id === pkg.matched_trip_id) : null;
    console.log('💾 Caching modal data:', { package: pkg.id, trip: matchedTrip?.id });
    setModalDataCache({ selectedPackage: pkg, matchedTrip });
    setSelectedPackage(pkg);
    setShowMatchDialog(true);
  };

  const handleViewPackageDetail = (pkg: any) => {
    // Extract products from products_data (main) or fallback to additional_notes (legacy)
    let products = null;
    let originalNotes = pkg.additional_notes;
    let isMultipleProducts = false;
    
    console.log('🔍 Package data for detail modal:', {
      products_data: pkg.products_data,
      additional_notes: pkg.additional_notes,
      item_description: pkg.item_description,
      item_link: pkg.item_link,
      estimated_price: pkg.estimated_price
    });
    
    // PRIORITY 1: Try to use products_data (main source for modern packages)
    try {
      if (pkg.products_data) {
        let parsedProducts = null;
        
        if (typeof pkg.products_data === 'string') {
          parsedProducts = JSON.parse(pkg.products_data);
        } else if (typeof pkg.products_data === 'object') {
          parsedProducts = pkg.products_data;
        }
        
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          products = parsedProducts;
          isMultipleProducts = parsedProducts.length > 1;
          console.log('✅ Using products from products_data:', { 
            count: products.length, 
            isMultiple: isMultipleProducts,
            products 
          });
        }
      }
    } catch (error) {
      console.log('❌ Error parsing products_data:', error);
    }
    
    // PRIORITY 2: Fallback to additional_notes (legacy multi-product format)
    if (!products) {
      try {
        if (pkg.additional_notes && typeof pkg.additional_notes === 'string') {
          const parsedNotes = JSON.parse(pkg.additional_notes);
          if (parsedNotes.products && Array.isArray(parsedNotes.products)) {
            products = parsedNotes.products;
            originalNotes = parsedNotes.originalNotes;
            isMultipleProducts = parsedNotes.products.length > 1;
            console.log('✅ Using products from additional_notes (legacy):', { 
              count: products.length, 
              isMultiple: isMultipleProducts,
              products 
            });
          }
        }
      } catch (error) {
        console.log('❌ Error parsing additional_notes:', error);
      }
    }
    
    // PRIORITY 3: Final fallback for genuinely old single-product packages
    if (!products && (pkg.item_description || pkg.item_link || pkg.estimated_price)) {
      products = [{
        itemDescription: pkg.item_description || 'Producto sin descripción',
        estimatedPrice: pkg.estimated_price || '0',
        itemLink: pkg.item_link || null,
        quantity: '1'
      }];
      isMultipleProducts = false;
      console.log('✅ Created product from legacy fields (single product fallback):', products);
    }
    
    // Log final decision
    if (isMultipleProducts) {
      console.log('🎯 MULTIPLE PRODUCTS DETECTED - Using products_data, ignoring legacy fields');
    } else {
      console.log('🎯 Single product package detected');
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
    
    const modalId = 'package-detail';
    console.log('📦 Opening package modal:', { modalId, packageWithUser });
    openModal(modalId, 'package-detail', packageWithUser);
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
    
    const modalId = 'trip-detail';
    console.log('✈️ Opening trip modal:', { modalId, tripWithUser });
    openModal(modalId, 'trip-detail', tripWithUser);
  };

  // Use local state for all filtering to prevent props refreshes from affecting UI
  const availableTrips = localTrips.filter(trip => ['approved', 'active'].includes(trip.status));
  const approvedPackages = localPackages.filter(p => p.status === 'approved');

  // Use local state for consistent notification badges
  const pendingActions = usePendingActions(localPackages, localTrips, currentUser);
  const { paymentsToConfirm, approvalsNeeded, packageApprovalsNeeded, tripApprovalsNeeded, unmatchedPackages } = pendingActions;
  const matchingTotal = paymentsToConfirm + unmatchedPackages;
  
  // Get payment orders to count pending traveler payments
  const { paymentOrders } = usePaymentOrders();
  const pendingTravelerPayments = paymentOrders.filter(order => order.status === 'pending').length;
  
  // Setup consolidated real-time with complete modal protection
  const { isRealtimePaused, queuedUpdates, processQueuedUpdates } = useConsolidatedRealtimeAdmin({
    onPackageUpdate: setLocalPackages,
    onTripUpdate: setLocalTrips,
    packages: localPackages,
    trips: localTrips,
    userRole: 'admin',
    enabled: true
  });
  
  // Create tabs array for mobile and desktop tabs
  const adminTabs = [
    {
      value: "overview",
      label: "Resumen",
      badge: (approvalsNeeded + paymentsToConfirm) > 0 ? <NotificationBadge count={approvalsNeeded + paymentsToConfirm} /> : undefined
    },
    {
      value: "approvals",
      label: "Aprobaciones",
      badge: approvalsNeeded > 0 ? <NotificationBadge count={approvalsNeeded} /> : undefined
    },
    {
      value: "matching",
      label: "Gestión",
      badge: (matchingTotal + localPackages.filter(p => p.status === 'pending_office_confirmation').length + paymentsToConfirm + pendingActions.rejectedByTravelers) > 0 ? <NotificationBadge count={matchingTotal + localPackages.filter(p => p.status === 'pending_office_confirmation').length + paymentsToConfirm + pendingActions.rejectedByTravelers} /> : undefined
    },
    {
      value: "traveler-payments",
      label: "Pagos Viajeros",
      badge: pendingTravelerPayments > 0 ? <NotificationBadge count={pendingTravelerPayments} /> : undefined
    },
    {
      value: "support",
      label: "🔍 Soporte",
      badge: localPackages.filter(p => p.incident_flag).length > 0 ? <NotificationBadge count={localPackages.filter(p => p.incident_flag).length} /> : undefined
    },
    {
      value: "financial",
      label: "Financiero",
      badge: undefined
    },
    {
      value: "reports",
      label: "Reportes",
      badge: undefined
    }
  ];
  

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground">Gestiona solicitudes, viajes y matches</p>
        </div>
      </div>

      <AdminStatsOverview packages={localPackages} trips={localTrips} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {isMobile ? (
          <MobileTabs
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={adminTabs}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-7">
                {adminTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative flex items-center gap-2"
                  >
                    {tab.label}
                    {tab.badge}
                  </TabsTrigger>
                ))}
              </TabsList>
              
            </div>
          </div>
        )}

        <TabsContent value="overview" className="space-y-4">
          <AdminOverviewTab 
            packages={localPackages}
            trips={localTrips}
            onViewPackageDetail={handleViewPackageDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onUpdateStatus={onUpdateStatus}
            onApproveReject={onApproveReject}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <AdminApprovalsTab 
            packages={localPackages}
            trips={localTrips}
            onViewPackageDetail={handleViewPackageDetail}
            onViewTripDetail={handleViewTripDetail}
            onApproveReject={onApproveReject}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialDashboard packages={localPackages} />
        </TabsContent>

        <TabsContent value="matching" className="space-y-4">
          <AdminMatchingTab
            packages={localPackages}
            trips={localTrips}
            modalDataCache={modalDataCache}
            activeMatchingTab={matchingTab}
            onMatchingTabChange={onMatchingTabChange}
            onViewPackageDetail={handleViewPackageDetail}
            onViewTripDetail={handleViewTripDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onDiscardPackage={onDiscardPackage}
            onUpdateStatus={onUpdateStatus}
            onConfirmReception={onConfirmOfficeReception}
            onConfirmDelivery={onConfirmDeliveryComplete}
            onAdminConfirmOfficeDelivery={onAdminConfirmOfficeDelivery}
            onConfirmShopperReceived={onConfirmShopperReceived}
            onOpenActionsModal={(packageId: string) => {
              const pkg = localPackages.find(p => p.id === packageId);
              if (pkg) {
                openModal("admin-actions-matches", 'admin-actions', pkg);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="traveler-payments" className="space-y-4">
          <AdminTravelerPaymentsTab />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <AdminSupportTab 
            packages={localPackages}
            trips={localTrips}
            onViewPackageDetail={handleViewPackageDetail}
            onOpenActionsModal={(pkg) => {
              const modalId = `admin-actions-${pkg.id}`;
              openModal(modalId, 'admin-actions', pkg);
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
          packages={localPackages}
          onMatch={handleMatch}
        />

      {/* Single AdminActionsModal that can handle different modal IDs */}
      <AdminActionsModal
        modalId="admin-actions"
        trips={localTrips}
        onRefresh={() => {
          console.log('🔄 AdminActionsModal refresh requested - using incremental update');
          if (!hasOpenModals()) {
            processQueuedUpdates();
          } else {
            console.log('📱 Refresh blocked by open modals - will process when modals close');
          }
        }}
      />
      
      {/* Additional modal instance for dynamic package actions from Matches tab */}
      <AdminActionsModal
        modalId="admin-actions-matches"
        trips={localTrips}
        onRefresh={() => {
          console.log('🔄 AdminActionsModal refresh requested - using incremental update');
          if (!hasOpenModals()) {
            processQueuedUpdates();
          } else {
            console.log('📱 Refresh blocked by open modals - will process when modals close');
          }
        }}
      />

      <PackageDetailModal
        modalId="package-detail"
        trips={localTrips}
        onApprove={(id) => {
          const pkg = localPackages.find(p => p.id === id);
          if (pkg?.status === 'payment_pending_approval') {
            onPaymentApproval(id, 'approve');
          } else {
            onApproveReject('package', id, 'approve');
          }
        }}
        onReject={(id) => {
          const pkg = localPackages.find(p => p.id === id);
          if (pkg?.status === 'payment_pending_approval') {
            onPaymentApproval(id, 'reject');
          } else {
            onApproveReject('package', id, 'reject');
          }
        }}
        onUpdatePackage={(id, updates) => {
          console.log('Updating package:', id, updates);
          // Find the package and update it optimistically
          const updatedPackages = localPackages.map(pkg => 
            pkg.id === id ? { ...pkg, ...updates } : pkg
          );
          setLocalPackages(updatedPackages);
          
          // Call the update action from dashboard actions
          onUpdatePackage(id, updates);
        }}
      />

      <TripDetailModal
        modalId="trip-detail"
        onApprove={(id) => {
          onApproveReject('trip', id, 'approve');
        }}
        onReject={(id) => {
          onApproveReject('trip', id, 'reject');
        }}
      />
    </div>
  );
};

export default AdminDashboard;
