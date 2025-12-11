import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Building2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useTripEditNotifications } from "@/hooks/useTripEditNotifications";
import { normalizeToMiddayUTC } from "@/lib/formatters";

interface TripEditDeliveryDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { deliveryDate: Date }) => void;
  tripData: any;
  hasActivePackages: boolean;
}

export const TripEditDeliveryDateModal = ({
  isOpen,
  onClose,
  onSubmit,
  tripData,
  hasActivePackages
}: TripEditDeliveryDateModalProps) => {
  const { toast } = useToast();
  const { notifyShoppersOfTripChange } = useTripEditNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(
    tripData?.delivery_date ? new Date(tripData.delivery_date) : null
  );

  useEffect(() => {
    if (tripData) {
      setDeliveryDate(tripData.delivery_date ? new Date(tripData.delivery_date) : null);
    }
  }, [tripData]);

  const handleSubmit = async () => {
    if (!deliveryDate) {
      toast({
        title: "Campo requerido",
        description: "Por favor selecciona la fecha de entrega",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the change
      onSubmit({
        deliveryDate: normalizeToMiddayUTC(deliveryDate)
      });

      // Notify shoppers if there are active packages
      if (hasActivePackages && tripData?.id) {
        const { notifiedCount } = await notifyShoppersOfTripChange(
          tripData.id,
          'delivery_date',
          {
            delivery_date: deliveryDate.toISOString()
          }
        );

        if (notifiedCount > 0) {
          toast({
            title: "Shoppers notificados",
            description: `Se notificó a ${notifiedCount} shopper(s) del cambio`,
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Error updating delivery date:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la fecha de entrega",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Fecha de Entrega en Oficina
          </DialogTitle>
          <DialogDescription>
            Define cuándo entregarás los paquetes en la oficina de Favorón
          </DialogDescription>
        </DialogHeader>

        {hasActivePackages && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Los shoppers con paquetes activos serán notificados de este cambio.
            </p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Fecha de entrega en oficina *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? (
                    format(deliveryDate, "PPP", { locale: es })
                  ) : (
                    <span className="text-muted-foreground">Selecciona fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate || undefined}
                  onSelect={(date) => setDeliveryDate(date || null)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Esta es la fecha en que llevarás los paquetes a la oficina de Favorón para su distribución.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
