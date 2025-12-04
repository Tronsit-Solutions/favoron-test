import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TravelerRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, comments: string) => void;
  packageDescription?: string;
}

const REJECTION_CHIPS = [
  { id: "tip", label: "Tip bajo", fullReason: "El tip ofrecido es muy bajo para este tipo de producto" },
  { id: "size", label: "Muy grande", fullReason: "El paquete es muy grande o pesado para mi equipaje" },
  { id: "dates", label: "Fechas", fullReason: "No podré entregarlo en las fechas indicadas" },
  { id: "permits", label: "Permisos", fullReason: "El producto requiere permisos especiales que no tengo" },
  { id: "location", label: "Ubicación", fullReason: "El lugar de entrega no me queda conveniente" },
];

const TravelerRejectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  packageDescription,
}: TravelerRejectionModalProps) => {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChipClick = (chipId: string) => {
    setSelectedChip(selectedChip === chipId ? null : chipId);
  };

  const handleSubmit = async () => {
    const selectedReason = REJECTION_CHIPS.find(c => c.id === selectedChip)?.fullReason || "";
    setIsSubmitting(true);
    try {
      await onConfirm(selectedReason, additionalDetails.trim());
      setSelectedChip(null);
      setAdditionalDetails("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedChip(null);
    setAdditionalDetails("");
    onClose();
  };

  const canSubmit = selectedChip !== null || additionalDetails.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm max-w-[90vw] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Rechazar Pedido
          </DialogTitle>
          <DialogDescription className="text-sm">
            ¿Por qué no puedes llevar este pedido?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Selectable chips */}
          <div className="flex flex-wrap gap-2">
            {REJECTION_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  selectedChip === chip.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                {selectedChip === chip.id && <Check className="h-3 w-3" />}
                {chip.label}
              </button>
            ))}
          </div>

          {/* Optional details textarea */}
          <Textarea
            placeholder="Agregar detalles (opcional)..."
            value={additionalDetails}
            onChange={(e) => setAdditionalDetails(e.target.value)}
            className="min-h-[50px] max-h-[80px] resize-none text-sm"
          />
        </div>

        <DialogFooter className="flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className="flex-1"
          >
            {isSubmitting ? "Rechazando..." : "Rechazar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TravelerRejectionModal;
