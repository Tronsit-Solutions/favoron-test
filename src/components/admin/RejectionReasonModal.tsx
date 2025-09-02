import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, AlertTriangle } from "lucide-react";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  type: 'package' | 'trip';
  itemName: string;
}

const RejectionReasonModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  type, 
  itemName 
}: RejectionReasonModalProps) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (error) {
      console.error('Error submitting rejection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const suggestions = type === 'package' ? [
    "El producto no está disponible en el país de origen",
    "El precio excede nuestros límites establecidos",
    "El producto requiere permisos especiales de importación",
    "La descripción del producto no es clara o está incompleta",
    "El enlace proporcionado no funciona o no es válido"
  ] : [
    "Las fechas del viaje no son viables",
    "El destino no está dentro de nuestras rutas autorizadas",
    "Información insuficiente sobre el viaje",
    "Las fechas de recepción de paquetes no coinciden",
    "El viaje no cumple con nuestros requisitos de servicio"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-destructive">
            <XCircle className="h-5 w-5" />
            <span>Rechazar {type === 'package' ? 'Solicitud' : 'Viaje'}</span>
          </DialogTitle>
          <DialogDescription>
            Por favor proporciona una razón para rechazar "{itemName}". 
            Esto ayudará al usuario a entender y mejorar futuras solicitudes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Importante:</p>
                <p>El usuario recibirá una notificación con la razón del rechazo. 
                   Sé específico y constructivo para ayudarles a mejorar.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Razón del rechazo *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explica por qué se rechaza esta solicitud..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 caracteres
            </p>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Razones comunes:</Label>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setReason(suggestion)}
                    className="text-left text-xs bg-muted hover:bg-muted/80 rounded px-2 py-1 transition-colors w-full"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionReasonModal;