import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface PackageActionButtonsProps {
  pkg: any;
  viewMode: 'shopper' | 'traveler';
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  onEditClick: () => void;
  onEditPackage?: (packageData: any) => void;
}

const PackageActionButtons = ({ 
  pkg, 
  viewMode, 
  onQuote, 
  onEditClick,
  onEditPackage 
}: PackageActionButtonsProps) => {
  const canEdit = viewMode === 'shopper' && ['pending_approval', 'approved'].includes(pkg.status);
  
  return (
    <div className="flex flex-wrap gap-2">
      {/* Shopper actions */}
      {viewMode === 'shopper' && (
        <>
          {pkg.status === 'quote_sent' && pkg.quote && (
            <Button 
              size="sm"
              variant="secondary"
              onClick={() => onQuote(pkg, 'shopper')}
            >
              Ver y Responder Cotización
            </Button>
          )}
          
          {/* Edit button for early stage packages */}
          {canEdit && onEditPackage && (
            <Button 
              size="sm"
              variant="outline"
              onClick={onEditClick}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
        </>
      )}

      {/* Traveler actions - only for sending quotes */}
      {viewMode === 'traveler' && pkg.status === 'matched' && (
        <Button 
          size="sm"
          onClick={() => onQuote(pkg, 'traveler')}
        >
          Enviar Cotización
        </Button>
      )}
    </div>
  );
};

export default PackageActionButtons;