import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { REJECTION_REASONS } from "@/lib/constants";

interface RejectionTooltipProps {
  quote: any;
  rejectionReason: string;
  wantsRequote: boolean;
  additionalNotes?: string;
}

const RejectionTooltip = ({ 
  quote, 
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
            
            {quote && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">💰 Precio anterior:</span>
                  <span className="ml-2">${quote.price || 'No especificado'}</span>
                </div>
                {quote.message && (
                  <div className="text-sm">
                    <span className="font-medium">💬 Mensaje:</span>
                    <div className="bg-muted p-2 rounded text-xs mt-1 italic">
                      "{quote.message}"
                    </div>
                  </div>
                )}
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