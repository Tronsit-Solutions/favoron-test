import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Image } from "lucide-react";

interface DownloadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (daysLimit: number) => void;
  totalTrips: number;
}

export const DownloadConfigModal = ({ 
  isOpen, 
  onClose, 
  onDownload, 
  totalTrips 
}: DownloadConfigModalProps) => {
  const [daysLimit, setDaysLimit] = useState(30);
  
  const filteredTripsCount = Math.min(totalTrips, Math.ceil(totalTrips * 0.8)); // Estimate
  const imagesCount = Math.ceil(filteredTripsCount / 10);

  const handleDownload = () => {
    onDownload(daysLimit);
    onClose();
  };

  const presetDays = [7, 15, 30, 60, 90];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Configurar Descarga
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="days" className="text-sm font-medium">
              Límite de días desde hoy
            </Label>
            <Input
              id="days"
              type="number"
              value={daysLimit}
              onChange={(e) => setDaysLimit(Number(e.target.value))}
              min={1}
              max={365}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2">
              {presetDays.map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  size="sm"
                  onClick={() => setDaysLimit(days)}
                  className="h-7 px-3 text-xs"
                >
                  {days} días
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Viajes hasta {daysLimit} días desde hoy</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Image className="h-4 w-4" />
              <span>Se generarán aproximadamente {imagesCount} imagen(es)</span>
            </div>
            <Badge variant="outline" className="text-xs">
              Máximo 10 viajes por imagen
            </Badge>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};