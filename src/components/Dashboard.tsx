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
import CollapsibleTravelerPackageCard from "./dashboard/CollapsibleTravelerPackageCard";
import TravelerTipsOverview from "./dashboard/TravelerTipsOverview";
import EmptyState from "./dashboard/EmptyState";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { usePendingActions } from "@/hooks/usePendingActions";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
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
    selectedPackageForAddress,
    setSelectedPackageForAddress,
    selectedPackageForQuote,
    setSelectedPackageForQuote,
    quoteUserType,
    setQuoteUserType,
    packages,
    setPackages,
    trips,
    setTrips
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
    setPackages,
    trips,
    setTrips,
    currentUser,
    setShowPackageForm,
    setShowTripForm,
    setShowAddressConfirmation,
    setSelectedPackageForAddress,
    setShowQuoteDialog,
    setSelectedPackageForQuote,
    setQuoteUserType
  );

  const pendingActions = usePendingActions(packages, trips, currentUser);

  const handleUpdateUser = (userData: any) => {
    setCurrentUser(userData);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending_approval': { label: 'Pendiente aprobación', variant: 'secondary' as const },
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
      'active': { label: 'Activo', variant: 'default' as const },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isAdmin = currentUser.role === 'admin';

  const handleLoadTestData = () => {
    const now = Date.now();
    
    // Create test packages
    const testPackages = [
      {
        id: now + 1,
        userId: 101,
        itemDescription: "iPhone 15 Pro Max + AirPods Pro",
        estimatedPrice: 1200,
        maxBudget: 1300,
        sourceUrl: "https://apple.com",
        productCount: 2,
        deliveryDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending_approval",
        createdAt: new Date().toISOString(),
        fromCountry: "Estados Unidos",
        fromCity: "Miami, FL"
      },
      {
        id: now + 2,
        userId: 102,
        itemDescription: "MacBook Air M3 + Accesorios",
        estimatedPrice: 950,
        maxBudget: 1000,
        sourceUrl: "https://bestbuy.com",
        productCount: 3,
        deliveryDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: "approved",
        createdAt: new Date().toISOString(),
        fromCountry: "Estados Unidos",
        fromCity: "Los Angeles, CA"
      }
    ];

    // Create test trips  
    const testTrips = [
      {
        id: now + 3,
        userId: 201,
        fromCity: "Miami, FL",
        fromCountry: "Estados Unidos", 
        toCity: "Guatemala City",
        toCountry: "Guatemala",
        arrivalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        availableSpace: "5",
        deliveryMethod: "oficina",
        deliveryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: "approved",
        createdAt: new Date().toISOString(),
        packageReceivingAddress: {
          accommodationType: "hotel",
          streetAddress: "123 Test St",
          cityArea: "Miami Beach",
          postalCode: "33139",
          hotelAirbnbName: "Test Hotel",
          contactNumber: "+1 305 555-0123"
        },
        firstDayPackages: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastDayPackages: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setPackages(prev => [...prev, ...testPackages]);
    setTrips(prev => [...prev, ...testTrips]);
  };

  const handleLoadTestPackage = () => {
    const now = Date.now();
    const testPackage = {
      id: now,
      userId: currentUser.id, // Admin's ID
      itemDescription: "Laptop Gaming ASUS ROG + Accesorios",
      estimatedPrice: 850,
      maxBudget: 900,
      sourceUrl: "https://amazon.com/asus-rog",
      productCount: 2,
      deliveryDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending_approval",
      createdAt: new Date().toISOString(),
      fromCountry: "Estados Unidos",
      fromCity: "New York, NY"
    };
    setPackages(prev => [...prev, testPackage]);
  };

  const handleLoadTestTrip = () => {
    const now = Date.now();
    const testTrip = {
      id: now,
      userId: currentUser.id, // Admin's ID
      fromCity: "Orlando, FL",
      fromCountry: "Estados Unidos", 
      toCity: "Guatemala City",
      toCountry: "Guatemala",
      arrivalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      availableSpace: "8",
      deliveryMethod: "oficina",
      deliveryDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending_approval",
      createdAt: new Date().toISOString(),
      packageReceivingAddress: {
        accommodationType: "hotel",
        streetAddress: "456 Admin Ave",
        cityArea: "Orlando Downtown",
        postalCode: "32801",
        hotelAirbnbName: "Admin Test Hotel",
        contactNumber: "+1 407 555-0987"
      },
      firstDayPackages: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastDayPackages: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString()
    };
    setTrips(prev => [...prev, testTrip]);
  };

  // Filter packages and trips for current user
  const userPackages = packages.filter(pkg => pkg.userId === currentUser.id);
  const userTrips = trips.filter(trip => trip.userId === currentUser.id);
  
  // Get packages assigned to user's trips (for traveler view)
  const assignedPackages = packages.filter(pkg => 
    userTrips.some(trip => trip.id === pkg.matchedTripId)
  );

  if (showProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader 
          user={currentUser}
          onShowProfile={() => setShowProfile(false)}
          onLogout={onLogout}
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

  // Enhanced handleStatusUpdate to include payment confirmation
  const enhancedHandleStatusUpdate = (type: 'package' | 'trip', id: number, status: string) => {
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
        onLogout={onLogout}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">¡Hola, {currentUser.name}! 👋</h2>
          <p className="text-muted-foreground">
            Gestiona tus solicitudes de paquetes y viajes desde aquí
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Mis Solicitudes de Paquetes</h3>
                <p className="text-muted-foreground">
                  Gestiona tus pedidos como <strong>shopper</strong> - aquí recibes cotizaciones de viajeros
                </p>
              </div>
              <div className="flex gap-3">
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={handleLoadTestPackage}>
                    🧪 Generar pedido de prueba
                  </Button>
                )}
                <Button variant="shopper" onClick={() => setShowPackageForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Solicitud
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
                    packages={packages}
                    setPackages={setPackages}
                    onQuote={handleQuote}
                    onConfirmAddress={handleConfirmAddress}
                    onEditPackage={handleEditPackage}
                    viewMode="shopper"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Mis Viajes</h3>
                <p className="text-muted-foreground">
                  Gestiona tus viajes como <strong>viajero</strong> - envía cotizaciones y ve paquetes asignados
                </p>
              </div>
              <div className="flex gap-3">
                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={handleLoadTestTrip}>
                    🧪 Generar viaje de prueba
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setShowTripForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Viaje
                </Button>
              </div>
            </div>

            {/* Show user's trips */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-4">Mis Viajes Registrados</h4>
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

              {/* Show packages assigned to user's trips - NOW COLLAPSIBLE WITH PRIORITY ORDERING */}
              {assignedPackages.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Paquetes Asignados a Mis Viajes</h4>
                  
                  {/* Tips Overview */}
                  <TravelerTipsOverview packages={assignedPackages} />
                  
                  <div className="grid gap-6">
                     {assignedPackages
                       // Sort packages: priority actions first, then by creation date
                       .sort((a, b) => {
                         const aPriority = ['matched', 'in_transit'].includes(a.status) ? 1 : 0;
                         const bPriority = ['matched', 'in_transit'].includes(b.status) ? 1 : 0;
                         if (aPriority !== bPriority) return bPriority - aPriority;
                         return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                       })
                       .map((pkg) => {
                         const hasPendingAction = ['matched', 'in_transit'].includes(pkg.status);
                         return (
                           <CollapsibleTravelerPackageCard
                             key={pkg.id}
                             pkg={pkg}
                             getStatusBadge={getStatusBadge}
                             onQuote={handleQuote}
                             onConfirmReceived={handleConfirmPackageReceived}
                             hasPendingAction={hasPendingAction}
                             autoExpand={hasPendingAction}
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
                onLoadTestData={handleLoadTestData}
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
            itemDescription: selectedPackageForAddress.itemDescription,
            estimatedPrice: selectedPackageForAddress.estimatedPrice
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
            itemDescription: selectedPackageForQuote.itemDescription,
            estimatedPrice: selectedPackageForQuote.estimatedPrice,
            deliveryAddress: selectedPackageForQuote.confirmedDeliveryAddress
          }}
          userType={quoteUserType}
          existingQuote={selectedPackageForQuote.quote}
          tripDates={selectedPackageForQuote.tripDates}
        />
      )}
    </div>
  );
};

export default Dashboard;