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
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface TravelerRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, comments: string) => void;
  packageDescription?: string;
}

const TRAVELER_REJECTION_SUGGESTIONS = [
  "El tip ofrecido es muy bajo para este tipo de producto",
  "El paquete es muy grande o pesado para mi equipaje",
  "No podré entregarlo en las fechas indicadas",
  "El producto requiere permisos especiales que no tengo",
  "El lugar de entrega no me queda conveniente",
];

const TravelerRejectionModal = ({
  isOpen,
  onClose,
  onConfirm,
  packageDescription,
}: TravelerRejectionModalProps) => {
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim(), comments.trim());
      // Reset form
      setReason("");
      setComments("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setComments("");
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setReason(suggestion);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Rechazar Pedido
          </DialogTitle>
          <DialogDescription>
            {packageDescription ? (
              <>Estás por rechazar: <strong>{packageDescription}</strong></>
            ) : (
              "Cuéntanos por qué rechazas este pedido para mejorar las asignaciones futuras."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reason field */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
            <Textarea
              id="rejection-reason"
              placeholder="¿Por qué no puedes llevar este pedido?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/500
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sugerencias rápidas:</Label>
            <div className="flex flex-wrap gap-2">
              {TRAVELER_REJECTION_SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-1.5 px-2 whitespace-normal text-left"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>

          {/* Additional comments */}
          <div className="space-y-2">
            <Label htmlFor="additional-comments">
              Comentarios adicionales <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="additional-comments"
              placeholder="¿Algo más que quieras agregar?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[60px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comments.length}/300
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Rechazando..." : "Confirmar Rechazo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TravelerRejectionModal;
