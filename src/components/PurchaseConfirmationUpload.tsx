
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
      const bucketName = 'purchase-confirmations';

      // Upload to Supabase Storage (purchase-confirmations bucket)
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
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

      // Call onUpload with file information (including bucket for clarity)
      onUpload({
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        type: 'purchase_confirmation',
        filePath: filePath,
        bucket: bucketName,
        mimeType: file.type,
        size: file.size,
      });
      
      // Send message to chat about the uploaded confirmation
      await sendMessage(`📄 He subido la confirmación de compra: ${file.name}`, 'status_update');
      
      toast({
        title: "Confirmación de compra subida exitosamente",
        description: "El viajero puede ver tu confirmación de compra. El tracking es independiente y puedes agregarlo cuando quieras.",
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
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Confirmación de Compra</span>
        {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
      </div>
      
      {isCompleted ? (
        <div className="flex items-center space-x-2 p-3 bg-success/10 border border-success/20 rounded-md">
          <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-success-foreground">Confirmación subida</p>
            <p className="text-xs text-success-foreground/75 truncate">
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
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-3">
              Sube tu confirmación de compra (screenshot, factura, email)
            </p>
            <Button 
              onClick={handleUploadClick}
              size="sm"
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 mr-2" />
                  Subir Confirmación
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, JPG, PNG, GIF, WebP. Máximo 5MB.
          </p>
        </>
      )}
    </div>
  );
};

export default PurchaseConfirmationUpload;
