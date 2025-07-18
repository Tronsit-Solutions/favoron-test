import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePackageChat } from "@/hooks/usePackageChat";

interface TrackingInfoFormProps {
  packageId: string;
  currentTracking?: any;
  onSubmit: (data: any) => void;
}

const TrackingInfoForm = ({ 
  packageId, 
  currentTracking, 
  onSubmit 
}: TrackingInfoFormProps) => {
  const [trackingNumber, setTrackingNumber] = useState(currentTracking?.trackingNumber || "");
  const [trackingUrl, setTrackingUrl] = useState(currentTracking?.trackingUrl || "");
  const [shippingCompany, setShippingCompany] = useState(currentTracking?.shippingCompany || "");
  const [notes, setNotes] = useState(currentTracking?.notes || "");
  const [isEditing, setIsEditing] = useState(!currentTracking);
  
  const { toast } = useToast();
  const { sendMessage } = usePackageChat({ packageId });

  const handleSubmit = async () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Campo requerido",
        description: "El número de seguimiento es obligatorio",
        variant: "destructive",
      });
      return;
    }

    const trackingData = {
      trackingNumber: trackingNumber.trim(),
      trackingUrl: trackingUrl.trim() || null,
      shippingCompany: shippingCompany.trim() || null,
      notes: notes.trim() || null,
      timestamp: new Date().toISOString()
    };

    onSubmit(trackingData);
    setIsEditing(false);
    
    // Send message to chat about the tracking info
    await sendMessage(
      `🚚 He agregado información de seguimiento: ${trackingNumber.trim()}${shippingCompany ? ` (${shippingCompany})` : ''}`, 
      'status_update'
    );
    
    toast({
      title: "Información de envío guardada",
      description: "El número de seguimiento se ha registrado correctamente.",
    });
  };

  const isCompleted = !!currentTracking && !isEditing;

  return (
    <Card className={isCompleted ? "border-success-border bg-success-muted" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Información de Tracking</span>
          {isCompleted && <CheckCircle className="h-5 w-5 text-success" />}
        </CardTitle>
        <CardDescription>
          {isCompleted 
            ? "✅ Información de envío guardada correctamente"
            : "Agrega el número de seguimiento cuando esté disponible (independiente de la confirmación de compra)"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCompleted ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 p-4 bg-success-muted border border-success-border rounded-lg">
              <CheckCircle className="h-5 w-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success-foreground">Información de envío guardada</p>
                <p className="text-xs text-success-foreground/75">
                  #{currentTracking.trackingNumber}
                  {currentTracking.shippingCompany && ` • ${currentTracking.shippingCompany}`}
                </p>
                <p className="text-xs text-success-foreground/75">
                  {new Date(currentTracking.timestamp).toLocaleDateString('es-GT')}
                </p>
              </div>
            </div>
            
            {currentTracking.trackingUrl && (
              <div className="p-3 border border-border rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">URL de seguimiento:</p>
                <a 
                  href={currentTracking.trackingUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary hover:underline"
                >
                  🔗 Seguir paquete
                </a>
              </div>
            )}
            
            {currentTracking.notes && (
              <div className="p-3 border border-border rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Notas adicionales:</p>
                <p className="text-sm">{currentTracking.notes}</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="w-full"
            >
              Editar información de envío
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="trackingNumber">Número de seguimiento *</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ej: 1234567890"
              />
            </div>
            
            <div>
              <Label htmlFor="shippingCompany">Empresa de reparto</Label>
              <Input
                id="shippingCompany"
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                placeholder="Ej: DHL, UPS, FedEx, Correos..."
              />
            </div>
            
            <div>
              <Label htmlFor="trackingUrl">URL de seguimiento (opcional)</Label>
              <Input
                id="trackingUrl"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://tracking.carrier.com/track/..."
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional sobre el envío..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmit} 
                disabled={!trackingNumber.trim()}
                className="flex-1"
              >
                Guardar información de envío
              </Button>
              {currentTracking && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingInfoForm;