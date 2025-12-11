import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useTripEditNotifications } from "@/hooks/useTripEditNotifications";
import { normalizeToMiddayUTC } from "@/lib/formatters";

interface TripEditReceivingWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { firstDayPackages: Date; lastDayPackages: Date }) => void;
  tripData: any;
  hasActivePackages: boolean;
}

export const TripEditReceivingWindowModal = ({
  isOpen,
  onClose,
  onSubmit,
  tripData,
  hasActivePackages
}: TripEditReceivingWindowModalProps) => {
  const { toast } = useToast();
  const { notifyShoppersOfTripChange } = useTripEditNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [firstDayPackages, setFirstDayPackages] = useState<Date | null>(
    tripData?.first_day_packages ? new Date(tripData.first_day_packages) : null
  );
  const [lastDayPackages, setLastDayPackages] = useState<Date | null>(
    tripData?.last_day_packages ? new Date(tripData.last_day_packages) : null
  );

  useEffect(() => {
    if (tripData) {
      setFirstDayPackages(tripData.first_day_packages ? new Date(tripData.first_day_packages) : null);
      setLastDayPackages(tripData.last_day_packages ? new Date(tripData.last_day_packages) : null);
    }
  }, [tripData]);

  const handleSubmit = async () => {
    if (!firstDayPackages || !lastDayPackages) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona ambas fechas",
        variant: "destructive"
      });
      return;
    }

    if (firstDayPackages > lastDayPackages) {
      toast({
        title: "Fechas inválidas",
        description: "El primer día debe ser antes del último día",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit the change
      onSubmit({
        firstDayPackages: normalizeToMiddayUTC(firstDayPackages),
        lastDayPackages: normalizeToMiddayUTC(lastDayPackages)
      });

      // Notify shoppers if there are active packages
      if (hasActivePackages && tripData?.id) {
        const { notifiedCount } = await notifyShoppersOfTripChange(
          tripData.id,
          'receiving_window',
          {
            first_day_packages: firstDayPackages.toISOString(),
            last_day_packages: lastDayPackages.toISOString()
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
      console.error('Error updating receiving window:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la ventana de recepción",
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
            <Clock className="h-5 w-5" />
            Ventana de Recepción de Paquetes
          </DialogTitle>
          <DialogDescription>
            Define las fechas en que podrás recibir productos
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
            <Label>Primer día para recibir paquetes *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {firstDayPackages ? (
                    format(firstDayPackages, "PPP", { locale: es })
                  ) : (
                    <span className="text-muted-foreground">Selecciona fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={firstDayPackages || undefined}
                  onSelect={(date) => setFirstDayPackages(date || null)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Último día para recibir paquetes *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastDayPackages ? (
                    format(lastDayPackages, "PPP", { locale: es })
                  ) : (
                    <span className="text-muted-foreground">Selecciona fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={lastDayPackages || undefined}
                  onSelect={(date) => setLastDayPackages(date || null)}
                  disabled={(date) => 
                    date < new Date() || 
                    (firstDayPackages ? date < firstDayPackages : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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
