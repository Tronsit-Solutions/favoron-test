
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Link, Package, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackageChat } from "@/hooks/usePackageChat";

interface UploadDocumentsProps {
  packageId: string;
  currentStatus: string;
  onUpload: (type: 'confirmation' | 'tracking', data: any) => void;
}

const UploadDocuments = ({ packageId, currentStatus, onUpload }: UploadDocumentsProps) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmationUploaded, setConfirmationUploaded] = useState(false);
  const [trackingUploaded, setTrackingUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage } = usePackageChat({ packageId });

  const handleTrackingUpload = () => {
    if (trackingNumber.trim()) {
      onUpload('tracking', {
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || null,
        shippingCompany: shippingCompany.trim() || null,
        notes: notes.trim() || null,
        timestamp: new Date().toISOString()
      });
      
      setTrackingUploaded(true);
      
      toast({
        title: "¡Información de envío guardada!",
        description: "El número de seguimiento se ha registrado correctamente.",
      });
      
      setTrackingNumber("");
      setTrackingUrl("");
      setShippingCompany("");
      setNotes("");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos JPG, PNG, GIF, WebP o PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${packageId}_${Date.now()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Error al subir archivo",
          description: "No se pudo subir el archivo. Intenta de nuevo.",
          variant: "destructive",
        });
        return;
      }

      // Call onUpload with file information
      onUpload('confirmation', {
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        type: 'confirmation',
        filePath: filePath
      });
      
      setConfirmationUploaded(true);
      
      // Send message to chat about the uploaded confirmation
      await sendMessage(`📄 He subido la confirmación de compra: ${file.name}`, 'status_update');
      
      toast({
        title: "¡Comprobante subido!",
        description: "La confirmación de compra se ha guardado correctamente.",
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Only show for payment_confirmed status
  if (currentStatus !== 'payment_confirmed') {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Purchase Confirmation Upload */}
      <Card className={confirmationUploaded ? "border-green-200 bg-green-50/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Paso 1: Confirmación de Compra</span>
            {confirmationUploaded && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
          <CardDescription>
            {confirmationUploaded 
              ? "✅ Comprobante de compra subido correctamente"
              : "Sube la confirmación de compra del producto que compraste"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmationUploaded ? (
            <div className="flex items-center space-x-2 p-4 bg-green-100 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Comprobante subido exitosamente</p>
                <p className="text-xs text-green-600">Tu confirmación de compra está guardada</p>
              </div>
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Arrastra tu confirmación de compra aquí o haz clic para seleccionar
                </p>
                <Button 
                  onClick={handleUploadClick}
                  className="w-full"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Subir Confirmación de Compra
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tracking Information */}
      <Card className={trackingUploaded ? "border-green-200 bg-green-50/30" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="h-5 w-5" />
            <span>Paso 2: Información de Envío</span>
            {trackingUploaded && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
          <CardDescription>
            {trackingUploaded 
              ? "✅ Información de envío guardada correctamente"
              : "Agrega el número de seguimiento cuando esté disponible (opcional por ahora)"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {trackingUploaded ? (
            <div className="flex items-center space-x-2 p-4 bg-green-100 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Información de envío guardada</p>
                <p className="text-xs text-green-600">El viajero ya puede hacer seguimiento del paquete</p>
              </div>
            </div>
          ) : (
            <>
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
              
              <Button 
                onClick={handleTrackingUpload} 
                className="w-full"
                disabled={!trackingNumber.trim()}
              >
                Guardar información de envío
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Progress Summary */}
      {(confirmationUploaded || trackingUploaded) && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className={`h-4 w-4 ${confirmationUploaded ? 'text-green-600' : 'text-gray-300'}`} />
                <span className={`text-sm ${confirmationUploaded ? 'text-green-800' : 'text-gray-500'}`}>
                  Comprobante subido
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`h-4 w-4 ${trackingUploaded ? 'text-green-600' : 'text-gray-300'}`} />
                <span className={`text-sm ${trackingUploaded ? 'text-green-800' : 'text-gray-500'}`}>
                  Tracking agregado
                </span>
              </div>
            </div>
            {confirmationUploaded && trackingUploaded && (
              <p className="text-sm text-blue-800 mt-2 font-medium">
                🚚 ¡Perfecto! El pedido pasará a estado "En tránsito"
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UploadDocuments;
