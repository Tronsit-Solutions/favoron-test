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
  
  // Only show if package is received by traveler and has confirmation
  if (pkg.status !== 'received_by_traveler' || !pkg.traveler_confirmation) {
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
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Paquete recibido por el viajero</span>
          </CardTitle>
          <CardDescription className="text-green-700">
            El viajero ha confirmado la recepción del paquete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confirmation Date */}
          {confirmedAt && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <span className="font-medium text-green-800">Confirmado el:</span>
                <span className="ml-1 text-green-700">
                  {new Date(confirmedAt).toLocaleDateString('es-GT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Photo if available */}
          {photoUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm">
                  <ImageIcon className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Foto del paquete:</span>
                </div>
                {onConfirmReceived && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditModal(true)}
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar foto
                  </Button>
                )}
              </div>
              <div className="border border-green-200 rounded-lg p-2 bg-white">
                <img 
                  src={photoUrl} 
                  alt="Paquete recibido por el viajero" 
                  className="w-full max-w-sm h-48 object-cover rounded mx-auto cursor-pointer"
                  onClick={() => window.open(photoUrl, '_blank')}
                  title="Haz clic para ver en tamaño completo"
                />
                <p className="text-xs text-green-600 text-center mt-1">
                  Haz clic en la imagen para verla en tamaño completo
                </p>
              </div>
            </div>
          )}

          {!photoUrl && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <ImageIcon className="h-4 w-4" />
              <span>El viajero no subió una foto del paquete</span>
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