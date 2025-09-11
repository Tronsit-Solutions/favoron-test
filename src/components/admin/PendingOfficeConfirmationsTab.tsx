import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PendingOfficeConfirmationsTabProps {
  packages: any[];
  onConfirmOfficeDelivery: (packageId: string) => void;
}

const PendingOfficeConfirmationsTab: React.FC<PendingOfficeConfirmationsTabProps> = ({ 
  packages, 
  onConfirmOfficeDelivery 
}) => {
  const pendingConfirmations = packages.filter(pkg => 
    ['in_transit', 'received_by_traveler', 'pending_office_confirmation'].includes(pkg.status)
  );

  if (pendingConfirmations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay entregas pendientes</h3>
        <p className="text-muted-foreground">
          No hay paquetes listos para confirmación de entrega en oficina.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Entregas Pendientes de Confirmación</h2>
          <p className="text-muted-foreground">
            Confirma la recepción de paquetes en oficina para desbloquear las compensaciones de los viajeros.
          </p>
        </div>
        <Badge variant="warning" className="px-3 py-1">
          {pendingConfirmations.length} pendiente{pendingConfirmations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {pendingConfirmations.map((pkg) => {
          const travelerDeclaration = pkg.office_delivery?.traveler_declaration;
          const declaredAt = travelerDeclaration?.declared_at ? new Date(travelerDeclaration.declared_at) : null;
          const hasTravelerDeclaration = !!travelerDeclaration;
          
          return (
            <Card key={pkg.id} className="border-l-4 border-l-warning">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{pkg.item_description}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        ID: {pkg.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant="warning">🔒 Pendiente confirmación</Badge>
                    {!hasTravelerDeclaration && (
                      <Badge variant="secondary" className="text-xs">
                        Sin declaración de viajero
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Traveler Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Viajero:</span>
                    </div>
                    <p className="text-sm">
                      {pkg.profiles?.first_name} {pkg.profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      @{pkg.profiles?.username}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Estado:</span>
                    </div>
                    <p className="text-sm">
                      {hasTravelerDeclaration ? (
                        <>Declarado {declaredAt ? formatDistanceToNow(declaredAt, { 
                          addSuffix: true, 
                          locale: es 
                        }) : ''}</>
                      ) : (
                        <span className="text-muted-foreground">Sin declaración del viajero</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Package Details */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Origen:</span>
                      <p className="font-medium">{pkg.purchase_origin}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Destino:</span>
                      <p className="font-medium">{pkg.package_destination}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Compensación:</span>
                      <p className="font-medium text-success">
                        Q{pkg.quote?.price || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={() => onConfirmOfficeDelivery(pkg.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Confirmar Recepción
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PendingOfficeConfirmationsTab;