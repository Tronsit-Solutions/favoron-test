import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Truck, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package } from "@/types";

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'payment_receipt' | 'purchase_confirmation' | 'tracking_info' | null;
  pkg: Package;
  onUpdate: (type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
}

const EditDocumentModal = ({ isOpen, onClose, documentType, pkg, onUpdate }: EditDocumentModalProps) => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize form data when modal opens
  React.useEffect(() => {
    if (isOpen && documentType === 'tracking_info' && pkg.tracking_info) {
      const trackingData = pkg.tracking_info as any;
      setTrackingNumber(trackingData.trackingNumber || "");
      setTrackingUrl(trackingData.trackingUrl || "");
      setNotes(trackingData.notes || "");
    }
  }, [isOpen, documentType, pkg.tracking_info]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !documentType) return;

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
      const fileName = `${pkg.id}_${Date.now()}.${fileExtension}`;
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

      // Prepare data based on document type
      const updateData = {
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        filePath: filePath
      };

      if (documentType === 'purchase_confirmation') {
        onUpdate('confirmation', updateData);
      } else if (documentType === 'payment_receipt') {
        onUpdate('payment_receipt', updateData);
      }
      
      toast({
        title: "¡Documento actualizado!",
        description: "El documento se ha reemplazado correctamente.",
      });

      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTrackingUpdate = () => {
    if (trackingNumber.trim()) {
      onUpdate('tracking', {
        trackingNumber: trackingNumber.trim(),
        trackingUrl: trackingUrl.trim() || null,
        notes: notes.trim() || null,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "¡Información actualizada!",
        description: "La información de seguimiento se ha actualizado correctamente.",
      });
      
      onClose();
    }
  };

  const getModalTitle = () => {
    switch (documentType) {
      case 'payment_receipt':
        return 'Editar comprobante de pago';
      case 'purchase_confirmation':
        return 'Editar confirmación de compra';
      case 'tracking_info':
        return 'Editar información de envío';
      default:
        return 'Editar documento';
    }
  };

  const getModalIcon = () => {
    switch (documentType) {
      case 'payment_receipt':
        return <CreditCard className="h-5 w-5" />;
      case 'purchase_confirmation':
        return <FileText className="h-5 w-5" />;
      case 'tracking_info':
        return <Truck className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!documentType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getModalIcon()}
            <span>{getModalTitle()}</span>
          </DialogTitle>
          <DialogDescription>
            {documentType === 'tracking_info' 
              ? 'Actualiza la información de seguimiento del envío'
              : 'Sube un nuevo archivo para reemplazar el documento actual'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {documentType === 'tracking_info' ? (
            // Tracking information form
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
                onClick={handleTrackingUpdate} 
                className="w-full"
                disabled={!trackingNumber.trim()}
              >
                Actualizar información
              </Button>
            </>
          ) : (
            // File upload form
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf"
                className="hidden"
              />
              
              <Card>
                <CardContent className="pt-6">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona un nuevo archivo para reemplazar el documento actual
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
                          <Upload className="h-4 w-4 mr-2" />
                          Seleccionar nuevo archivo
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Formatos permitidos: PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDocumentModal;