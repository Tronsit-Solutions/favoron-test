
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Link, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadDocumentsProps {
  packageId: number;
  currentStatus: string;
  onUpload: (type: 'confirmation' | 'tracking', data: any) => void;
}

const UploadDocuments = ({ packageId, currentStatus, onUpload }: UploadDocumentsProps) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleTrackingUpload = () => {
    if (trackingNumber.trim()) {
      onUpload('tracking', {
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || null,
        notes: notes.trim() || null,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "¡Información de envío actualizada!",
        description: "Se ha guardado el número de seguimiento.",
      });
      
      setTrackingNumber("");
      setTrackingUrl("");
      setNotes("");
    }
  };

  const handleFileUpload = (type: 'confirmation') => {
    // Simulate file upload
    onUpload(type, {
      filename: `purchase_confirmation_${packageId}.pdf`,
      uploadedAt: new Date().toISOString(),
      type: type
    });
    
    toast({
      title: "¡Archivo subido!",
      description: "La confirmación de compra se ha guardado correctamente.",
    });
  };

  if (!['quote_accepted', 'address_confirmed', 'paid'].includes(currentStatus)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Purchase Confirmation Upload */}
      {(currentStatus === 'quote_accepted' || currentStatus === 'address_confirmed') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Confirmación de Compra</span>
            </CardTitle>
            <CardDescription>
              Sube la confirmación de compra del producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Arrastra tu confirmación de compra aquí o haz clic para seleccionar
              </p>
              <Button 
                onClick={() => handleFileUpload('confirmation')}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Subir Confirmación
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: PDF, JPG, PNG. Máximo 5MB.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tracking Information */}
      {currentStatus === 'paid' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="h-5 w-5" />
              <span>Información de Envío</span>
            </CardTitle>
            <CardDescription>
              Agrega el número de seguimiento del envío al viajero
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            
            <Button 
              onClick={handleTrackingUpload} 
              className="w-full"
              disabled={!trackingNumber.trim()}
            >
              Guardar información de envío
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadDocuments;
