
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import PackageCard from "./PackageCard";
import TripCard from "./TripCard";
import TravelerPackageCard from "./TravelerPackageCard";
import EmptyState from "./EmptyState";

interface DashboardContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userPackages: any[];
  userTrips: any[];
  assignedPackages: any[];
  packages: any[];
  trips: any[];
  getStatusBadge: (status: string) => JSX.Element;
  setShowPackageForm: (show: boolean) => void;
  setShowTripForm: (show: boolean) => void;
  handleQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  handleConfirmAddress: (pkg: any) => void;
  handleUploadDocument: (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
}

const DashboardContent = ({
  activeTab,
  setActiveTab,
  userPackages,
  userTrips,
  assignedPackages,
  packages,
  trips,
  getStatusBadge,
  setShowPackageForm,
  setShowTripForm,
  handleQuote,
  handleConfirmAddress,
  handleUploadDocument
}: DashboardContentProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="packages">Mis Paquetes</TabsTrigger>
        <TabsTrigger value="trips">Mis Viajes</TabsTrigger>
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
          <Button onClick={() => setShowPackageForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>

        {userPackages.length === 0 ? (
          <EmptyState type="packages" onAction={() => setShowPackageForm(true)} />
        ) : (
          <div className="grid gap-6">
            {userPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                getStatusBadge={getStatusBadge}
                onQuote={handleQuote}
                onConfirmAddress={handleConfirmAddress}
                onUploadDocument={handleUploadDocument}
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
          <Button variant="secondary" onClick={() => setShowTripForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Viaje
          </Button>
        </div>

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
                  />
                ))}
              </div>
            )}
          </div>

          {assignedPackages.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4">Paquetes Asignados a Mis Viajes</h4>
              <div className="grid gap-6">
                {assignedPackages.map((pkg) => (
                  <TravelerPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    getStatusBadge={getStatusBadge}
                    onQuote={handleQuote}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DashboardContent;
