import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Settings, AlertTriangle } from "lucide-react";

interface TripEditSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'receiving_window' | 'delivery_date' | 'address' | 'other') => void;
  hasActivePackages: boolean;
}

export const TripEditSelectionModal = ({
  isOpen,
  onClose,
  onSelectOption,
  hasActivePackages
}: TripEditSelectionModalProps) => {
  const options = [
    {
      id: 'receiving_window' as const,
      icon: Clock,
      title: 'Ventana de recepción de paquetes',
      description: 'Primer y último día para recibir productos',
      isCritical: true
    },
    {
      id: 'delivery_date' as const,
      icon: Calendar,
      title: 'Fecha de entrega en oficina',
      description: 'Cuándo llevarás los paquetes a Favorón',
      isCritical: true
    },
    {
      id: 'address' as const,
      icon: MapPin,
      title: 'Dirección para recibir paquetes',
      description: 'Dónde recibirás los productos',
      isCritical: true
    },
    {
      id: 'other' as const,
      icon: Settings,
      title: 'Otra información del viaje',
      description: 'Origen, destino, espacio disponible',
      isCritical: false
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ¿Qué deseas modificar?
          </DialogTitle>
          <DialogDescription>
            Selecciona la información que quieres actualizar
          </DialogDescription>
        </DialogHeader>

        {hasActivePackages && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Este viaje tiene paquetes activos. Los shoppers serán notificados de cambios críticos.
            </p>
          </div>
        )}

        <div className="space-y-2 mt-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => onSelectOption(option.id)}
              >
                <div className="flex items-start gap-3 text-left">
                  <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{option.title}</span>
                      {option.isCritical && hasActivePackages && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          ⚠️
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
