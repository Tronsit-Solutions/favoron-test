import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EmptyState from './EmptyState';
import TripCard from './TripCard';
import TravelerTipsOverview from './TravelerTipsOverview';
import TripPackagesGroup from './TripPackagesGroup';

interface TripsTabContentProps {
  userTrips: any[];
  assignedPackages: any[];
  currentUser: any;
  getStatusBadge: (status: string) => JSX.Element;
  handleEditTrip: (trip: any) => void;
  handleQuote: (pkg: any, userType: 'user' | 'admin') => void;
  handleConfirmPackageReceived: (packageId: string, photo?: string) => void;
  handleConfirmOfficeReception: (packageId: string) => void;
  setShowTripForm: (show: boolean) => void;
}

const TripsTabContent: React.FC<TripsTabContentProps> = ({
  userTrips = [],
  assignedPackages = [],
  currentUser,
  getStatusBadge,
  handleEditTrip,
  handleQuote,
  handleConfirmPackageReceived,
  handleConfirmOfficeReception,
  setShowTripForm
}) => {
  // Error boundary wrapper for individual components
  const SafeComponent = ({ children, fallback = "Error al cargar componente" }: { children: React.ReactNode, fallback?: string }) => {
    try {
      return <>{children}</>;
    } catch (error) {
      console.error('Safe component error:', error);
      return <div className="p-2 text-red-600 text-sm">{fallback}</div>;
    }
  };

  console.log('🔍 TripsTabContent - userTrips:', userTrips);
  console.log('🔍 TripsTabContent - assignedPackages:', assignedPackages);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* User's trips section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold mb-3">Mis Viajes Registrados</h4>
          <SafeComponent fallback="Error al cargar viajes">
            {(!userTrips || userTrips.length === 0) ? (
              <EmptyState type="trips" onAction={() => setShowTripForm(true)} />
            ) : (
              <div className="grid gap-4">
                {userTrips
                  .filter(trip => trip && trip.status !== 'completed_paid')
                  .map((trip) => (
                    <SafeComponent key={trip.id} fallback={`Error al cargar viaje ${trip.id}`}>
                      <TripCard
                        trip={trip}
                        getStatusBadge={getStatusBadge}
                        onEditTrip={handleEditTrip}
                        currentUser={currentUser}
                        travelerProfile={currentUser}
                      />
                    </SafeComponent>
                  ))}
              </div>
            )}
          </SafeComponent>
        </div>

        {/* Assigned packages section */}
        {assignedPackages && assignedPackages.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Paquetes Asignados a Mis Viajes</h4>
            
            {/* Tips Overview */}
            <SafeComponent fallback="Error al cargar resumen de compensaciones">
              <TravelerTipsOverview packages={assignedPackages} trips={userTrips} />
            </SafeComponent>
            
            {/* Group packages by trip */}
            <div className="space-y-6">
              <SafeComponent fallback="Error al cargar grupos de paquetes">
                {userTrips
                  .filter(trip => 
                    trip && 
                    trip.status !== 'completed_paid' && 
                    assignedPackages.some(pkg => pkg && pkg.matched_trip_id === trip.id)
                  )
                  .map((trip) => {
                    const tripPackages = assignedPackages.filter(pkg => pkg && pkg.matched_trip_id === trip.id);
                    const hasPendingActions = tripPackages.some(pkg => pkg && ['matched', 'in_transit'].includes(pkg.status));
                    
                    return (
                      <SafeComponent key={trip.id} fallback={`Error al cargar paquetes del viaje ${trip.id}`}>
                        <TripPackagesGroup
                          trip={trip}
                          packages={tripPackages}
                          getStatusBadge={getStatusBadge}
                          onQuote={handleQuote}
                          onConfirmReceived={handleConfirmPackageReceived}
                          onConfirmOfficeDelivery={handleConfirmOfficeReception}
                          defaultExpanded={hasPendingActions}
                        />
                      </SafeComponent>
                    );
                  })}
              </SafeComponent>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsTabContent;