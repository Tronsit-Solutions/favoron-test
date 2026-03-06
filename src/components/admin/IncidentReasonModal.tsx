import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, RotateCcw, Loader2, MessageSquare } from 'lucide-react';

export type IncidentAction = 'mark' | 'resolve' | 'reopen' | 'comment';

interface IncidentReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => Promise<void>;
  action: IncidentAction;
}

const actionConfig: Record<IncidentAction, {
  title: string;
  description: string;
  placeholder: string;
  label: string;
  buttonLabel: string;
  buttonVariant: 'destructive' | 'default' | 'outline';
  Icon: typeof AlertTriangle;
}> = {
  mark: {
    title: 'Marcar como Incidencia',
    description: 'Describe el problema o la razón de la incidencia. Esta información quedará registrada en el historial.',
    placeholder: 'Ej: Producto dañado al llegar a oficina, se necesita verificar con el viajero...',
    label: 'Razón de la incidencia',
    buttonLabel: 'Marcar Incidencia',
    buttonVariant: 'destructive',
    Icon: AlertTriangle,
  },
  resolve: {
    title: 'Resolver Incidencia',
    description: 'Describe cómo se resolvió la incidencia. Esta información quedará registrada en el historial.',
    placeholder: 'Ej: Se verificó con el viajero, producto en buen estado. Fue un error de comunicación...',
    label: 'Notas de resolución',
    buttonLabel: 'Resolver Incidencia',
    buttonVariant: 'default',
    Icon: CheckCircle,
  },
  reopen: {
    title: 'Reabrir Incidencia',
    description: 'Describe por qué se reabre la incidencia.',
    placeholder: 'Ej: Se encontró un problema adicional con el producto...',
    label: 'Razón para reabrir',
    buttonLabel: 'Reabrir Incidencia',
    buttonVariant: 'destructive',
    Icon: RotateCcw,
  },
  comment: {
    title: 'Agregar Comentario',
    description: 'Agrega una nota o comentario a esta incidencia sin cambiar su estado.',
    placeholder: 'Ej: Se contactó al viajero, queda pendiente respuesta...',
    label: 'Comentario',
    buttonLabel: 'Agregar Comentario',
    buttonVariant: 'outline',
    Icon: MessageSquare,
  },
};

const IncidentReasonModal = ({ isOpen, onClose, onConfirm, action }: IncidentReasonModalProps) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = actionConfig[action];

  const handleConfirm = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(text.trim());
      setText('');
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setText('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.Icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="incident-text">{config.label}</Label>
          <Textarea
            id="incident-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={config.placeholder}
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <config.Icon className="h-4 w-4 mr-2" />
            )}
            {config.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentReasonModal;
