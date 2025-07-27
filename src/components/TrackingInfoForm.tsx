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
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Información de Tracking</span>
        {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
      </div>
      
      {isCompleted ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-md">
            <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-success-foreground">Tracking agregado</p>
              <p className="text-xs text-success-foreground/75 truncate">
                #{currentTracking.trackingNumber}
                {currentTracking.shippingCompany && ` • ${currentTracking.shippingCompany}`}
              </p>
            </div>
          </div>
          
          {currentTracking.trackingUrl && (
            <div className="p-2 border border-border rounded-md">
              <a 
                href={currentTracking.trackingUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-primary hover:underline"
              >
                🔗 Seguir paquete
              </a>
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="w-full h-8"
          >
            Editar tracking
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="trackingNumber" className="text-xs">Número de seguimiento *</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ej: 1234567890"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="shippingCompany" className="text-xs">Empresa de reparto</Label>
              <Input
                id="shippingCompany"
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                placeholder="Ej: DHL, UPS, FedEx..."
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="trackingUrl" className="text-xs">URL de seguimiento</Label>
              <Input
                id="trackingUrl"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://tracking.carrier.com/..."
                className="h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!trackingNumber.trim()}
              size="sm"
              className="flex-1 h-8"
            >
              Guardar tracking
            </Button>
            {currentTracking && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                size="sm"
                className="h-8"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingInfoForm;