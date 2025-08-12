import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { REJECTION_REASONS } from "@/lib/constants";
import { Clock, RefreshCw, X } from "lucide-react";

interface RejectionReasonDisplayProps {
  rejectionReason?: string;
  wantsRequote?: boolean;
  additionalComments?: string;
  className?: string;
}

const RejectionReasonDisplay = ({ 
  rejectionReason, 
  wantsRequote, 
  additionalComments,
  className = ""
}: RejectionReasonDisplayProps) => {
  if (!rejectionReason) return null;

  const reasonLabel = REJECTION_REASONS[rejectionReason as keyof typeof REJECTION_REASONS] || rejectionReason;
  
  return (
    <Card className={`bg-red-50 border-red-200 ${className}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Razón del rechazo:</span>
          </div>
          {wantsRequote ? (
            <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
              <RefreshCw className="h-3 w-3 mr-1" />
              Quiere nueva cotización
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-700 border-red-300">
              <X className="h-3 w-3 mr-1" />
              Rechazo definitivo
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-red-700 font-medium">
          {reasonLabel}
        </p>
        
        {wantsRequote && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Clock className="h-3 w-3" />
            <span>Paquete disponible para reasignación</span>
          </div>
        )}
        
        {additionalComments && (
          <div className="pt-2 border-t border-red-200">
            <p className="text-xs text-red-600">
              <strong>Comentarios adicionales:</strong> {additionalComments}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RejectionReasonDisplay;