import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { REJECTION_REASONS } from "@/lib/constants";

interface RejectionTooltipProps {
  adminAssignedTip?: number;
  rejectionReason: string;
  wantsRequote: boolean;
  additionalNotes?: string;
}

const RejectionTooltip = ({ 
  adminAssignedTip, 
  rejectionReason, 
  wantsRequote, 
  additionalNotes 
}: RejectionTooltipProps) => {
  const rejectionLabel = REJECTION_REASONS[rejectionReason as keyof typeof REJECTION_REASONS] || rejectionReason;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-blue-500 cursor-help ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-80 p-4">
          <div className="space-y-3">
            <div className="font-semibold text-sm border-b pb-1">
              📋 Cotización Rechazada
            </div>
            
            {adminAssignedTip && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">💰 Tip anterior asignado:</span>
                  <span className="ml-2">${adminAssignedTip}</span>
                </div>
                <div className="bg-orange-50 border border-orange-200 p-2 rounded text-xs">
                  <span className="font-medium text-orange-800">💡 Sugerencia:</span>
                  <span className="text-orange-700 ml-1">
                    Asignar un tip menor a ${adminAssignedTip}
                  </span>
                </div>
              </div>
            )}
            
            <div className="text-sm">
              <span className="font-medium">❌ Motivo:</span>
              <span className="ml-2">{rejectionLabel}</span>
            </div>
            
            <div className="text-sm">
              <span className="font-medium">🔄 Solicita nueva cotización:</span>
              <Badge 
                variant={wantsRequote ? "default" : "secondary"} 
                className="ml-2 text-xs"
              >
                {wantsRequote ? "Sí" : "No"}
              </Badge>
            </div>
            
            {additionalNotes && (
              <div className="text-sm">
                <span className="font-medium">💭 Comentarios:</span>
                <div className="bg-muted p-2 rounded text-xs mt-1">
                  {additionalNotes}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RejectionTooltip;