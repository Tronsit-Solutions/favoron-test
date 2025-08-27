import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, Image as ImageIcon, Edit } from "lucide-react";
import { Package } from "@/types";
import { useState } from "react";
import PackageReceiptConfirmation from "../PackageReceiptConfirmation";

interface TravelerConfirmationDisplayProps {
  pkg: any;
  className?: string;
  onConfirmReceived?: (packageId: string, photo?: string) => void;
}

export const TravelerConfirmationDisplay = ({ pkg, className, onConfirmReceived }: TravelerConfirmationDisplayProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Show for all states after in_transit that have confirmation
  const postInTransitStates = ['received_by_traveler', 'delivered', 'pending_office_confirmation', 'completed'];
  if (!postInTransitStates.includes(pkg.status) || !pkg.traveler_confirmation) {
    return null;
  }

  const confirmation = pkg.traveler_confirmation as any;
  const photoUrl = confirmation.photo;
  const confirmedAt = confirmation.confirmedAt;

  const handleEditPhoto = (photo?: string) => {
    if (onConfirmReceived) {
      onConfirmReceived(pkg.id, photo);
    }
    setShowEditModal(false);
  };

  const getPackageName = () => {
    if (pkg.products && pkg.products.length > 0) {
      return pkg.products.length > 1 
        ? `Pedido con ${pkg.products.length} productos` 
        : pkg.products[0].itemDescription;
    }
    return pkg.item_description || 'Pedido';
  };

  return (
    <>
      <Card className={`border-green-200 bg-green-50/30 ${className}`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Paquete recibido por el viajero</span>
            </div>
            {onConfirmReceived && photoUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="text-green-700 border-green-300 hover:bg-green-50 h-6 px-2 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
            )}
          </div>
          
          {confirmedAt && (
            <div className="flex items-center space-x-2 text-xs text-green-700">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(confirmedAt).toLocaleDateString('es-GT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          {photoUrl ? (
            <div className="border border-green-200 rounded p-1 bg-white">
              <img 
                src={photoUrl} 
                alt="Paquete recibido" 
                className="w-full h-24 object-cover rounded cursor-pointer"
                onClick={() => window.open(photoUrl, '_blank')}
                title="Ver imagen completa"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <ImageIcon className="h-3 w-3" />
              <span>Sin foto del paquete</span>
            </div>
          )}
        </CardContent>
      </Card>

      <PackageReceiptConfirmation 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onConfirm={handleEditPhoto} 
        packageName={getPackageName()}
        packageId={pkg.id}
      />
    </>
  );
};