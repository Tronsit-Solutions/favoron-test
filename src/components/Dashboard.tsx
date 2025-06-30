
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
import PackageCard from "./dashboard/PackageCard";
import TripCard from "./dashboard/TripCard";
import EmptyState from "./dashboard/EmptyState";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useDashboardActions } from "@/hooks/useDashboardActions";
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
    handleMarkAsPaid,
    handleUploadDocument,
    handleMatchPackage,
    handleStatusUpdate,
    handleApproveReject
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
            <TabsTrigger value="packages">Mis Paquetes</TabsTrigger>
            <TabsTrigger value="trips">Mis Viajes</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
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
                <p className="text-muted-foreground">Gestiona todas tus solicitudes de paquetes</p>
              </div>
              <Button onClick={() => setShowPackageForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </div>

            {packages.length === 0 ? (
              <EmptyState type="packages" onAction={() => setShowPackageForm(true)} />
            ) : (
              <div className="grid gap-6">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    getStatusBadge={getStatusBadge}
                    onQuote={handleQuote}
                    onConfirmAddress={handleConfirmAddress}
                    onMarkAsPaid={handleMarkAsPaid}
                    onUploadDocument={handleUploadDocument}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trips" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Mis Viajes</h3>
                <p className="text-muted-foreground">Gestiona todos tus viajes registrados</p>
              </div>
              <Button variant="secondary" onClick={() => setShowTripForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Viaje
              </Button>
            </div>

            {trips.length === 0 ? (
              <EmptyState type="trips" onAction={() => setShowTripForm(true)} />
            ) : (
              <div className="grid gap-4">
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard 
                packages={packages}
                trips={trips}
                onMatchPackage={handleMatchPackage}
                onUpdateStatus={handleStatusUpdate}
                onApproveReject={handleApproveReject}
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
        />
      )}
    </div>
  );
};

export default Dashboard;
