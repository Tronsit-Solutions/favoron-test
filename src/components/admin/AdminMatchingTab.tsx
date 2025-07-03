import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Zap, CheckCircle } from "lucide-react";

interface AdminMatchingTabProps {
  packages: any[];
  trips: any[];
  onViewPackageDetail: (pkg: any) => void;
  onViewTripDetail: (trip: any) => void;
  onOpenMatchDialog: (pkg: any) => void;
  onUpdateStatus: (type: 'package' | 'trip', id: number, status: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

const AdminMatchingTab = ({ 
  packages, 
  trips, 
  onViewPackageDetail, 
  onViewTripDetail, 
  onOpenMatchDialog, 
  onUpdateStatus, 
  getStatusBadge 
}: AdminMatchingTabProps) => {
  const approvedPackages = packages.filter(p => p.status === 'approved');
  const availableTrips = trips.filter(trip => ['approved', 'active'].includes(trip.status));

  return (
    <div className="space-y-4">
      {/* 1. Herramienta de Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>📦 Solicitudes pendientes de Match</CardTitle>
            <CardDescription>Solicitudes aprobadas sin viaje asignado</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedPackages.length === 0 ? (
              <p className="text-muted-foreground">No hay solicitudes pendientes de Match</p>
            ) : (
              <div className="space-y-2">
                {approvedPackages.map(pkg => (
                  <div key={pkg.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{pkg.itemDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          📦 {pkg.purchaseCountry || 'No especificado'} → 🎯 {pkg.packageDestination || 'Guatemala'}
                        </p>
                        {pkg.deliveryDeadline && (
                          <p className="text-xs text-orange-600 mt-1">
                            📅 Límite: {new Date(pkg.deliveryDeadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => onOpenMatchDialog(pkg)}
                        disabled={availableTrips.length === 0}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Match
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>✈️ Viajes disponibles</CardTitle>
            <CardDescription>Viajes aprobados con espacio disponible</CardDescription>
          </CardHeader>
          <CardContent>
            {availableTrips.length === 0 ? (
              <p className="text-muted-foreground">No hay viajes disponibles</p>
            ) : (
              <div className="space-y-2">
                {availableTrips.map(trip => (
                  <div key={trip.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {trip.fromCountry || 'País'} ({trip.fromCity}) → {trip.toCountry || 'Guatemala'} ({trip.toCity})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Llegada: {new Date(trip.arrivalDate).toLocaleDateString()} • {trip.availableSpace}kg
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          📅 Primer día paquetes: {trip.firstDayPackages ? new Date(trip.firstDayPackages).toLocaleDateString() : 'No especificado'}
                        </p>
                        <p className="text-xs text-red-600">
                          📅 Último día paquetes: {trip.lastDayPackages ? new Date(trip.lastDayPackages).toLocaleDateString() : 'No especificado'}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewTripDetail(trip)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Matches activos */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 Matches activos</CardTitle>
          <CardDescription>Seguimiento de todos los matches realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {packages.filter(pkg => pkg.matchedTripId).length === 0 ? (
            <p className="text-muted-foreground">No hay matches activos</p>
          ) : (
            <div className="space-y-3">
              {packages.filter(pkg => pkg.matchedTripId).map(pkg => {
                const matchedTrip = trips.find(trip => trip.id === pkg.matchedTripId);
                return (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{pkg.itemDescription}</h4>
                          {getStatusBadge(pkg.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Precio: ${pkg.estimatedPrice} • Shopper: {pkg.userId}
                        </p>
                        {matchedTrip && (
                          <p className="text-sm text-blue-600">
                            🔗 Match con viaje: {matchedTrip.fromCity} → {matchedTrip.toCity} (Viajero: {matchedTrip.userId})
                          </p>
                        )}
                        {pkg.quote && (
                          <p className="text-xs text-green-600 mt-1">
                            💰 Cotización: ${pkg.quote.price + (pkg.quote.serviceFee || 0)}
                          </p>
                        )}
                        {pkg.deliveryDeadline && (
                          <p className="text-xs text-orange-600 mt-1">
                            📅 Límite entrega: {new Date(pkg.deliveryDeadline).toLocaleDateString()}
                          </p>
                        )}
                        {matchedTrip?.deliveryDate && (
                          <p className="text-xs text-purple-600 mt-1">
                            📅 Entrega viajero: {new Date(matchedTrip.deliveryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onViewPackageDetail(pkg)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Gestión de pagos y comprobantes */}
      <Card>
        <CardHeader>
          <CardTitle>💳 Gestión de pagos</CardTitle>
          <CardDescription>Confirmación de pagos y revisión de comprobantes</CardDescription>
        </CardHeader>
        <CardContent>
          {packages.filter(pkg => pkg.status === 'payment_pending' || pkg.paymentReceipt).length === 0 ? (
            <p className="text-muted-foreground">No hay pagos pendientes ni comprobantes</p>
          ) : (
            <div className="space-y-3">
              {packages.filter(pkg => pkg.status === 'payment_pending' || pkg.paymentReceipt).map(pkg => (
                <div key={pkg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{pkg.itemDescription}</h4>
                        {getStatusBadge(pkg.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Precio: ${pkg.estimatedPrice} • Usuario: {pkg.userId}
                      </p>
                      {pkg.paymentReceipt && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <p className="text-xs text-blue-800 font-medium">Comprobante de pago:</p>
                          <p className="text-xs text-blue-600">
                            📄 {pkg.paymentReceipt.filename}
                          </p>
                          <p className="text-xs text-blue-600">
                            📅 Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewPackageDetail(pkg)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Comprobante
                      </Button>
                      {pkg.status === 'payment_pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => onUpdateStatus('package', pkg.id, 'payment_confirmed')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMatchingTab;