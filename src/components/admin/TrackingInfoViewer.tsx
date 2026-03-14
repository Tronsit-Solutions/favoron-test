import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrackingEvent {
  status?: string;
  description?: string;
  timestamp?: string;
  date?: string;
  location?: string;
}

interface TrackingInfo {
  trackingNumber?: string;
  shippingCompany?: string;
  trackingUrl?: string;
  currentStatus?: string;
  currentLocation?: string;
  estimatedDelivery?: string | Date;
  notes?: string;
  trackingHistory?: TrackingEvent[];
  uploadedAt?: string;
  createdAt?: string;
}

interface TrackingInfoViewerProps {
  trackingInfo: TrackingInfo;
  className?: string;
}

const formatDate = (d?: string | Date) => {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return undefined;
  return `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT")}`;
};

export default function TrackingInfoViewer({ trackingInfo, className }: TrackingInfoViewerProps) {
  const { toast } = useToast();
  const {
    trackingNumber,
    shippingCompany,
    trackingUrl,
    currentStatus,
    currentLocation,
    estimatedDelivery,
    notes,
    trackingHistory,
    uploadedAt,
    createdAt,
  } = trackingInfo || {};

  const handleCopy = async () => {
    if (!trackingNumber) return;
    const success = await copyToClipboard(trackingNumber);
    if (success) {
      toast({ title: "Copiado", description: "Número de seguimiento copiado" });
    } else {
      toast({ title: "Error", description: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className || ""}`}> 
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-blue-700">
          <span className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Información de seguimiento
          </span>
          {currentStatus && (
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
              {currentStatus}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm text-blue-700">
          {/* Número de seguimiento */}
          {trackingNumber && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Número de seguimiento</p>
                <p className="font-mono text-blue-800">{trackingNumber}</p>
              </div>
              <div className="flex gap-2">
                {trackingUrl && (
                  <Button asChild variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                    </a>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleCopy} className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
              </div>
            </div>
          )}

          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {shippingCompany && (
              <div>
                <span className="text-blue-800 font-medium">Empresa: </span>
                <span className="text-blue-700">{shippingCompany}</span>
              </div>
            )}
            {currentLocation && (
              <div>
                <span className="text-blue-800 font-medium">Ubicación: </span>
                <span className="text-blue-700">{currentLocation}</span>
              </div>
            )}
            {estimatedDelivery && (
              <div>
                <span className="text-blue-800 font-medium">Entrega estimada: </span>
                <span className="text-blue-700">{formatDate(estimatedDelivery)?.split(" ")[0]}</span>
              </div>
            )}
            {(uploadedAt || createdAt) && (
              <div>
                <span className="text-blue-800 font-medium">Actualizado: </span>
                <span className="text-blue-700">{formatDate(uploadedAt || createdAt)}</span>
              </div>
            )}
          </div>

          {notes && (
            <div className="pt-2">
              <p className="text-blue-800 font-medium mb-1">Notas</p>
              <p className="text-blue-700">{notes}</p>
            </div>
          )}

          {/* Historial */}
          {trackingHistory && trackingHistory.length > 0 && (
            <div className="pt-3 border-t border-blue-200">
              <p className="text-blue-800 font-medium mb-2">Historial</p>
              <div className="space-y-1">
                {trackingHistory.slice(0, 3).map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded bg-white/50 px-2 py-1">
                    <span className="truncate">
                      {e.status || e.description}
                    </span>
                    <span className="text-blue-600 text-xs">
                      {formatDate(e.timestamp || e.date)?.split(" ")[0]}
                    </span>
                  </div>
                ))}
                {trackingHistory.length > 3 && (
                  <div className="text-xs text-blue-600 text-center">
                    ... y {trackingHistory.length - 3} eventos más
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
