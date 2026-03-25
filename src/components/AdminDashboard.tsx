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
import { usePaymentOrders } from "@/hooks/usePaymentOrders";
import { useIsMobile } from "@/hooks/use-mobile";
import { useModalProtection } from "@/hooks/useModalProtection";
import { useModalState } from "@/contexts/ModalStateContext";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import PackageDetailModal from "./admin/PackageDetailModal";
import TripDetailModal from "./admin/TripDetailModal";
import AdminStatsOverview from "./admin/AdminStatsOverview";
import AdminApprovalsTab from "./admin/AdminApprovalsTab";
import AdminPackagesTab from "./admin/AdminPackagesTab";


import AdminMatchingTab from "./admin/AdminMatchingTab";
import FinancialDashboard from "./admin/FinancialDashboard";
import MonthlyReportsTab from "./admin/MonthlyReportsTab";
import AdminSupportTab from "./admin/AdminSupportTab";
import PendingOfficeConfirmationsTab from "./admin/PendingOfficeConfirmationsTab";
import AdminPaymentsUnifiedTab from "./admin/AdminPaymentsUnifiedTab";


import AdminMatchDialog from "./admin/AdminMatchDialog";
import AdminActionsModal from "./admin/AdminActionsModal";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  packages: any[];
  trips: any[];
  currentUser?: any;
  onMatchPackage: (packageId: string, tripId: string, adminTip?: number, productsWithTips?: any[], allTripIds?: string[]) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: string, status: string) => void;
  onApproveReject: (type: 'package' | 'trip', id: string, action: 'approve' | 'reject', reason?: string) => void;
  onPaymentApproval: (packageId: string, action: 'approve' | 'reject') => void;
  onConfirmOfficeReception: (packageId: string) => void;
  onAdminConfirmOfficeDelivery: (packageId: string) => void;
  onConfirmDeliveryComplete: (packageId: string) => void;
  onConfirmShopperReceived: (packageId: string) => void;
  onDiscardPackage: (pkg: any) => void;
  onUpdatePackage: (editedPackageData: any) => void;
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
  onUpdatePackage: onUpdatePackageProp,
  onRefreshPackages,
  refreshAdminData,
  matchingTab,
  onMatchingTabChange,
  unreadCounts = {},
  markPackageMessagesAsRead,
  loadMorePackages,
  hasMorePackages = false,
  totalPackages = 0,
  autoApprovedPayments = [],
  approvedPaymentsData = [],
  autoApprovedPaymentsLoading = false,
  approvedPaymentsLoading = false,
  loadAutoApprovedPayments,
  loadApprovedPayments
}: AdminDashboardProps & { 
  matchingTab?: string; 
  onMatchingTabChange?: (tab: string) => void;
  unreadCounts?: { [packageId: string]: number };
  markPackageMessagesAsRead?: (packageId: string) => Promise<void>;
  loadMorePackages?: () => Promise<void>;
  hasMorePackages?: boolean;
  totalPackages?: number;
  autoApprovedPayments?: any[];
  approvedPaymentsData?: any[];
  autoApprovedPaymentsLoading?: boolean;
  approvedPaymentsLoading?: boolean;
  loadAutoApprovedPayments?: () => Promise<void>;
  loadApprovedPayments?: () => Promise<void>;
}) => {
  // Persist activeTab in sessionStorage to prevent redirection on tab visibility changes
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = sessionStorage.getItem('admin_active_tab');
      // If saved tab is "overview" (removed), default to "approvals"
      return saved && saved !== "overview" ? saved : "approvals";
    } catch {
      return "approvals";
    }
  });
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [matchingTrip, setMatchingTrip] = useState<string>("");
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [localPackages, setLocalPackages] = useState(packages);
  const [localTrips, setLocalTrips] = useState(trips);
  const [modalDataCache, setModalDataCache] = useState<{ selectedPackage: any; matchedTrip: any } | null>(null);
  const [matchingPackageIds, setMatchingPackageIds] = useState<Set<string>>(new Set());
  const recentMatchRef = useRef<Record<string, number>>({});
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { openModal } = useModalState();
  const { hasOpenModals } = useModalProtection();
  
  
  // Snapshot mechanism for modal protection
  const pendingSnapshotRef = useRef<{ packages: any[]; trips: any[]; activeTab?: string } | null>(null);
  const modalStateRef = useRef(false);

  // Persist activeTab changes to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('admin_active_tab', activeTab);
    } catch (error) {
      console.warn('Failed to persist active tab:', error);
    }
  }, [activeTab]);

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
          pendingTrips: pendingSnapshotRef.current.trips.length,
          preservedTab: pendingSnapshotRef.current.activeTab
        });
        
        setLocalPackages(pendingSnapshotRef.current.packages);
        setLocalTrips(pendingSnapshotRef.current.trips);
        
        // Restore active tab if it was preserved in snapshot
        if (pendingSnapshotRef.current.activeTab) {
          setActiveTab(pendingSnapshotRef.current.activeTab);
        }
        
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
        // Protect recently matched packages from being overwritten by stale props
        const now = Date.now();
        const protectedIds = new Set(
          Object.entries(recentMatchRef.current)
            .filter(([, ts]) => now - ts < 3000)
            .map(([id]) => id)
        );
        
        if (protectedIds.size > 0) {
          console.log('🛡️ Protecting recently matched packages from stale sync:', [...protectedIds]);
          setLocalPackages(prev => {
            const protectedPkgs = prev.filter(p => protectedIds.has(p.id));
            const incomingFiltered = packages.filter(p => !protectedIds.has(p.id));
            return [...incomingFiltered, ...protectedPkgs];
          });
        } else {
          setLocalPackages(packages);
        }
      }
      if (trips.length > 0 || localTrips.length === 0) {
        setLocalTrips(trips);
      }
    } else {
      // Modals open - save to pending snapshot only if data is meaningful
      if (packages.length > 0 || trips.length > 0) {
        console.log('💾 Modals open - saving to pending snapshot:', {
          packages: packages.length,
          trips: trips.length,
          currentTab: activeTab
        });
        pendingSnapshotRef.current = { packages, trips, activeTab };
      }
    }
  }, [packages, trips, hasOpenModals, localPackages.length, localTrips.length]);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente', variant: 'warning' as const },
      'approved': { label: 'Aprobado', variant: 'success' as const },
      'matched': { label: 'Emparejado', variant: 'success' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_accepted': { label: 'Cotización aceptada', variant: 'default' as const },
      'address_confirmed': { label: 'Dirección confirmada', variant: 'default' as const },
      'paid': { label: 'Pagado', variant: 'default' as const },
      
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


  const handleMatch = async (adminTip?: number, productsWithTips?: any[], selectedTripIds?: string[]) => {
    // Use selectedTripIds if provided, otherwise fall back to matchingTrip (single)
    const tripIds = selectedTripIds && selectedTripIds.length > 0 
      ? selectedTripIds 
      : matchingTrip ? [matchingTrip] : [];

    if (selectedPackage && tripIds.length > 0) {
      if (!adminTip || adminTip <= 0) {
        toast({
          title: "Tip requerido",
          description: "Debes asignar un tip al viajero para confirmar el match.",
          variant: "destructive",
        });
        return;
      }

      const matchPackageId = selectedPackage.id;

      // Mark package as "matching in progress" — hides from Solicitudes, shows spinner
      setMatchingPackageIds(prev => new Set(prev).add(matchPackageId));

      // Close modal immediately for snappy feedback
      setSelectedPackage(null);
      setMatchingTrip("");
      setShowMatchDialog(false);

      try {
        // Await the actual DB operation
        await onMatchPackage(matchPackageId, tripIds[0], adminTip, productsWithTips, tripIds);

        // DB succeeded — apply local state update
        setLocalPackages(prevPackages => 
          prevPackages.map(pkg => 
            pkg.id === matchPackageId ? {
              ...pkg,
              status: 'matched',
              updated_at: new Date().toISOString()
            } : pkg
          )
        );

        // Protect this package from stale prop overwrites for 3s
        recentMatchRef.current[matchPackageId] = Date.now();
        setTimeout(() => { delete recentMatchRef.current[matchPackageId]; }, 3500);

        const isMultiProduct = productsWithTips && productsWithTips.length > 1;
        toast({
          title: "¡Match exitoso!",
          description: tripIds.length > 1
            ? `Paquete asignado a ${tripIds.length} viajeros. El shopper podrá comparar cotizaciones.`
            : isMultiProduct 
              ? `Paquete emparejado con viaje con tips por producto (Total: Q${adminTip})`
              : `Paquete emparejado con viaje con tip de Q${adminTip}`,
        });
      } catch (error) {
        console.error('Error during match:', error);
        toast({
          title: "Error",
          description: "Hubo un problema al procesar el match. Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        // Always clear matching state
        setMatchingPackageIds(prev => {
          const next = new Set(prev);
          next.delete(matchPackageId);
          return next;
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
    // Legacy packages don't have quantity info, default to '1'
    if (!products && (pkg.item_description || pkg.item_link || pkg.estimated_price)) {
      products = [{
        itemDescription: pkg.item_description || 'Producto sin descripción',
        estimatedPrice: pkg.estimated_price || '0',
        itemLink: pkg.item_link || null,
        quantity: '1' // Legacy packages don't have quantity info
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

  const handleAdminEditTrip = async (tripId: string, editedData: any) => {
    try {
      const safeToISOString = (dateValue: any) => {
        if (!dateValue) return null;
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        // Normalize to midday UTC to ensure consistent date display
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        return new Date(Date.UTC(year, month, day, 12, 0, 0, 0)).toISOString();
      };

      const dbData = {
        from_country: editedData.fromCountry,
        from_city: editedData.fromCity,
        to_city: editedData.toCity,
        arrival_date: safeToISOString(editedData.arrivalDate),
        delivery_date: safeToISOString(editedData.deliveryDate),
        first_day_packages: safeToISOString(editedData.firstDayPackages),
        last_day_packages: safeToISOString(editedData.lastDayPackages),
        available_space: parseFloat(editedData.availableSpace) || null,
        package_receiving_address: editedData.packageReceivingAddress,
        delivery_method: editedData.deliveryMethod,
        messenger_pickup_info: editedData.deliveryMethod === 'mensajero' 
          ? editedData.messengerPickupInfo 
          : null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('trips')
        .update(dbData)
        .eq('id', tripId);

      if (error) throw error;

      toast({ 
        title: "¡Viaje actualizado!",
        description: "Los cambios se han guardado correctamente."
      });

      // Refrescar datos admin
      if (refreshAdminData) {
        await refreshAdminData();
      }
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el viaje.",
        variant: "destructive"
      });
    }
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
  
  // Get pending refunds count
  const [pendingRefundsCount, setPendingRefundsCount] = useState(0);
  useEffect(() => {
    const fetchPendingRefunds = async () => {
      const { count } = await supabase
        .from('refund_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingRefundsCount(count || 0);
    };
    fetchPendingRefunds();
    
    // Subscribe to changes
    const channel = supabase
      .channel('refund_orders_count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_orders' }, () => {
        fetchPendingRefunds();
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, []);
  
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
      value: "payments",
      label: "Pagos",
      badge: (pendingTravelerPayments + pendingRefundsCount) > 0 ? <NotificationBadge count={pendingTravelerPayments + pendingRefundsCount} /> : undefined
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
    },
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
                <TabsList className="grid w-full grid-cols-6">
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
            matchingPackageIds={matchingPackageIds}
            modalDataCache={modalDataCache}
            activeMatchingTab={matchingTab}
            onMatchingTabChange={onMatchingTabChange}
            onViewPackageDetail={handleViewPackageDetail}
            onViewTripDetail={handleViewTripDetail}
            onOpenMatchDialog={handleOpenMatchDialog}
            onDiscardPackage={onDiscardPackage}
            onRejectPackage={(pkgId, reason) => onApproveReject('package', pkgId, 'reject', reason)}
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
            getStatusBadge={getStatusBadge}
            unreadCounts={unreadCounts}
            markPackageMessagesAsRead={markPackageMessagesAsRead}
            loadMorePackages={loadMorePackages}
            hasMorePackages={hasMorePackages}
            totalPackages={totalPackages}
            autoApprovedPayments={autoApprovedPayments}
            approvedPaymentsData={approvedPaymentsData}
            autoApprovedPaymentsLoading={autoApprovedPaymentsLoading}
            approvedPaymentsLoading={approvedPaymentsLoading}
            loadAutoApprovedPayments={loadAutoApprovedPayments}
            loadApprovedPayments={loadApprovedPayments}
            onRefresh={refreshAdminData}
          />
        </TabsContent>


        <TabsContent value="payments" className="space-y-4">
          <AdminPaymentsUnifiedTab />
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <AdminSupportTab 
            packages={localPackages}
            trips={localTrips}
            onViewPackageDetail={handleViewPackageDetail}
            onOpenActionsModal={(pkg) => {
              openModal("admin-actions", 'admin-actions', pkg);
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
        onRefresh={async () => {
          console.log('AdminActionsModal refresh - fetching latest data');
          if (refreshAdminData) {
            await refreshAdminData();
          }
        }}
      />
      
      {/* Additional modal instance for dynamic package actions from Matches tab */}
      <AdminActionsModal
        modalId="admin-actions-matches"
        trips={localTrips}
        onRefresh={async () => {
          console.log('AdminActionsModal refresh - fetching latest data');
          if (refreshAdminData) {
            await refreshAdminData();
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
          
          // Call the update action from dashboard actions (expects a single object)
          onUpdatePackageProp({ id, ...updates });
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
        onEditTrip={handleAdminEditTrip}
      />
    </div>
  );
};

export default AdminDashboard;
