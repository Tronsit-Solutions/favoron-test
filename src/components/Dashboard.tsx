import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import AddressConfirmationModal from "./AddressConfirmationModal";
import AdminDashboard from "./AdminDashboard";
import QuoteDialog from "./QuoteDialog";
import UserProfile from "./UserProfile";
import DashboardHeader from "./dashboard/DashboardHeader";
import QuickActions from "./dashboard/QuickActions";
import RecentActivity from "./dashboard/RecentActivity";
import CollapsiblePackageCard from "./dashboard/CollapsiblePackageCard";
import TripCard from "./dashboard/TripCard";
import TripPackagesGroup from "./dashboard/TripPackagesGroup";
import TravelerTipsOverview from "./dashboard/TravelerTipsOverview";
import EmptyState from "./dashboard/EmptyState";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { usePendingActions } from "@/hooks/usePendingActions";
import { useRealtimePackages } from "@/hooks/useRealtimePackages";
import { useNotificationGenerator } from "@/hooks/useNotificationGenerator";
import UserManagement from "./admin/UserManagement";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface DashboardProps {
  user: any;
}

const Dashboard = ({ user }: DashboardProps) => {
  const { signOut } = useAuth();
  const {
    currentUser,
    setCurrentUser,
    activeTab,
    setActiveTab,
    showPackageForm,
    setShowPackageForm,
    showTripForm,
    setShowTripForm,
    showAddressConfirmation,
    setShowAddressConfirmation,
    showQuoteDialog,
    setShowQuoteDialog,
    showProfile,
    setShowProfile,
    showUserManagement,
    setShowUserManagement,
    selectedPackageForAddress,
    setSelectedPackageForAddress,
    selectedPackageForQuote,
    setSelectedPackageForQuote,
    quoteUserType,
    setQuoteUserType,
    packages,
    trips,
    createPackage,
    updatePackage,
    createTrip,
    updateTrip
  } = useDashboardState(user);

  const {
    handlePackageSubmit,
    handleTripSubmit,
    handleAddressConfirmation,
    handleQuoteSubmit,
    handleQuote,
    handleConfirmAddress,
    handleUploadDocument,
    handleConfirmPayment,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject,
    handleConfirmPackageReceived,
    handleConfirmOfficeReception,
    handleEditTrip,
    handleEditPackage
  } = useDashboardActions(
    packages,
    () => {},
    trips,
    () => {},
    currentUser,
    setShowPackageForm,
    setShowTripForm,
    setShowAddressConfirmation,
    setSelectedPackageForAddress,
    setShowQuoteDialog,
    setSelectedPackageForQuote,
    setQuoteUserType,
    createPackage,
    createTrip,
    updatePackage,
    updateTrip
  );

  const pendingActions = usePendingActions(packages, trips, currentUser);

  // Generate notifications automatically based on system state
  useNotificationGenerator({ packages, trips, currentUser });

  const isAdmin = currentUser.role === 'admin';
  
  // Filter packages and trips for current user
  const userPackages = packages.filter(pkg => pkg.user_id === currentUser.id);
  const userTrips = trips.filter(trip => trip.user_id === currentUser.id);
  
  // Get packages assigned to user's trips (for traveler view)
  const assignedPackages = packages.filter(pkg => 
    userTrips.some(trip => trip.id === pkg.matched_trip_id)
  );

  // Set up real-time notifications based on user context
  useRealtimePackages({
    userRole: isAdmin ? 'admin' : (assignedPackages.length > 0 ? 'traveler' : 'shopper')
  });

  const handleUpdateUser = (userData: any) => {
    setCurrentUser(userData);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente aprobación', variant: 'warning' as const },
      'approved': { label: 'Aprobado', variant: 'success' as const },
      'matched': { label: 'Emparejado', variant: 'success' as const },
      'quote_sent': { label: 'Cotización enviada', variant: 'default' as const },
      'quote_accepted': { label: 'Cotización aceptada', variant: 'default' as const },
      'address_confirmed': { label: 'Dirección confirmada', variant: 'default' as const },
      'paid': { label: 'Pagado', variant: 'default' as const },
      'purchased': { label: 'Comprado', variant: 'default' as const },
      'in_transit': { label: 'En tránsito', variant: 'default' as const },
      'delivered': { label: 'Entregado', variant: 'success' as const },
      'rejected': { label: 'Rechazado', variant: 'destructive' as const },
      'active': { label: 'Activo', variant: 'success' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };


  if (showProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(false)}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(true)}
        />
        <div className="container mx-auto px-4 py-8">
          <UserProfile 
            user={currentUser} 
            packages={packages}
            trips={trips}
            onUpdateUser={handleUpdateUser} 
          />
        </div>
      </div>
    );
  }

  if (showUserManagement) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(true)}
          onLogout={signOut}
          onShowUserManagement={() => setShowUserManagement(false)}
        />
        <div className="container mx-auto px-4 py-8">
          <UserManagement 
            packages={packages}
            trips={trips}
          />
        </div>
      </div>
    );
  }

  // Enhanced handleStatusUpdate to include payment confirmation
  const enhancedHandleStatusUpdate = (type: 'package' | 'trip', id: string, status: string) => {
    if (status === 'payment_confirmed') {
      handleConfirmPayment(id);
    } else {
      handleStatusUpdate(type, id, status);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={currentUser}
        onShowProfile={() => setShowProfile(true)}
        onLogout={signOut}
        onShowUserManagement={() => setShowUserManagement(true)}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">¡Hola, {currentUser.name}! 👋</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestiona tus solicitudes de paquetes y viajes desde aquí
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full text-xs sm:text-sm ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="packages" className="relative flex items-center gap-2">
              Mis Pedidos
              {pendingActions.shopperTotal > 0 && (
                <NotificationBadge count={pendingActions.shopperTotal} />
              )}
            </TabsTrigger>
            <TabsTrigger value="trips" className="relative flex items-center gap-2">
              Mis Viajes
              {pendingActions.travelerTotal > 0 && (
                <NotificationBadge count={pendingActions.travelerTotal} />
              )}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="relative flex items-center gap-2">
                Admin
                {pendingActions.adminTotal > 0 && (
                  <NotificationBadge count={pendingActions.adminTotal} />
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <QuickActions 
              onShowPackageForm={() => setShowPackageForm(true)}
              onShowTripForm={() => setShowTripForm(true)}
            />
            <RecentActivity 
              packages={packages}
              trips={trips}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Mis Solicitudes de Paquetes</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Gestiona tus pedidos como <strong>shopper</strong> - aquí recibes cotizaciones de viajeros
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="shopper" onClick={() => setShowPackageForm(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nueva Solicitud</span>
                  <span className="sm:hidden">Nuevo Pedido</span>
                </Button>
              </div>
            </div>

            {userPackages.length === 0 ? (
              <EmptyState type="packages" onAction={() => setShowPackageForm(true)} />
            ) : (
              <div className="grid gap-6">
                 {userPackages.map((pkg) => (
                    <CollapsiblePackageCard
                      key={pkg.id}
                      pkg={pkg}
                       onQuote={(pkg, userType) => {
                         setSelectedPackageForQuote(pkg);
                         setQuoteUserType(userType);
                         setShowQuoteDialog(true);
                       }}
                      onConfirmAddress={handleAddressConfirmation}
                      onUploadDocument={handleUploadDocument}
                      onEditPackage={(editedPkg) => updatePackage(editedPkg.id, editedPkg)}
                      viewMode="user"
                    />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Mis Viajes</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Gestiona tus viajes como <strong>viajero</strong> - envía cotizaciones y ve paquetes asignados
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button variant="traveler" onClick={() => setShowTripForm(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Viaje
                </Button>
              </div>
            </div>

            {/* Show user's trips */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-3">Mis Viajes Registrados</h4>
                {userTrips.length === 0 ? (
                  <EmptyState type="trips" onAction={() => setShowTripForm(true)} />
                ) : (
                  <div className="grid gap-4">
                    {userTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        getStatusBadge={getStatusBadge}
                        onEditTrip={handleEditTrip}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Show packages assigned to user's trips - NOW GROUPED BY TRIP */}
              {assignedPackages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Paquetes Asignados a Mis Viajes</h4>
                   
                  {/* Tips Overview with trip filter */}
                  <TravelerTipsOverview packages={assignedPackages} trips={userTrips} />
                  
                  {/* Group packages by trip */}
                  <div className="space-y-6">
                    {userTrips
                       .filter(trip => assignedPackages.some(pkg => pkg.matched_trip_id === trip.id))
                       .map((trip) => {
                         const tripPackages = assignedPackages.filter(pkg => pkg.matched_trip_id === trip.id);
                        const hasPendingActions = tripPackages.some(pkg => ['matched', 'in_transit'].includes(pkg.status));
                        
                        return (
                          <TripPackagesGroup
                            key={trip.id}
                            trip={trip}
                            packages={tripPackages}
                            getStatusBadge={getStatusBadge}
                            onQuote={handleQuote}
                            onConfirmReceived={handleConfirmPackageReceived}
                            defaultExpanded={hasPendingActions}
                          />
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard 
              packages={packages}
              trips={trips}
              currentUser={currentUser}
              onMatchPackage={handleMatchPackage}
              onUpdateStatus={enhancedHandleStatusUpdate}
              onApproveReject={handleApproveReject}
              onConfirmOfficeReception={handleConfirmOfficeReception}
              
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Modals */}
      <PackageRequestForm
        isOpen={showPackageForm}
        onClose={() => setShowPackageForm(false)}
        onSubmit={handlePackageSubmit}
      />

      <TripForm
        isOpen={showTripForm}
        onClose={() => setShowTripForm(false)}
        onSubmit={handleTripSubmit}
      />

      {selectedPackageForAddress && (
        <AddressConfirmationModal
          isOpen={showAddressConfirmation}
          onClose={() => {
            setShowAddressConfirmation(false);
            setSelectedPackageForAddress(null);
          }}
          onConfirm={handleAddressConfirmation}
          currentAddress={selectedPackageForAddress.deliveryAddress}
          packageDetails={{
            itemDescription: selectedPackageForAddress.item_description,
            estimatedPrice: selectedPackageForAddress.estimated_price
          }}
        />
      )}

      {selectedPackageForQuote && (
        <QuoteDialog
          isOpen={showQuoteDialog}
          onClose={() => {
            setShowQuoteDialog(false);
            setSelectedPackageForQuote(null);
          }}
          onSubmit={(quoteData) => handleQuoteSubmit(quoteData, selectedPackageForQuote, quoteUserType)}
          packageDetails={{
            item_description: selectedPackageForQuote.item_description,
            estimated_price: selectedPackageForQuote.estimated_price,
            deliveryAddress: selectedPackageForQuote.confirmed_delivery_address
          }}
          userType={quoteUserType}
          existingQuote={selectedPackageForQuote.quote}
          tripDates={selectedPackageForQuote.matched_trip_dates}
        />
      )}
    </div>
  );
};

export default Dashboard;