import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
  // Add extensive logging to identify the issue
  console.log('🔍 TripsTabContent RENDER START');
  console.log('🔍 userTrips:', userTrips, 'length:', userTrips?.length);
  console.log('🔍 assignedPackages:', assignedPackages, 'length:', assignedPackages?.length);
  console.log('🔍 currentUser:', currentUser);
  
  // Safe data validation
  const safeUserTrips = Array.isArray(userTrips) ? userTrips : [];
  const safeAssignedPackages = Array.isArray(assignedPackages) ? assignedPackages : [];
  
  console.log('🔍 After safety checks - safeUserTrips:', safeUserTrips.length, 'safeAssignedPackages:', safeAssignedPackages.length);

  // Start with minimal safe rendering
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

      {/* Minimal safe content */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold mb-3">Mis Viajes Registrados</h4>
          {safeUserTrips.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No tienes viajes registrados. ¡Crea tu primer viaje!
            </div>
          ) : (
            <div className="p-4 border rounded-lg">
              <p>Encontrados {safeUserTrips.length} viajes</p>
              <p>Debug: Datos de viajes disponibles - renderizado completo próximamente</p>
            </div>
          )}
        </div>

        {safeAssignedPackages.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Paquetes Asignados</h4>
            <div className="p-4 border rounded-lg">
              <p>Encontrados {safeAssignedPackages.length} paquetes asignados</p>
              <p>Debug: Datos de paquetes disponibles - renderizado completo próximamente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripsTabContent;