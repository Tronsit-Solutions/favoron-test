import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface PackageActionButtonsProps {
  pkg: any;
  viewMode: 'user' | 'admin';
  onQuote: (pkg: any, userType: 'user' | 'admin') => void;
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
  const canEdit = viewMode === 'user' && ['pending_approval', 'approved'].includes(pkg.status);
  
  return (
    <div className="flex flex-wrap gap-2">
      {/* User actions */}
      {viewMode === 'user' && (
        <>
          {pkg.status === 'quote_sent' && pkg.quote && (
            <Button 
              size="sm"
              variant="secondary"
              onClick={() => onQuote(pkg, 'user')}
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
          
          {/* Send quote for matched packages */}
          {pkg.status === 'matched' && (
            <Button 
              size="sm"
              onClick={() => onQuote(pkg, 'user')}
            >
              Enviar Cotización
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default PackageActionButtons;