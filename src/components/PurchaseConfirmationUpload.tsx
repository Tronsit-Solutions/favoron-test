import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackageChat } from "@/hooks/usePackageChat";

interface PurchaseConfirmationUploadProps {
  packageId: string;
  currentConfirmation?: any;
  onUpload: (data: any) => void;
}

const PurchaseConfirmationUpload = ({ 
  packageId, 
  currentConfirmation, 
  onUpload 
}: PurchaseConfirmationUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { sendMessage } = usePackageChat({ packageId });

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
      const fileName = `purchase_confirmation_${packageId}_${Date.now()}.${fileExtension}`;
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

      // Update package status to in_transit when confirmation is uploaded
      const { error: updateError } = await supabase
        .from('packages')
        .update({ status: 'in_transit' })
        .eq('id', packageId);

      if (updateError) {
        console.error('Error updating package status:', updateError);
      }

      // Call onUpload with file information
      onUpload({
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        type: 'purchase_confirmation',
        filePath: filePath
      });
      
      // Send message to chat about the uploaded confirmation
      await sendMessage(`📄 He subido la confirmación de compra: ${file.name}`, 'status_update');
      
      toast({
        title: "Confirmación de compra subida exitosamente",
        description: "El paquete ahora está en tránsito. El viajero ha sido notificado.",
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

  const isCompleted = !!currentConfirmation;

  return (
    <Card className={isCompleted ? "border-success-border bg-success-muted" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Confirmación de Compra</span>
          {isCompleted && <CheckCircle className="h-5 w-5 text-success" />}
        </CardTitle>
        <CardDescription>
          {isCompleted 
            ? "✅ Confirmación de compra subida exitosamente"
            : "Sube la confirmación de compra del producto (screenshot, factura, email de confirmación)"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCompleted ? (
          <div className="flex items-center space-x-2 p-4 bg-success-muted border border-success-border rounded-lg">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-success-foreground">Confirmación de compra subida exitosamente</p>
              <p className="text-xs text-success-foreground/75">
                {currentConfirmation.filename} • {new Date(currentConfirmation.uploadedAt).toLocaleDateString('es-GT')}
              </p>
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
  );
};

export default PurchaseConfirmationUpload;